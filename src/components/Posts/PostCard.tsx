'use client';
import { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaEllipsisH } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.likes.includes(useAuth().user?.uid || ''));
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { user } = useAuth();

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

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
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
            
            <button className="text-gray-400 hover:text-gray-600">
              <FaEllipsisH size={16} />
            </button>
          </div>
          
          <p className="mt-2 text-gray-700 whitespace-pre-wrap break-words">{post.content}</p>
          
          {post.imageUrl && (
            <div className="mt-3">
              <Image
                src={post.imageUrl}
                alt="Post attachment"
                width={600}
                height={400}
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>
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