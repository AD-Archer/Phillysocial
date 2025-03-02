'use client';
import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaEllipsisH, FaTrash, FaEdit } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import Image from 'next/image';

// Simple date formatter until date-fns is installed
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
};

interface PostCardProps {
  post: Post;
  channel?: {
    admins: string[];
  };
  onPostDeleted?: (postId: string) => void;
  onPostEdited?: (postId: string, newContent: string, editedAt: Date) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, channel, onPostDeleted, onPostEdited }) => {
  const [isLiked, setIsLiked] = useState(post.likes.includes(useAuth().user?.uid || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Check if current user is admin or post creator
  const isAdmin = channel?.admins?.includes(user?.uid || '');
  const isPostCreator = post.authorId === user?.uid;
  // Only post creator can edit, admins can only delete
  const canEditPost = isPostCreator;
  
  // Handle click outside to close options menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const handleLike = async () => {
    if (!user) return;
    
    const postRef = doc(db, 'posts', post.id);
    
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
        setLikeCount(prev => prev - 1);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !commentText.trim()) return;
    
    setIsSubmittingComment(true);
    
    try {
      const newComment: Comment = {
        id: Date.now().toString(), // Simple ID generation
        content: commentText.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || undefined,
        createdAt: new Date()
      };
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      
      // Update local state
      post.comments.push(newComment);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setShowOptions(false);
    
    try {
      const postRef = doc(db, 'posts', post.id);
      await deleteDoc(postRef);
      
      // Notify parent component about deletion
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditPost = () => {
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !canEditPost || !editedContent.trim()) return;
    
    setIsSubmittingEdit(true);
    
    try {
      const now = new Date();
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        content: editedContent.trim(),
        lastEdited: now,
      });
      
      // Update local state
      post.content = editedContent.trim();
      post.lastEdited = now;
      
      // Notify parent component about edit
      if (onPostEdited) {
        onPostEdited(post.id, editedContent.trim(), now);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 relative ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}>
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
        </div>
      )}
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
          <Image
            src={post.authorPhotoURL || '/default-avatar.png'}
            alt={`${post.authorName}'s profile`}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{post.authorName}</h3>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
            
            {(isPostCreator || isAdmin) && (
              <div className="relative" ref={optionsRef}>
                <button 
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowOptions(!showOptions)}
                  aria-label="Post options"
                >
                  <FaEllipsisH size={16} />
                </button>
                
                {showOptions && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                    {canEditPost && (
                      <button
                        onClick={handleEditPost}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                      >
                        <FaEdit className="mr-2" size={14} />
                        Edit post
                      </button>
                    )}
                    <button
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center transition-colors"
                    >
                      <FaTrash className="mr-2" size={14} />
                      {isDeleting ? 'Deleting...' : 'Delete post'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleSubmitEdit} className="mt-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:ring-[#004C54] focus:border-[#004C54] min-h-[100px]"
                placeholder="What's on your mind?"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editedContent.trim() || isSubmittingEdit}
                  className="px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
              {post.lastEdited && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  Edited {formatTimeAgo(post.lastEdited)}
                </p>
              )}
            </>
          )}
          
          <div className="mt-4 flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            >
              {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
              <span>{likeCount}</span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <FaComment size={16} />
              <span>{post.comments.length}</span>
            </button>
          </div>
          
          {showComments && (
            <div className="mt-4 space-y-4">
              {post.comments.length > 0 ? (
                <div className="space-y-3">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        {comment.authorPhotoURL ? (
                          <Image
                            src={comment.authorPhotoURL}
                            alt={comment.authorName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
                            {comment.authorName[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
              )}
              
              <form onSubmit={handleSubmitComment} className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 p-2 border rounded-md text-sm focus:ring-[#004C54] focus:border-[#004C54]"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="px-3 py-2 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] disabled:opacity-50"
                >
                  {isSubmittingComment ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard; 