'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSpinner } from 'react-icons/fa';
import MainLayout from '@/layouts/MainLayout';
import { Post } from '@/types/Post';
import { Channel } from '@/types/Channel';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/Posts/PostCard';
import EditProfileModal from '@/components/Profile/EditProfileModal';
import { motion } from 'framer-motion';


interface UserProfile {
  id?: string;
  displayName: string;
  email: string | null;
  photoURL?: string | null;
  bio?: string;
  createdAt?: Date;
  joinedAt?: Date;
  // Add other fields as needed
}

interface UserPost extends Post {
  // Define specific fields for user posts if needed
  authorName: string;
  authorPhotoURL?: string;
}

const ProfilePage = () => {
  const { user, ensureUserDocument } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [userChannels, setUserChannels] = useState<Channel[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'channels'>('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Add breathing gradient animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .breathing-gradient {
        background-size: 200% 200%;
        animation: breathe 8s ease infinite;
      }
      
      @keyframes breathe {
        0% {
          background-position: 0% 50%;
          opacity: 0.05;
        }
        50% {
          background-position: 100% 50%;
          opacity: 0.2;
        }
        100% {
          background-position: 0% 50%;
          opacity: 0.05;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set up real-time listeners for user data
  useEffect(() => {
    if (!user || !user.uid) {
      setIsLoading(false);
      return;
    }

    // Set up initial loading state
    setIsLoading(true);

    // Ensure user document exists
    const setupListeners = async () => {
      try {
        await ensureUserDocument(user);
        
        // Create unsubscribe functions array to clean up listeners
        const unsubscribers: (() => void)[] = [];
        
        // 1. Listen to user profile changes
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, (userSnap) => {
          if (userSnap.exists()) {
            setUserProfile({
              ...userSnap.data(),
              id: user.uid,
              displayName: user.displayName || userSnap.data().displayName || 'Anonymous',
              email: user.email || '',
              photoURL: user.photoURL || userSnap.data().photoURL || undefined
            });
          } else {
            setUserProfile({
              id: user.uid,
              displayName: user.displayName || 'Anonymous',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              bio: '',
              joinedAt: new Date()
            });
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error listening to profile changes:', error);
          setIsLoading(false);
        });
        
        unsubscribers.push(unsubscribeProfile);
        
        // 2. Listen to user posts changes
        const postsRef = collection(db, 'posts');
        const postsQuery = query(
          postsRef,
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const unsubscribePosts = onSnapshot(postsQuery, (postsSnap) => {
          const postsData: UserPost[] = [];
          
          postsSnap.forEach((doc) => {
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
              comments: (data.comments || []).map((comment: {
                id: string;
                text: string;
                authorId: string;
                authorName: string;
                createdAt: { toDate?: () => Date };
              }) => ({
                ...comment,
                createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date()
              })),
              imageUrl: data.imageUrl
            });
          });
          
          setUserPosts(postsData);
        }, (error) => {
          console.error('Error listening to posts changes:', error);
        });
        
        unsubscribers.push(unsubscribePosts);
        
        // 3. Listen to user channels changes
        const channelsRef = collection(db, 'channels');
        const channelsQuery = query(
          channelsRef,
          where('members', 'array-contains', user.uid),
          orderBy('name'),
          limit(10)
        );
        
        const unsubscribeChannels = onSnapshot(channelsQuery, (channelsSnap) => {
          const channelsData: Channel[] = [];
          
          channelsSnap.forEach((doc) => {
            const data = doc.data();
            channelsData.push({
              id: doc.id,
              name: data.name,
              description: data.description,
              isPublic: data.isPublic,
              createdBy: data.createdBy,
              createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
              members: data.members || [],
              admins: data.admins || [],
              bannedUsers: data.bannedUsers || [],
              mutedUsers: data.mutedUsers || [],
              invitedUsers: data.invitedUsers || [],
              inviteCode: data.inviteCode,
              imageUrl: data.imageUrl || null
            });
          });
          
          setUserChannels(channelsData);
        }, (error) => {
          console.error('Error listening to channels changes:', error);
        });
        
        unsubscribers.push(unsubscribeChannels);
        
        // Return cleanup function to unsubscribe from all listeners
        return () => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setIsLoading(false);
      }
    };
    
    // Set up listeners and store cleanup function
    const unsubscribeAll = setupListeners();
    
    // Clean up listeners when component unmounts or user changes
    return () => {
      if (unsubscribeAll) {
        unsubscribeAll.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, [user, ensureUserDocument]);

  const handleProfileUpdated = () => {
    // No need to manually fetch data anymore as the listeners will update automatically
    // We can keep this function for future use or to trigger other actions after profile update
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center min-h-[70vh] px-4 py-8 md:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ 
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              y: -5,
              transition: { duration: 0.3 }
            }}
            className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md text-center relative"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10"></div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="h-28 sm:h-32 bg-gradient-to-r from-[#004C54] to-[#046A38] flex items-center justify-center relative overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 breathing-gradient"></div>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative z-10"
              >
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                  <FaUser className="text-white text-4xl sm:text-5xl opacity-90" />
                </div>
              </motion.div>
            </motion.div>
            
            <div className="p-6 sm:p-8 relative z-10">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-bold text-[#004C54] mb-3 sm:mb-4 eagles-font"
              >
                Profile Access
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-gray-600 mb-6 max-w-sm mx-auto"
              >
                Please sign in to view and manage your profile, see your posts, and connect with your community.
              </motion.p>
              <div className="space-y-3 sm:space-y-4">
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login')}
                  className="w-full bg-[#004C54] hover:bg-[#003940] text-white py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <FaUser className="mr-2" /> Sign In
                </motion.button>
                <motion.button 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/login?mode=signup')}
                  className="w-full bg-[#046A38] hover:bg-[#035A28] text-white py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
                >
                  <FaEnvelope className="mr-2" /> Create Account
                </motion.button>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="bg-gray-50 p-4 border-t border-gray-100 relative z-10"
            >
              <p className="text-sm text-gray-500">
                Join Philly Social to connect with your community and stay updated on local events.
              </p>
            </motion.div>
          </motion.div>
          
          {/* Additional information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-6 text-center text-white text-sm max-w-md"
          >
           
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <FaSpinner className="animate-spin text-[#004C54]" size={32} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-[#004C54] to-[#046A38]"></div>
          <div className="p-6 relative">
            <div className="absolute -top-16 left-6 border-4 border-white rounded-full overflow-hidden">
              {userProfile?.photoURL ? (
                <div className="relative w-32 h-32">
                  <Image 
                    src={userProfile.photoURL} 
                    alt={userProfile.displayName} 
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-[#004C54] text-white flex items-center justify-center text-4xl">
                  {userProfile?.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="ml-40">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{userProfile?.displayName}</h1>
                  <div className="flex items-center text-gray-500 mt-1">
                    <FaEnvelope className="mr-2" />
                    <span>{userProfile?.email}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] flex items-center"
                >
                  <FaEdit className="mr-2" />
                  Edit Profile
                </button>
              </div>
              
              {userProfile?.bio && (
                <p className="mt-4 text-gray-700">{userProfile.bio}</p>
              )}
              
              <div className="mt-4 flex items-center text-gray-500">
                <FaCalendarAlt className="mr-2" />
                <span>Joined {userProfile?.joinedAt ? new Date(userProfile.joinedAt).toLocaleDateString() : 'recently'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'posts' 
                  ? 'text-[#004C54] border-b-2 border-[#004C54]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('posts')}
            >
              Recent Posts
            </button>
            <button
              className={`px-6 py-3 font-medium ${
                activeTab === 'channels' 
                  ? 'text-[#004C54] border-b-2 border-[#004C54]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('channels')}
            >
              My Channels
            </button>
          </div>
          
          {/* Recent Posts */}
          {activeTab === 'posts' && (
            <div className="p-4">
              {userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaUser className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 mb-4">You haven&apos;t created any posts yet</p>
                </div>
              )}
            </div>
          )}
          
          {/* User Channels */}
          {activeTab === 'channels' && (
            <div className="p-4">
              {userChannels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userChannels.map((channel) => (
                    <div 
                      key={channel.id}
                      className="border rounded-lg p-4 hover:border-[#004C54] cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard?channel=${channel.id}`)}
                    >
                      <div className="flex items-center">
                        {channel.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden mr-3">
                            <Image 
                              src={channel.imageUrl} 
                              alt={channel.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center mr-3 text-gray-500">
                            {channel.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div>
                          <h3 className="font-medium text-gray-800">{channel.name}</h3>
                          <p className="text-sm text-gray-500 truncate">
                            {channel.members.length} {channel.members.length === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                      
                      {channel.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{channel.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaUser className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 mb-4">You haven&apos;t joined any channels yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        initialData={{
          displayName: userProfile?.displayName,
          bio: userProfile?.bio,
          photoURL: userProfile?.photoURL || undefined
        }}
      />
    </MainLayout>
  );
};

export default ProfilePage;