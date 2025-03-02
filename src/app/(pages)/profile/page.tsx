'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSpinner } from 'react-icons/fa';
import MainLayout from '@/layouts/MainLayout';
import { Post } from '@/types/Post';
import { Channel } from '@/types/Channel';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/Posts/PostCard';
import EditProfileModal from '@/components/Profile/EditProfileModal';


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

  const fetchUserData = useCallback(async () => {
    if (!user || !user.uid) {
      setIsLoading(false);
      return;
    }

    try {
      // Ensure user document exists before fetching
      await ensureUserDocument(user);
      
      // Fetch user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserProfile({
          ...userSnap.data(),
          id: user.uid,
          displayName: user.displayName || userSnap.data().displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined
        });
      } else {
        // This should not happen now that we ensure the document exists
        setUserProfile({
          id: user.uid,
          displayName: user.displayName || 'Anonymous',
          email: user.email || '',
          photoURL: user.photoURL || undefined,
          bio: '',
          joinedAt: new Date()
        });
      }
      
      // Fetch recent posts
      const postsRef = collection(db, 'posts');
      const postsQuery = query(
        postsRef,
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const postsSnap = await getDocs(postsQuery);
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
      
      // Fetch user channels
      const channelsRef = collection(db, 'channels');
      const channelsQuery = query(
        channelsRef,
        where('members', 'array-contains', user.uid),
        orderBy('name'),
        limit(10)
      );
      
      const channelsSnap = await getDocs(channelsQuery);
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
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, ensureUserDocument]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  const handleProfileUpdated = () => {
    fetchUserData();
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full">
          <p>Please log in to view your profile</p>
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
