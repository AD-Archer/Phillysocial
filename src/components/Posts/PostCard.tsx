'use client';
import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaEdit, FaEllipsisV, FaTimes, FaCheck, FaShare } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useToast } from '../../layouts/Toast';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

// Simple date formatter
const formatDate = (date: Date | null | undefined): string => {
  // If date is null or undefined, return 'just now'
  if (!date) {
    return 'just now';
  }
  
  // Ensure date is a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if dateObj is valid
  if (isNaN(dateObj.getTime())) {
    return 'just now';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }
  
  return dateObj.toLocaleDateString();
};

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus comment input when showing comments
  useEffect(() => {
    if (showComments && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [showComments]);

  const handleLike = async () => {
    if (!user) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      const isLiked = likes.includes(user.uid);
      
      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikes(likes.filter(id => id !== user.uid));
      } else {
        // Like
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikes([...likes, user.uid]);
      }
    } catch (error) {
      console.error('Error updating like:', error);
      setError('Failed to update like status');
      showToast('Failed to update like status', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.authorName}`,
        text: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        url: window.location.href,
      })
      .then(() => showToast('Post shared successfully', 'success'))
      .catch((error) => console.error('Error sharing post:', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('Link copied to clipboard', 'success'))
        .catch(() => showToast('Failed to copy link', 'error'));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    setError(null);
    
    try {
      const commentId = Math.random().toString(36).substring(2, 9);
      const now = new Date();
      
      // Create a comment object for the UI
      const newCommentObj: Comment = {
        id: commentId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: now,
        ...(user.photoURL && { authorPhotoURL: user.photoURL })
      };
      
      // Create a comment object for Firestore
      const firestoreComment = {
        id: commentId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: Timestamp.fromDate(now),
        ...(user.photoURL && { authorPhotoURL: user.photoURL })
      };
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(firestoreComment)
      });
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
      showToast('Comment added', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
      showToast('Failed to add comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;
    
    // Check if user is the author or an admin (implement admin check as needed)
    if (user.uid !== post.authorId) {
      setError('You do not have permission to delete this post');
      showToast('You do not have permission to delete this post', 'error');
      return;
    }
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      
      if (onDelete) {
        onDelete(post.id);
      }
      showToast('Post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
      showToast('Failed to delete post', 'error');
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!user) return;
    
    // Check if user is the author
    if (user.uid !== post.authorId) {
      setError('You do not have permission to edit this post');
      showToast('You do not have permission to edit this post', 'error');
      return;
    }
    
    if (!editedContent.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    
    setError(null);
    
    try {
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        content: editedContent.trim(),
        lastEdited: Timestamp.fromDate(new Date())
      });
      
      showToast('Post updated successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post');
      showToast('Failed to update post', 'error');
    }
  };

  const isLiked = user ? likes.includes(user.uid) : false;
  const isAuthor = user ? user.uid === post.authorId : false;

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Post Header */}
      <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          {post.authorPhotoURL ? (
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden mr-2 sm:mr-3">
              <Image 
                src={post.authorPhotoURL} 
                alt={post.authorName}
                fill
                sizes="(max-width: 768px) 32px, 40px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-2 sm:mr-3">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-800 text-sm sm:text-base">{post.authorName}</h3>
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
              {post.lastEdited && (
                <span className="ml-1">(edited)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Post Actions Menu */}
        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              aria-label="Post options"
            >
              <FaEllipsisV />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    disabled={isDeleting}
                  >
                    <FaEdit className="mr-2" /> Edit Post
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this post?')) {
                        handleDeletePost();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                    disabled={isDeleting}
                  >
                    <FaTrash className="mr-2" /> Delete Post
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Post Content */}
      <div className="p-3 sm:p-4">
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54] min-h-[100px]"
              placeholder="Edit your post..."
              autoFocus
            />
            
            {error && (
              <div className="mt-2 text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(post.content);
                  setError(null);
                }}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
              >
                <FaTimes className="mr-1" /> Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center"
              >
                <FaCheck className="mr-1" /> Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">{post.content}</p>
        )}
        
        {post.imageUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <Image 
              src={post.imageUrl} 
              alt="Post image"
              width={500}
              height={300}
              className="w-full object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isLiked ? <FaHeart /> : <FaRegHeart />}
            </motion.div>
            <span className="text-xs sm:text-sm">{likes.length}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-500 hover:text-[#004C54]"
            aria-label={showComments ? 'Hide comments' : 'Show comments'}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaComment />
            </motion.div>
            <span className="text-xs sm:text-sm">{comments.length}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-1 text-gray-500 hover:text-[#004C54]"
            aria-label="Share post"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaShare />
            </motion.div>
            <span className="hidden sm:inline text-xs sm:text-sm">Share</span>
          </button>
        </div>
        
        <div className="text-xs text-gray-500 hidden sm:block">
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </div>
      </div>
      
      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            className="border-t border-gray-100 bg-gray-50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Comment List */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="mb-3 last:mb-0">
                    <div className="flex items-start">
                      {comment.authorPhotoURL ? (
                        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                          <Image 
                            src={comment.authorPhotoURL} 
                            alt={comment.authorName}
                            fill
                            sizes="(max-width: 768px) 24px, 32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-xs sm:text-sm">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="bg-white p-2 rounded-lg shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-1 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-800">{comment.authorName}</h4>
                          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">No comments yet. Be the first to comment!</p>
              )}
            </div>
            
            {/* Comment Form */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="p-2 sm:p-3 border-t border-gray-200">
                <div className="flex items-start">
                  {user.photoURL ? (
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'}
                        fill
                        sizes="(max-width: 768px) 24px, 32px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-xs sm:text-sm">
                      {(user.displayName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C54] text-xs sm:text-sm resize-none"
                      rows={isMobile ? 1 : 2}
                      disabled={isSubmittingComment}
                    />
                    
                    {error && (
                      <div className="mt-1 text-red-600 text-xs">
                        {error}
                      </div>
                    )}
                    
                    <div className="mt-2 flex justify-end">
                      <button
                        type="submit"
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg text-white ${
                          isSubmittingComment || !newComment.trim()
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#004C54] hover:bg-[#003940]'
                        }`}
                        disabled={isSubmittingComment || !newComment.trim()}
                      >
                        {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard; 