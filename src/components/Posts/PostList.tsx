'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Post, Comment } from '@/types/Post';
import { Channel } from '@/types/Channel';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';
import { FaExclamationTriangle } from 'react-icons/fa';

interface PostListProps {
  channelId: string | null;
}

const PostList: React.FC<PostListProps> = ({ channelId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch channel info with real-time updates
  useEffect(() => {
    if (!channelId) {
      setChannel(null);
      return;
    }
    
    setIsLoading(true);
    
    // Set up real-time listener for the channel
    const channelRef = doc(db, 'channels', channelId);
    const unsubscribe = onSnapshot(
      channelRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setChannel({
            id: doc.id,
            name: data.name || 'Unnamed Channel',
            description: data.description || '',
            createdBy: data.createdBy || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members || [],
            admins: data.admins || [],
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            imageUrl: data.imageUrl
          });
          setIsLoading(false);
        } else {
          setChannel(null);
          setError('Channel not found');
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching channel:', err);
        setError('Failed to load channel information');
        setIsLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [channelId]);

  // Fetch posts with real-time updates
  useEffect(() => {
    if (!channelId) {
      setPosts([]);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Set up real-time listener for posts
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('channelId', '==', channelId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedPosts: Post[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            // Handle dates properly
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
            const lastEdited = data.lastEdited?.toDate ? data.lastEdited.toDate() : undefined;
            
            // Define a recursive type for comment data from Firestore
            type FirestoreCommentData = {
              id: string;
              content: string;
              authorId: string;
              authorName: string;
              authorPhotoURL?: string;
              createdAt: { toDate?: () => Date } | Date;
              parentId?: string;
              replies?: FirestoreCommentData[];
            };

            // Process comments to ensure dates are properly converted
            const processComments = (comments: FirestoreCommentData[]): Comment[] => {
              return comments.map(comment => {
                // Process this comment
                const processedComment = {
                  id: comment.id,
                  content: comment.content,
                  authorId: comment.authorId,
                  authorName: comment.authorName,
                  authorPhotoURL: comment.authorPhotoURL,
                  parentId: comment.parentId,
                  createdAt: comment.createdAt && typeof comment.createdAt === 'object' && 'toDate' in comment.createdAt && typeof comment.createdAt.toDate === 'function'
                    ? comment.createdAt.toDate()
                    : comment.createdAt instanceof Date ? comment.createdAt : new Date()
                } as Comment;
                
                // Process nested replies if they exist
                if (Array.isArray(comment.replies) && comment.replies.length > 0) {
                  processedComment.replies = processComments(comment.replies);
                }
                
                return processedComment;
              });
            };
            
            const processedComments = processComments(data.comments || []);
            
            fetchedPosts.push({
              id: doc.id,
              content: data.content || '',
              authorId: data.authorId || '',
              authorName: data.authorName || 'Anonymous',
              authorPhotoURL: data.authorPhotoURL,
              channelId: data.channelId,
              createdAt: createdAt,
              lastEdited: lastEdited,
              likes: data.likes || [],
              comments: processedComments,
              imageUrl: data.imageUrl
            });
          });
          
          setPosts(fetchedPosts);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching posts:', err);
          
          if (err instanceof Error && 'code' in err && err.code === 'permission-denied') {
            setError('Permission denied. You may not have access to this channel.');
          } else if (err instanceof Error) {
            setError(`Failed to load posts: ${err.message || 'Unknown error'}`);
          } else {
            setError('An unknown error occurred.');
          }
          
          setIsLoading(false);
        }
      );
      
      // Clean up listener on unmount
      return () => unsubscribe();
    } catch (err: unknown) {
      console.error('Error setting up posts listener:', err);
      setIsLoading(false);
      
      if (err instanceof Error) {
        setError(`Failed to set up real-time updates: ${err.message || 'Unknown error'}`);
      } else {
        setError('An unknown error occurred.');
      }
    }
  }, [channelId]);

  // These handlers are still useful for optimistic UI updates
  const handleNewPost = (newPost: Post) => {
    // With real-time listeners, this might not be needed anymore,
    // but keeping it for optimistic UI updates
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    // This is still useful for immediate UI feedback before the listener updates
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handlePostEdited = (postId: string, newContent: string, editedAt: Date) => {
    // This is still useful for immediate UI feedback before the listener updates
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, content: newContent, lastEdited: editedAt } 
          : post
      )
    );
  };

  if (!channelId) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h3 className="text-lg font-medium text-gray-700">Select a channel to view posts</h3>
        <p className="text-gray-500 mt-2">Or create a new channel to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {channel && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold text-[#004C54]">#{channel.name}</h2>
          {channel.description && (
            <p className="text-gray-600 mt-1">{channel.description}</p>
          )}
        </div>
      )}
      
      <CreatePostForm channelId={channelId} onPostCreated={handleNewPost} />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-md text-center">
          <FaExclamationTriangle className="mx-auto text-red-500 mb-2" size={24} />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-[#004C54] hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700">No posts yet</h3>
          <p className="text-gray-500 mt-2">Be the first to post in this channel!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <PostCard 
              key={`${post.id}-${index}`} 
              post={post} 
              channel={channel ? { admins: channel.admins } : undefined} 
              onPostDeleted={handlePostDeleted}
              onPostEdited={handlePostEdited}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList; 