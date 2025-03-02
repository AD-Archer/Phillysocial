'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { useAuth } from '@/lib/context/AuthContext';
import { Post, Comment } from '@/types/Post';
import { Channel } from '@/types/Channel';
import PostCard from './PostCard';
import CreatePostForm from './CreatePostForm';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../layouts/Toast';

interface PostListProps {
  channelId: string | null;
}

const PostList: React.FC<PostListProps> = ({ channelId }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCanPost, setUserCanPost] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Fetch channel data
  useEffect(() => {
    if (!channelId) {
      setChannel(null);
      setPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fetchChannel = async () => {
      try {
        const channelRef = doc(db, 'channels', channelId);
        const channelSnap = await getDoc(channelRef);
        
        if (!channelSnap.exists()) {
          setError('Channel not found');
          setChannel(null);
          setIsLoading(false);
          return;
        }
        
        const channelData = channelSnap.data();
        const channelObj: Channel = {
          id: channelSnap.id,
          name: channelData.name,
          description: channelData.description,
          isPublic: channelData.isPublic,
          createdBy: channelData.createdBy,
          createdAt: channelData.createdAt ? channelData.createdAt.toDate() : new Date(),
          members: channelData.members || [],
          admins: channelData.admins || [],
          bannedUsers: channelData.bannedUsers || [],
          mutedUsers: channelData.mutedUsers || [],
          invitedUsers: channelData.invitedUsers || [],
          inviteCode: channelData.inviteCode,
          imageUrl: channelData.imageUrl || null,
        };
        
        setChannel(channelObj);
        
        // Check if user can post
        if (user) {
          const isMember = channelObj.members.includes(user.uid);
          const isMuted = channelObj.mutedUsers?.includes(user.uid) || false;
          setUserCanPost(isMember && !isMuted);
        } else {
          setUserCanPost(false);
        }
      } catch (error) {
        console.error('Error fetching channel:', error);
        setError('Failed to load channel information');
        setChannel(null);
      }
    };
    
    fetchChannel();
  }, [channelId, user]);

  // Fetch posts for the selected channel
  useEffect(() => {
    if (!channelId) {
      setPosts([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('channelId', '==', channelId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const postsData: Post[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            postsData.push({
              id: doc.id,
              content: data.content,
              authorId: data.authorId,
              authorName: data.authorName,
              authorPhotoURL: data.authorPhotoURL,
              channelId: data.channelId,
              createdAt: data.createdAt?.toDate() || new Date(),
              lastEdited: data.lastEdited?.toDate() || null,
              likes: data.likes || [],
              comments: (data.comments || []).map((comment: Comment) => {
                // Handle different date formats for comment createdAt
                let commentDate: Date;
                
                if (comment.createdAt) {
                  if (typeof comment.createdAt === 'object' && comment.createdAt !== null) {
                    // Check if it's a Firestore Timestamp
                    if ('toDate' in comment.createdAt && typeof comment.createdAt.toDate === 'function') {
                      commentDate = comment.createdAt.toDate();
                    } 
                    // Check if it's already a Date object
                    else if (comment.createdAt instanceof Date) {
                      commentDate = comment.createdAt;
                    }
                    // Default to current date if it's an unrecognized object
                    else {
                      commentDate = new Date();
                    }
                  } 
                  // Handle string date format (ISO)
                  else if (typeof comment.createdAt === 'string') {
                    commentDate = new Date(comment.createdAt);
                  }
                  // Default to current date for any other type
                  else {
                    commentDate = new Date();
                  }
                } else {
                  commentDate = new Date();
                }
                
                // Process nested replies if they exist
                let replies = comment.replies;
                if (replies && Array.isArray(replies)) {
                  replies = replies.map(reply => {
                    let replyDate: Date;
                    let lastEditedDate: Date | null = null;
                    
                    if (reply.createdAt) {
                      if (typeof reply.createdAt === 'object' && reply.createdAt !== null) {
                        // Check if it's a Firestore Timestamp
                        if ('toDate' in reply.createdAt && typeof reply.createdAt.toDate === 'function') {
                          replyDate = reply.createdAt.toDate();
                        } 
                        // Check if it's already a Date object
                        else if (reply.createdAt instanceof Date) {
                          replyDate = reply.createdAt;
                        }
                        // Default to current date if it's an unrecognized object
                        else {
                          replyDate = new Date();
                        }
                      } 
                      // Handle string date format (ISO)
                      else if (typeof reply.createdAt === 'string') {
                        replyDate = new Date(reply.createdAt);
                      }
                      // Default to current date for any other type
                      else {
                        replyDate = new Date();
                      }
                    } else {
                      replyDate = new Date();
                    }
                    
                    // Handle lastEdited date if it exists
                    if (reply.lastEdited) {
                      if (typeof reply.lastEdited === 'object' && reply.lastEdited !== null) {
                        // Check if it's a Firestore Timestamp
                        if ('toDate' in reply.lastEdited && typeof reply.lastEdited.toDate === 'function') {
                          lastEditedDate = reply.lastEdited.toDate();
                        } 
                        // Check if it's already a Date object
                        else if (reply.lastEdited instanceof Date) {
                          lastEditedDate = reply.lastEdited;
                        }
                      } 
                      // Handle string date format (ISO)
                      else if (typeof reply.lastEdited === 'string') {
                        lastEditedDate = new Date(reply.lastEdited);
                      }
                    }
                    
                    return {
                      ...reply,
                      createdAt: replyDate,
                      lastEdited: lastEditedDate
                    };
                  });
                }
                
                // Handle lastEdited date for the comment
                let lastEditedDate: Date | null = null;
                if (comment.lastEdited) {
                  if (typeof comment.lastEdited === 'object' && comment.lastEdited !== null) {
                    // Check if it's a Firestore Timestamp
                    if ('toDate' in comment.lastEdited && typeof comment.lastEdited.toDate === 'function') {
                      lastEditedDate = comment.lastEdited.toDate();
                    } 
                    // Check if it's already a Date object
                    else if (comment.lastEdited instanceof Date) {
                      lastEditedDate = comment.lastEdited;
                    }
                  } 
                  // Handle string date format (ISO)
                  else if (typeof comment.lastEdited === 'string') {
                    lastEditedDate = new Date(comment.lastEdited);
                  }
                }
                
                return {
                  ...comment,
                  createdAt: commentDate,
                  lastEdited: lastEditedDate,
                  replies: replies
                };
              }),
              imageUrl: data.imageUrl,
          });
        });
          
          // Ensure we have unique posts by ID
          const uniquePosts = Array.from(
            new Map(postsData.map(post => [post.id, post])).values()
          );
          
          setPosts(uniquePosts);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching posts:', err);
          setError('Failed to load posts');
          setIsLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      setError('Failed to set up real-time updates for posts');
      setIsLoading(false);
    }
  }, [channelId]);

  const handlePostCreated = () => {
    showToast('Post created successfully', 'success');
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    showToast('Post deleted successfully', 'success');
  };

  if (!channelId) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FaInfoCircle className="text-[#004C54] mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h2>
        <p className="text-gray-500 max-w-md">
          Choose a channel from the sidebar or create a new one to view posts
        </p>
      </motion.div>
    );
  }

  if (isLoading && !channel) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FaSpinner className="text-[#004C54] animate-spin mb-4" size={32} />
        <p className="text-gray-500">Loading channel information...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FaExclamationTriangle className="text-yellow-500 mb-4" size={32} />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Error</h2>
        <p className="text-gray-500 max-w-md">{error}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Create Post Form */}
      {userCanPost && (
        <CreatePostForm channelId={channelId} onPostCreated={handlePostCreated} />
      )}
      
      {/* User cannot post message */}
      {user && !userCanPost && channel && (
        <motion.div 
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {channel.mutedUsers?.includes(user.uid) 
                  ? "You are muted in this channel and cannot post messages."
                  : "You need to join this channel before you can post messages."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Posts List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-[#004C54]" size={24} />
          </div>
        ) : posts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PostCard post={post} onDelete={handlePostDeleted} />
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <FaInfoCircle className="text-[#004C54]" size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No posts yet</h3>
            <p className="text-gray-500 max-w-md">
              {userCanPost 
                ? "Be the first to start a conversation in this channel!"
                : "There are no posts in this channel yet."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PostList; 