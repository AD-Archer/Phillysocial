'use client';
import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaEllipsisH, FaTrash, FaEdit, FaReply } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import UserAvatar from '@/components/UserAvatar';
import UserProfileLink from '@/components/UserProfileLink';

// Simple date formatter until date-fns is installed
const formatTimeAgo = (date: Date | { toDate: () => Date } | unknown): string => {
  // Ensure we have a valid Date object
  const validDate = date instanceof Date ? date : 
                   (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') ? date.toDate() : 
                   new Date();
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - validDate.getTime()) / 1000);
  
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

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onReplyAdded: (parentCommentId: string, newReply: Comment) => void;
  onCommentDeleted: (commentId: string) => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, onReplyAdded, onCommentDeleted, level = 0 }) => {
  const [authorInfo, setAuthorInfo] = useState({
    name: comment.authorName,
    photoURL: comment.authorPhotoURL || undefined
  });
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Maximum nesting level to prevent excessive indentation
  const MAX_NESTING_LEVEL = 3;
  const currentLevel = Math.min(level, MAX_NESTING_LEVEL);

  // Check if the current user can delete this comment
  const canDeleteComment = user && (user.uid === comment.authorId);

  // Handle clicks outside the options menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch the latest author information from Firestore
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      try {
        const authorRef = doc(db, 'users', comment.authorId);
        const authorDoc = await getDoc(authorRef);
        
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          setAuthorInfo({
            name: authorData.displayName || comment.authorName,
            photoURL: authorData.photoURL || comment.authorPhotoURL
          });
        }
      } catch (error) {
        console.error('Error fetching comment author info:', error);
      }
    };
    
    fetchAuthorInfo();
  }, [comment.authorId, comment.authorName, comment.authorPhotoURL]);

  // Ensure createdAt is a valid Date object
  const createdAt = comment.createdAt instanceof Date 
    ? comment.createdAt 
    : (comment.createdAt && typeof comment.createdAt === 'object' && 
       'toDate' in comment.createdAt && 
       typeof (comment.createdAt as { toDate: () => Date }).toDate === 'function')
      ? (comment.createdAt as { toDate: () => Date }).toDate()
      : new Date();
      
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !replyText.trim()) return;
    
    setIsSubmittingReply(true);
    
    try {
      // Use Firestore user data if available, fallback to Firebase user data
      const displayName = user.firestoreData?.displayName || user.displayName || 'Anonymous';
      const photoURL = user.firestoreData?.photoURL || user.photoURL || undefined;
      
      const newReply: Comment = {
        id: Date.now().toString(), // Simple ID generation
        content: replyText.trim(),
        authorId: user.uid,
        authorName: displayName,
        authorPhotoURL: photoURL,
        createdAt: new Date(),
        parentId: comment.id,
        replies: []
      };
      
      // Call the parent handler to update the post with the new reply
      onReplyAdded(comment.id, newReply);
      
      // Reset form
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    setShowOptions(false);
    
    try {
      // Create a deep copy of the current comments array
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const postData = postDoc.data();
        const updatedComments = JSON.parse(JSON.stringify(postData.comments)) as Comment[];
        
        // Helper function to recursively find and mark the comment as deleted
        const markCommentAsDeleted = (comments: Comment[], commentId: string): boolean => {
          for (let i = 0; i < comments.length; i++) {
            const currentComment = comments[i];
            
            if (currentComment.id === commentId) {
              // Mark the comment as deleted but keep its structure
              currentComment.content = "[This comment has been deleted]";
              currentComment.isDeleted = true;
              return true;
            }
            
            // Check nested replies if they exist
            if (currentComment.replies && currentComment.replies.length > 0) {
              const found = markCommentAsDeleted(currentComment.replies, commentId);
              if (found) return true;
            }
          }
          return false;
        };
        
        // Mark the comment as deleted
        markCommentAsDeleted(updatedComments, comment.id);
        
        // Update Firestore with the modified comments
        await updateDoc(postRef, {
          comments: updatedComments
        });
        
        // Notify parent component about deletion
        onCommentDeleted(comment.id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate left margin based on nesting level
  const marginLeft = currentLevel > 0 ? `${currentLevel * 16}px` : '0';
  
  return (
    <div style={{ marginLeft }} className={`${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex space-x-2">
        <UserAvatar
          userId={comment.authorId}
          displayName={authorInfo.name}
          photoURL={authorInfo.photoURL}
          size={32}
          className="flex-shrink-0"
        />
        <div className="flex-1 bg-gray-100 rounded-lg p-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <UserProfileLink 
                userId={comment.authorId}
                displayName={authorInfo.name}
                className="font-medium text-sm"
              />
              {comment.isDeleted && (
                <span className="ml-2 text-xs text-gray-500 italic">(deleted)</span>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2">
                {formatTimeAgo(createdAt)}
              </span>
              
              {canDeleteComment && !comment.isDeleted && (
                <div className="relative" ref={optionsRef}>
                  <button
                    className="text-gray-500 hover:text-gray-700 p-1"
                    onClick={() => setShowOptions(!showOptions)}
                    aria-label="Comment options"
                  >
                    <FaEllipsisH size={12} />
                  </button>
                  
                  {showOptions && (
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                      <button
                        onClick={handleDeleteComment}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center transition-colors"
                      >
                        <FaTrash className="mr-2" size={12} />
                        {isDeleting ? 'Deleting...' : 'Delete comment'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className={`text-sm mt-1 ${comment.isDeleted ? 'text-gray-500 italic' : 'text-gray-700'}`}>
            {comment.content}
          </p>
          
          {user && !comment.isDeleted && (
            <div className="mt-2 flex items-center">
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-gray-500 hover:text-[#004C54] flex items-center"
              >
                <FaReply size={10} className="mr-1" />
                {showReplyForm ? 'Cancel' : 'Reply'}
              </button>
              
              {comment.replies && comment.replies.length > 0 && (
                <button 
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-gray-500 hover:text-[#004C54] ml-3"
                >
                  {showReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showReplyForm && (
        <div className="ml-10 mt-2">
          <form onSubmit={handleSubmitReply} className="flex space-x-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 p-2 border rounded-md text-sm focus:ring-[#004C54] focus:border-[#004C54]"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmittingReply}
              className="px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] disabled:opacity-50"
            >
              {isSubmittingReply ? 'Sending...' : 'Reply'}
            </button>
          </form>
        </div>
      )}
      
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              postId={postId}
              onReplyAdded={onReplyAdded}
              onCommentDeleted={onCommentDeleted}
              level={currentLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [forceUpdate, setForceUpdate] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Add state for updated author info
  const [authorInfo, setAuthorInfo] = useState({
    name: post.authorName,
    photoURL: post.authorPhotoURL || '/default-avatar.png'
  });

  // Add effect that depends on forceUpdate to trigger re-renders when comments are deleted
  useEffect(() => {
    // This effect will run whenever forceUpdate changes
    // It helps ensure the component re-renders after comment deletions
    if (forceUpdate) {
      // Log that a re-render was triggered by forceUpdate
      console.log('Component re-rendered due to comment deletion');
      
      // You could also perform additional actions here if needed
      // For example, refreshing comment counts or updating UI elements
    }
  }, [forceUpdate]);

  // Fetch the latest author information from Firestore
  useEffect(() => {
    const fetchAuthorInfo = async () => {
      try {
        const authorRef = doc(db, 'users', post.authorId);
        const authorDoc = await getDoc(authorRef);
        
        if (authorDoc.exists()) {
          const authorData = authorDoc.data();
          setAuthorInfo({
            name: authorData.displayName || post.authorName,
            photoURL: authorData.photoURL || post.authorPhotoURL || '/default-avatar.png'
          });
        }
      } catch (error) {
        console.error('Error fetching author info:', error);
      }
    };
    
    fetchAuthorInfo();
  }, [post.authorId, post.authorName, post.authorPhotoURL]);

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
      // Use Firestore user data if available, fallback to Firebase user data
      const displayName = user.firestoreData?.displayName || user.displayName || 'Anonymous';
      const photoURL = user.firestoreData?.photoURL || user.photoURL || undefined;
      
      const newComment: Comment = {
        id: Date.now().toString(), // Simple ID generation
        content: commentText.trim(),
        authorId: user.uid,
        authorName: displayName,
        authorPhotoURL: photoURL,
        createdAt: new Date(), // Ensure this is a proper Date object
        replies: [] // Initialize with empty replies array
      };
      
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });
      
      // Update local state - ensure we're adding with the proper Date object
      post.comments.push({
        ...newComment,
        createdAt: new Date(), // Explicitly use a Date object for local state
        replies: [] // Ensure replies array is initialized
      });
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

  // Function to add a reply to a comment
  const handleAddReply = async (parentCommentId: string, newReply: Comment) => {
    if (!user) return;
    
    try {
      // Create a deep copy of the current comments array
      const updatedComments = JSON.parse(JSON.stringify(post.comments)) as Comment[];
      
      // Helper function to recursively find and update the parent comment
      const addReplyToComment = (comments: Comment[], parentId: string, reply: Comment): boolean => {
        for (let i = 0; i < comments.length; i++) {
          const comment = comments[i];
          
          if (comment.id === parentId) {
            // Initialize replies array if it doesn't exist
            if (!comment.replies) {
              comment.replies = [];
            }
            // Add the reply to this comment
            (comment.replies as Comment[]).push(reply);
            return true;
          }
          
          // Check nested replies if they exist
          if (comment.replies && comment.replies.length > 0) {
            const found = addReplyToComment(comment.replies as Comment[], parentId, reply);
            if (found) return true;
          }
        }
        return false;
      };
      
      // Add the reply to the appropriate parent comment
      addReplyToComment(updatedComments, parentCommentId, newReply);
      
      // Update Firestore with the new comments structure
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        comments: updatedComments
      });
      
      // Update local state
      post.comments = updatedComments;
      
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleCommentDeleted = async (commentId: string) => {
    // Update the local state to reflect the deleted comment
    // This is already handled by the markCommentAsDeleted function
    // We're just forcing a re-render here by toggling the forceUpdate state
    setForceUpdate(prev => !prev);
    console.log(`Comment ${commentId} has been marked as deleted`);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 relative ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}>
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
        </div>
      )}
      <div className="flex items-start space-x-3">
        <UserAvatar
          userId={post.authorId}
          displayName={authorInfo.name}
          photoURL={authorInfo.photoURL}
          size={40}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <UserProfileLink 
                userId={post.authorId}
                displayName={authorInfo.name}
                className="font-medium text-gray-900"
              />
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
              <h3 className="text-sm font-medium text-gray-700">
                {post.comments.length > 0 ? `Comments (${post.comments.length})` : 'No comments yet'}
              </h3>
              
              {post.comments.length > 0 && (
                <div className="space-y-3">
                  {post.comments.map(comment => (
                    <CommentItem 
                      key={comment.id} 
                      comment={comment} 
                      postId={post.id}
                      onReplyAdded={handleAddReply}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  ))}
                </div>
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