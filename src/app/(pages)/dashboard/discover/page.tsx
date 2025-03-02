'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit, startAfter, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Channel } from '@/types/Channel';
import { Post } from '@/types/Post';
import { FaSearch, FaCompass, FaUsers, FaHashtag  } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Define a User interface to replace 'any'
interface UserProfile {
  id: string;
  displayName: string;
  photoURL?: string | null;
  bio?: string;
}

type DiscoverTab = 'channels' | 'posts' | 'users';

export default function Discover() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DiscoverTab>('channels');
  const [searchQuery, setSearchQuery] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTopics] = useState([
    { name: 'Eagles', count: 245 },
    { name: 'Phillies', count: 187 },
    { name: 'Sixers', count: 156 },
    { name: 'Flyers', count: 132 },
    { name: 'CheeseSteaks', count: 98 },
  ]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setHasMore(true);
    
    try {
      let q;
      
      if (activeTab === 'channels') {
        q = query(
          collection(db, 'channels'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
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
        
        setChannels(channelData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        
      } else if (activeTab === 'posts') {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const postData: Post[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          postData.push({
            id: doc.id,
            content: data.content,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhotoURL: data.authorPhotoURL || null,
            channelId: data.channelId,
            createdAt: data.createdAt?.toDate() || new Date(),
            likes: data.likes || [],
            comments: data.comments || [],
            imageUrl: data.imageUrl || null,
          });
        });
        
        setPosts(postData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        
      } else if (activeTab === 'users') {
        q = query(
          collection(db, 'users'),
          orderBy('displayName'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const userData: UserProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userData.push({
            id: doc.id,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            bio: data.bio || '',
          });
        });
        
        setUsers(userData);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
      }
    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, loading, router, activeTab, fetchData]);

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
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
        
      } else if (activeTab === 'posts') {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const postData: Post[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          postData.push({
            id: doc.id,
            content: data.content,
            authorId: data.authorId,
            authorName: data.authorName,
            authorPhotoURL: data.authorPhotoURL || null,
            channelId: data.channelId,
            createdAt: data.createdAt?.toDate() || new Date(),
            likes: data.likes || [],
            comments: data.comments || [],
            imageUrl: data.imageUrl || null,
          });
        });
        
        setPosts([...posts, ...postData]);
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
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            bio: data.bio || '',
          });
        });
        
        setUsers([...users, ...userData]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 10);
      }
    } catch (error) {
      console.error('Error loading more discover data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // This would typically filter the current data or make a new query
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
              Explore channels, posts, and people in the Philly community
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for channels, posts, or users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#004C54] text-white px-4 py-1 rounded-md hover:bg-[#003940] transition-colors"
              >
                Search
              </button>
            </form>
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
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 font-medium text-sm sm:text-base rounded-t-lg ${
                  activeTab === 'posts'
                    ? 'bg-white text-[#004C54] border-t border-l border-r border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Posts
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
                    
                    {channels.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {channels.map((channel) => (
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

                {activeTab === 'posts' && (
                  <motion.div
                    key="posts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h2 className="text-lg font-semibold text-[#004C54]">Popular Posts</h2>
                    </div>
                    
                    {posts.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {posts.map((post) => (
                          <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start">
                              {post.authorPhotoURL ? (
                                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                                  <Image
                                    src={post.authorPhotoURL}
                                    alt={post.authorName}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                  {post.authorName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <h3 className="font-medium text-gray-800">{post.authorName}</h3>
                                  <span className="text-xs text-gray-500">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 line-clamp-2">{post.content}</p>
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                  <span className="mr-4">{post.likes.length} likes</span>
                                  <span>{post.comments.length} comments</span>
                                </div>
                              </div>
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
                          <p>No posts found</p>
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
                    
                    {users.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                          <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center">
                              {user.photoURL ? (
                                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 flex-shrink-0">
                                  <Image
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-[#004C54] text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-800">{user.displayName}</h3>
                                {user.bio && (
                                  <p className="text-sm text-gray-500 line-clamp-1">{user.bio}</p>
                                )}
                              </div>
                              <Link
                                href={`/profile/${user.id}`}
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
                  <ul className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FaHashtag className="text-[#004C54] mr-2" />
                          <span className="text-gray-800">{topic.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{topic.count} posts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested For You */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-[#004C54]">Suggested For You</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#046A38] text-white rounded-full flex items-center justify-center mr-3">
                        <FaUsers size={16} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Philly Sports Fans</h3>
                        <p className="text-xs text-gray-500">1,245 members</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#046A38] text-white rounded-full flex items-center justify-center mr-3">
                        <FaUsers size={16} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Philly Foodies</h3>
                        <p className="text-xs text-gray-500">987 members</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#046A38] text-white rounded-full flex items-center justify-center mr-3">
                        <FaUsers size={16} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">Center City Events</h3>
                        <p className="text-xs text-gray-500">756 members</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
