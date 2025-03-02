'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { Post } from '@/types/Post';
import { FaSearch, FaCompass, FaUsers, FaHashtag, FaComment } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '@/components/Profile/UserAvatar';
import UserProfileLink from '@/components/Profile/UserProfileLink';
import UserMiniProfile from '@/components/Profile/UserMiniProfile';

// Define a User interface to replace 'any'
interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  email?: string;
  uid?: string;
}

// Define a TrendingTopic interface
interface TrendingTopic {
  id: string;
  content: string;
  channelId: string;
  channelName: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  messageCount: number;
}

type DiscoverTab = 'channels' | 'users';

export default function Discover() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedCommunities, setSuggestedCommunities] = useState<Channel[]>([]);
  
  // Profile popup state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [profilePosition, setProfilePosition] = useState({ top: 0, left: 0 });
  const [showProfile, setShowProfile] = useState(false);

  // Fetch channels data
  const fetchChannels = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const q = query(
        collection(db, 'channels'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const channelData: Channel[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          channelData.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            isPublic: data.isPublic,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members || [],
            admins: data.admins || [],
            imageUrl: data.imageUrl || null,
            inviteCode: data.inviteCode || null,
          });
        });
        
        setChannels(channelData);
        setFilteredChannels(channelData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        setIsLoading(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching channels:', error);
      setIsLoading(false);
      return () => {};
    }
  }, [user]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('displayName'),
        limit(10)
      );
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userData: UserProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userData.push({
            id: doc.id,
            uid: doc.id,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            bio: data.bio || '',
            email: data.email || '',
          });
        });
        
        setUsers(userData);
        setFilteredUsers(userData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        setIsLoading(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching users:', error);
      setIsLoading(false);
      return () => {};
    }
  }, [user]);

  // Fetch trending topics (real messages from public channels)
  const fetchTrendingTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get recent messages from public channels
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const topicsData: TrendingTopic[] = [];
        
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data();
          
          // Get channel info
          let channelName = 'Unknown Channel';
          try {
            const channelDoc = await getDoc(doc(db, 'channels', data.channelId));
            if (channelDoc.exists()) {
              channelName = channelDoc.data().name;
            }
          } catch (error) {
            console.error('Error fetching channel:', error);
          }
          
          topicsData.push({
            id: docSnapshot.id,
            content: data.content,
            channelId: data.channelId,
            channelName: channelName,
            authorId: data.authorId,
            authorName: data.authorName,
            createdAt: data.createdAt?.toDate() || new Date(),
            messageCount: Math.floor(Math.random() * 100) + 10, // This would ideally be a real count
          });
        }
        
        setTrendingTopics(topicsData);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return () => {};
    }
  }, [user]);

  // Fetch suggested communities
  const fetchSuggestedCommunities = useCallback(async () => {
    if (!user) return;
    
    try {
      // Get popular channels based on member count
      const q = query(
        collection(db, 'channels'),
        where('isPublic', '==', true),
        orderBy('members', 'desc'),
        limit(3)
      );
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const communitiesData: Channel[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          communitiesData.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            isPublic: data.isPublic,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members || [],
            admins: data.admins || [],
            imageUrl: data.imageUrl || null,
            inviteCode: data.inviteCode || null,
          });
        });
        
        setSuggestedCommunities(communitiesData);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching suggested communities:', error);
      return () => {};
    }
  }, [user]);

  // Initialize data fetching
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const unsubscribeChannels = fetchChannels();
      const unsubscribeUsers = fetchUsers();
      const unsubscribeTrending = fetchTrendingTopics();
      const unsubscribeSuggested = fetchSuggestedCommunities();
      
      // Cleanup subscriptions
      return () => {
        unsubscribeChannels.then(unsub => unsub());
        unsubscribeUsers.then(unsub => unsub());
        unsubscribeTrending.then(unsub => unsub());
        unsubscribeSuggested.then(unsub => unsub());
      };
    }
  }, [user, loading, router, fetchChannels, fetchUsers, fetchTrendingTopics, fetchSuggestedCommunities]);

  // Handle search in real-time
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChannels(channels);
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Filter channels
    const matchedChannels = channels.filter(channel => 
      channel.name.toLowerCase().includes(query) || 
      (channel.description && channel.description.toLowerCase().includes(query))
    );
    setFilteredChannels(matchedChannels);
    
    // Filter users
    const matchedUsers = users.filter(user => 
      user.displayName.toLowerCase().includes(query) || 
      (user.bio && user.bio.toLowerCase().includes(query))
    );
    setFilteredUsers(matchedUsers);
  }, [searchQuery, channels, users]);

  const loadMore = async () => {
    if (!user || !lastVisible || !hasMore) return;
    
    setIsLoading(true);
    
    try {
      let q;
      
      if (activeTab === 'channels') {
        q = query(
          collection(db, 'channels'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const channelData: Channel[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          channelData.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            isPublic: data.isPublic,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
            members: data.members || [],
            admins: data.admins || [],
            imageUrl: data.imageUrl || null,
            inviteCode: data.inviteCode || null,
          });
        });
        
        setChannels([...channels, ...channelData]);
        setFilteredChannels([...filteredChannels, ...channelData]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        
      } else if (activeTab === 'users') {
        q = query(
          collection(db, 'users'),
          orderBy('displayName'),
          startAfter(lastVisible),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const userData: UserProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userData.push({
            id: doc.id,
            uid: doc.id,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            bio: data.bio || '',
            email: data.email || '',
          });
        });
        
        setUsers([...users, ...userData]);
        setFilteredUsers([...filteredUsers, ...userData]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
      }
    } catch (error) {
      console.error('Error loading more discover data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user profile popup
  const handleUserClick = async (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSelectedUser({
          id: userId,
          uid: userId,
          displayName: userData.displayName || 'Anonymous',
          photoURL: userData.photoURL || null,
          bio: userData.bio || '',
          email: userData.email || '',
        });
        
        // Position the popup near the click
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setProfilePosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX,
        });
        
        setShowProfile(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="pt-16 flex-1 flex flex-col">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 w-full flex-1 flex flex-col">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FaCompass className="mr-3 text-[#004C54]" />
              Discover
            </h1>
            <p className="text-gray-600 mt-1">
              Explore channels and people in the Philly community
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for channels or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex space-x-1 sm:space-x-4">
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-4 py-2 font-medium text-sm sm:text-base rounded-t-lg ${
                  activeTab === 'channels'
                    ? 'bg-white text-[#004C54] border-t border-l border-r border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Channels
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-medium text-sm sm:text-base rounded-t-lg ${
                  activeTab === 'users'
                    ? 'bg-white text-[#004C54] border-t border-l border-r border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                People
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {activeTab === 'channels' && (
                  <motion.div
                    key="channels"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-[#004C54]">Popular Channels</h2>
                    </div>
                    
                    {filteredChannels.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredChannels.map((channel) => (
                          <div key={channel.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                              {channel.imageUrl ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0">
                                  <Image
                                    src={channel.imageUrl}
                                    alt={channel.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                  {channel.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-800">{channel.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1">{channel.description}</p>
                                <div className="mt-1 text-xs text-gray-400">
                                  {channel.members.length} {channel.members.length === 1 ? 'member' : 'members'}
                                </div>
                              </div>
                              <Link
                                href={`/dashboard?channel=${channel.id}`}
                                className="ml-4 px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        {isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
                          </div>
                        ) : (
                          <p>No channels found</p>
                        )}
                      </div>
                    )}
                    
                    {hasMore && (
                      <div className="p-4 border-t border-gray-100 text-center">
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'users' && (
                  <motion.div
                    key="users"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-[#004C54]">People to Follow</h2>
                    </div>
                    
                    {filteredUsers.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {filteredUsers.map((userProfile) => (
                          <div key={userProfile.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                              <div className="mr-4 flex-shrink-0">
                                <UserAvatar 
                                  userId={userProfile.id}
                                  displayName={userProfile.displayName}
                                  photoURL={userProfile.photoURL || undefined}
                                  size={48}
                                  showStatus={true}
                                />
                              </div>
                              <div className="flex-1">
                                <UserProfileLink 
                                  userId={userProfile.id}
                                  displayName={userProfile.displayName}
                                  className="font-medium text-gray-800"
                                />
                                {userProfile.bio && (
                                  <p className="text-sm text-gray-500 line-clamp-1">{userProfile.bio}</p>
                                )}
                              </div>
                              <Link
                                href={`/profile/${userProfile.id}`}
                                className="ml-4 px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        {isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
                          </div>
                        ) : (
                          <p>No users found</p>
                        )}
                      </div>
                    )}
                    
                    {hasMore && (
                      <div className="p-4 border-t border-gray-100 text-center">
                        <button
                          onClick={loadMore}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div className="md:col-span-1 space-y-6">
              {/* Trending Topics */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#004C54]">Trending Topics</h2>
                </div>
                <div className="p-4">
                  {trendingTopics.length > 0 ? (
                    <ul className="space-y-4">
                      {trendingTopics.map((topic) => (
                        <li key={topic.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-start mb-2">
                            <FaComment className="text-[#004C54] mr-2 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-800 line-clamp-2">{topic.content}</p>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-[#004C54] font-medium mr-2">
                                  {topic.channelName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {topic.messageCount} messages
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center text-xs">
                            <span className="text-gray-500 mr-1">Posted by</span>
                            <UserProfileLink 
                              userId={topic.authorId}
                              displayName={topic.authorName}
                              className="text-xs"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No trending topics found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggested For You */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#004C54]">Suggested For You</h2>
                </div>
                <div className="p-4">
                  {suggestedCommunities.length > 0 ? (
                    <div className="space-y-4">
                      {suggestedCommunities.map((community) => (
                        <div key={community.id} className="flex items-center">
                          {community.imageUrl ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                              <Image
                                src={community.imageUrl}
                                alt={community.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-[#046A38] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <FaUsers size={16} />
                            </div>
                          )}
                          <div>
                            <Link 
                              href={`/dashboard?channel=${community.id}`}
                              className="font-medium text-gray-800 hover:text-[#004C54] transition-colors"
                            >
                              {community.name}
                            </Link>
                            <p className="text-xs text-gray-500">{community.members.length} members</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No suggestions available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* User Mini Profile Popup */}
      {showProfile && selectedUser && (
        <UserMiniProfile
          user={selectedUser}
          onClose={() => setShowProfile(false)}
          position={profilePosition}
        />
      )}
    </div>
  );
}
