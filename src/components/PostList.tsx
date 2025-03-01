'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Post } from '@/types/Post';
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

  // Fetch channel info
  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) {
        setChannel(null);
        return;
      }
      
      try {
        const channelDoc = await getDoc(doc(db, 'channels', channelId));
        
        if (channelDoc.exists()) {
          const data = channelDoc.data();
          setChannel({
            id: channelDoc.id,
            name: data.name || 'Unnamed Channel',
            description: data.description || '',
            createdBy: data.createdBy || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members || [],
            isPublic: data.isPublic !== undefined ? data.isPublic : true,
            imageUrl: data.imageUrl
          });
        } else {
          setChannel(null);
          setError('Channel not found');
        }
      } catch (err) {
        console.error('Error fetching channel:', err);
        setError('Failed to load channel information');
      }
    };
    
    fetchChannel();
  }, [channelId]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (!channelId) {
        setPosts([]);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
        // Simple query to get posts for the channel
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          where('channelId', '==', channelId),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        
        const fetchedPosts: Post[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Handle dates properly
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          
          fetchedPosts.push({
            id: doc.id,
            content: data.content || '',
            authorId: data.authorId || '',
            authorName: data.authorName || 'Anonymous',
            authorPhotoURL: data.authorPhotoURL,
            channelId: data.channelId,
            createdAt: createdAt,
            likes: data.likes || [],
            comments: data.comments || [],
            imageUrl: data.imageUrl
          });
        });
        
        setPosts(fetchedPosts);
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        
        if (err.code === 'permission-denied') {
          setError('Permission denied. You may not have access to this channel.');
        } else {
          setError(`Failed to load posts: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [channelId]);

  const handleNewPost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
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
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostList; 