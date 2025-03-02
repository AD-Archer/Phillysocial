'use client';
import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaEdit, FaEllipsisV, FaTimes, FaCheck, FaShare, FaReply } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  
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
        lastEdited: null,
        isDeleted: false,
        ...(user.photoURL && { authorPhotoURL: user.photoURL })
      };
      
      // Create a comment object for Firestore
      const firestoreComment = {
        id: commentId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: Timestamp.fromDate(now),
        lastEdited: null,
        isDeleted: false,
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
      // Instead of deleting the post, mark it as deleted
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        isDeleted: true,
        content: "[This post has been deleted]",
        lastEdited: Timestamp.fromDate(new Date())
      });
      
      // Update the local state
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

  // Function to handle comment deletion (soft delete)
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Create a deep copy of comments
      const updatedComments = JSON.parse(JSON.stringify(comments));
      
      // Function to find and mark a comment as deleted
      const markCommentAsDeleted = (commentsArray: Comment[], id: string): boolean => {
        for (let i = 0; i < commentsArray.length; i++) {
          if (commentsArray[i].id === id) {
            // Check if user is the author of the comment
            if (commentsArray[i].authorId !== user.uid) {
              showToast('You can only delete your own comments', 'error');
              return false;
            }
            
            // Mark as deleted but keep the structure
            commentsArray[i].isDeleted = true;
            commentsArray[i].content = "[This comment has been deleted]";
            return true;
          }
          
          // Check in replies if they exist
          const replies = commentsArray[i].replies;
          if (replies && replies.length > 0) {
            const found = markCommentAsDeleted(replies, id);
            if (found) return true;
          }
        }
        return false;
      };
      
      // Find and mark the comment as deleted
      const success = markCommentAsDeleted(updatedComments, commentId);
      
      if (!success) {
        return;
      }
      
      // Update Firestore
      await updateDoc(postRef, {
        comments: updatedComments
      });
      
      // Update local state
      setComments(updatedComments);
      showToast('Comment deleted', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast('Failed to delete comment', 'error');
    }
  };

  // Function to handle comment editing
  const handleEditComment = async (commentId: string) => {
    if (!user || !editedCommentContent.trim()) return;
    
    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Create a deep copy of comments
      const updatedComments = JSON.parse(JSON.stringify(comments));
      
      // Function to find and update a comment
      const updateComment = (commentsArray: Comment[], id: string): boolean => {
        for (let i = 0; i < commentsArray.length; i++) {
          if (commentsArray[i].id === id) {
            // Check if user is the author of the comment
            if (commentsArray[i].authorId !== user.uid) {
              showToast('You can only edit your own comments', 'error');
              return false;
            }
            
            // Update the content and add lastEdited timestamp
            commentsArray[i].content = editedCommentContent.trim();
            commentsArray[i].lastEdited = new Date();
            return true;
          }
          
          // Check in replies if they exist
          const replies = commentsArray[i].replies;
          if (replies && replies.length > 0) {
            const found = updateComment(replies, id);
            if (found) return true;
          }
        }
        return false;
      };
      
      // Find and update the comment
      const success = updateComment(updatedComments, commentId);
      
      if (!success) {
        return;
      }
      
      // Update Firestore with the current timestamp
      await updateDoc(postRef, {
        comments: updatedComments
      });
      
      // Update local state
      setComments(updatedComments);
      setEditingComment(null);
      setEditedCommentContent('');
      showToast('Comment updated', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast('Failed to update comment', 'error');
    }
  };

  // Function to handle comment replies
  const handleReplySubmit = async (parentId: string) => {
    if (!user || !newComment.trim()) return;
    
    setIsSubmittingComment(true);
    setError(null);
    
    try {
      const commentId = Math.random().toString(36).substring(2, 9);
      const now = new Date();
      
      // Create a reply comment object
      const newReplyObj: Comment = {
        id: commentId,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        createdAt: now,
        parentId: parentId,
        lastEdited: null,
        isDeleted: false,
        ...(user.photoURL && { authorPhotoURL: user.photoURL })
      };
      
      // Create a deep copy of comments
      const updatedComments = JSON.parse(JSON.stringify(comments));
      
      // Function to find the parent comment and add the reply
      const addReplyToComment = (commentsArray: Comment[], id: string): boolean => {
        for (let i = 0; i < commentsArray.length; i++) {
          if (commentsArray[i].id === id) {
            // Initialize replies array if it doesn't exist
            if (!commentsArray[i].replies) {
              commentsArray[i].replies = [];
            }
            
            // Add the reply - TypeScript non-null assertion since we just initialized it if it was undefined
            commentsArray[i].replies!.push(newReplyObj);
            return true;
          }
          
          // Check in replies if they exist
          const replies = commentsArray[i].replies;
          if (replies && replies.length > 0) {
            const found = addReplyToComment(replies, id);
            if (found) return true;
          }
        }
        return false;
      };
      
      // Find the parent comment and add the reply
      const success = addReplyToComment(updatedComments, parentId);
      
      if (!success) {
        throw new Error('Parent comment not found');
      }
      
      // Update Firestore
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: updatedComments
      });
      
      // Update local state
      setComments(updatedComments);
      setNewComment('');
      setReplyingTo(null);
      showToast('Reply added', 'success');
    } catch (error) {
      console.error('Error adding reply:', error);
      setError('Failed to add reply');
      showToast('Failed to add reply', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Function to render a comment and its replies recursively
  const renderComment = (comment: Comment, level = 0) => {
    return (
      <div key={comment.id} className={`mb-3 last:mb-0 ${level > 0 ? 'ml-6 sm:ml-8' : ''}`}>
        <div className="flex items-start">
          {comment.authorPhotoURL && !comment.isDeleted ? (
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
              {comment.isDeleted ? '?' : comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="bg-white p-2 rounded-lg shadow-sm flex-1">
            <div className="flex justify-between items-center mb-1 flex-wrap">
              <h4 className="text-xs sm:text-sm font-medium text-gray-800">
                {comment.isDeleted ? 'Deleted User' : comment.authorName}
              </h4>
              <span className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
                {comment.lastEdited && (
                  <span className="ml-1">(edited)</span>
                )}
              </span>
            </div>
            
            {editingComment === comment.id ? (
              <div>
                <textarea
                  value={editedCommentContent}
                  onChange={(e) => setEditedCommentContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C54] text-xs sm:text-sm resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setEditingComment(null);
                      setEditedCommentContent('');
                    }}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="px-2 py-1 text-xs bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-xs sm:text-sm ${comment.isDeleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                  {comment.content}
                </p>
                
                {!comment.isDeleted && (
                  <div className="mt-1 flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setNewComment('');
                        setTimeout(() => {
                          if (replyInputRef.current) {
                            replyInputRef.current.focus();
                          }
                        }, 0);
                      }}
                      className="text-xs text-gray-500 hover:text-[#004C54] flex items-center"
                    >
                      <FaReply className="mr-1" size={10} /> Reply
                    </button>
                    
                    {user && user.uid === comment.authorId && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditedCommentContent(comment.content);
                          }}
                          className="text-xs text-gray-500 hover:text-[#004C54] flex items-center"
                        >
                          <FaEdit className="mr-1" size={10} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this comment?')) {
                              handleDeleteComment(comment.id);
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center"
                        >
                          <FaTrash className="mr-1" size={10} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="ml-6 sm:ml-8 mt-2">
            <div className="flex items-start">
              {user?.photoURL ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0">
                  <Image 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-xs">
                  {(user?.displayName || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <textarea
                  ref={replyInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Reply to ${comment.authorName}...`}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004C54] text-xs resize-none"
                  rows={1}
                  disabled={isSubmittingComment}
                />
                
                <div className="mt-1 flex justify-end space-x-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className={`px-2 py-1 text-xs rounded-md text-white ${
                      isSubmittingComment || !newComment.trim()
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#004C54] hover:bg-[#003940]'
                    }`}
                    disabled={isSubmittingComment || !newComment.trim()}
                  >
                    {isSubmittingComment ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Render replies if any */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    );
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
          {post.authorPhotoURL && !post.isDeleted ? (
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
              {post.isDeleted ? '?' : post.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-800 text-sm sm:text-base">
              {post.isDeleted ? 'Deleted User' : post.authorName}
            </h3>
            <p className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
              {post.lastEdited && (
                <span className="ml-1">(edited)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Post Actions Menu */}
        {isAuthor && !post.isDeleted && (
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
          <p className={`whitespace-pre-wrap text-sm sm:text-base ${post.isDeleted ? 'text-gray-400 italic' : 'text-gray-800'}`}>
            {post.content}
          </p>
        )}
        
        {post.imageUrl && !post.isDeleted && (
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
            disabled={post.isDeleted}
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
            disabled={post.isDeleted}
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
            <div className="px-3 sm:px-4 py-2 sm:py-3 max-h-[350px] sm:max-h-[400px] overflow-y-auto">
              {comments.length > 0 ? (
                comments.map(comment => renderComment(comment))
              ) : (
                <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">No comments yet. Be the first to comment!</p>
              )}
            </div>
            
            {/* Comment Form */}
            {user && !post.isDeleted && (
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