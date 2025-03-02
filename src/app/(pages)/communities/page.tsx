'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Header from '@/layouts/Header';
import Sidebar from '@/layouts/Sidebar';
import { Channel } from '@/types/Channel';
import { FaUsers, FaSearch, FaFilter, FaPlus, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/layouts/Toast';

type CommunityCategory = 'all' | 'sports' | 'food' | 'events' | 'arts' | 'tech' | 'neighborhood';

// Define an extended Channel type that includes the category property
interface CommunityChannel extends Channel {
  category: CommunityCategory;
}

export default function Communities() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<CommunityChannel[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<CommunityChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CommunityCategory>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('popular');
  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);

  // Categories for communities
  const categories = [
    { id: 'all', name: 'All Communities' },
    { id: 'sports', name: 'Sports' },
    { id: 'food', name: 'Food & Dining' },
    { id: 'events', name: 'Events' },
    { id: 'arts', name: 'Arts & Culture' },
    { id: 'tech', name: 'Technology' },
    { id: 'neighborhood', name: 'Neighborhoods' },
  ];

  // Featured communities
  const featuredCommunities = [
    {
      id: 'featured1',
      name: 'Philly Sports Talk',
      description: 'Discuss all things Eagles, Phillies, Sixers, and Flyers',
      members: 3245,
      imageUrl: '/images/philly-sports.jpg',
      category: 'sports',
    },
    {
      id: 'featured2',
      name: 'Center City Foodies',
      description: 'Discover the best restaurants and food spots in Center City',
      members: 1876,
      imageUrl: '/images/philly-food.jpg',
      category: 'food',
    },
    {
      id: 'featured3',
      name: 'South Philly Neighbors',
      description: 'Connect with your neighbors in South Philly',
      members: 2134,
      imageUrl: '/images/south-philly.jpg',
      category: 'neighborhood',
    },
  ];

  const fetchCommunities = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const q = query(
        collection(db, 'channels'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const communityData: CommunityChannel[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Add a random category for demo purposes
        // In a real app, you would store the category in the channel document
        const categories: CommunityCategory[] = ['sports', 'food', 'events', 'arts', 'tech', 'neighborhood'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        
        communityData.push({
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
          category: (data.category as CommunityCategory) || randomCategory,
        });
      });
      
      setCommunities(communityData);
      setFilteredCommunities(communityData);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchCommunities();
    }
  }, [user, loading, router, fetchCommunities]);

  useEffect(() => {
    // Filter communities based on active category and search query
    let filtered = [...communities];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(community => 
        community.category === activeCategory
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(query) || 
        (community.description && community.description.toLowerCase().includes(query))
      );
    }
    
    // Sort communities
    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      filtered.sort((a, b) => b.members.length - a.members.length);
    }
    
    setFilteredCommunities(filtered);
  }, [communities, activeCategory, searchQuery, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the useEffect
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!user) return;
    
    setJoiningCommunity(communityId);
    
    try {
      const channelRef = doc(db, 'channels', communityId);
      await updateDoc(channelRef, {
        members: arrayUnion(user.uid)
      });
      
      // Update local state
      setCommunities(communities.map(community => {
        if (community.id === communityId) {
          return {
            ...community,
            members: [...community.members, user.uid]
          };
        }
        return community;
      }));
      
      showToast('Successfully joined community', 'success');
    } catch (error) {
      console.error('Error joining community:', error);
      showToast('Failed to join community', 'error');
    } finally {
      setJoiningCommunity(null);
    }
  };

  const isUserMember = (communityId: string) => {
    if (!user) return false;
    
    const community = communities.find(c => c.id === communityId);
    return community ? community.members.includes(user.uid) : false;
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
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)}
        onProfileClick={() => router.push('/profile')}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="pt-16 flex-1 flex flex-col">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 w-full flex-1 flex flex-col">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <FaUsers className="mr-3 text-[#004C54]" />
              Communities
            </h1>
            <p className="text-gray-600 mt-1">
              Join communities to connect with people who share your interests
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004C54]"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors flex items-center"
              >
                <FaFilter className="mr-1" />
                <span className="hidden sm:inline">Filters</span>
                {showFilters ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
              </button>
            </form>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-lg shadow-md mb-4 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="mb-4 sm:mb-0">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Sort by</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSortBy('popular')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            sortBy === 'popular'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Most Popular
                        </button>
                        <button
                          onClick={() => setSortBy('newest')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            sortBy === 'newest'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Newest
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Show only</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setActiveCategory('all')}
                          className={`px-3 py-1 text-sm rounded-md ${
                            activeCategory === 'all'
                              ? 'bg-[#004C54] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          My Communities
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Category Tabs */}
            <div className="flex overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id as CommunityCategory)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeCategory === category.id
                        ? 'bg-[#004C54] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Communities */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Featured Communities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCommunities.map((community) => (
                <div
                  key={community.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-32 bg-gray-200 relative">
                    {community.imageUrl && (
                      <Image
                        src={community.imageUrl}
                        alt={community.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-lg">{community.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{community.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{community.members} members</span>
                      <button
                        className="px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Communities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">All Communities</h2>
              <Link
                href="/create-community"
                className="flex items-center px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors"
              >
                <FaPlus className="mr-1" /> Create Community
              </Link>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
              </div>
            ) : filteredCommunities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommunities.map((community) => (
                  <div
                    key={community.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="h-24 bg-gray-200 relative">
                      {community.imageUrl && (
                        <Image
                          src={community.imageUrl}
                          alt={community.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800">{community.name}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{community.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{community.members.length} members</span>
                        {isUserMember(community.id) ? (
                          <Link
                            href={`/dashboard?channel=${community.id}`}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                          >
                            View
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleJoinCommunity(community.id)}
                            disabled={joiningCommunity === community.id}
                            className="px-3 py-1 bg-[#004C54] text-white text-sm rounded-md hover:bg-[#003940] transition-colors disabled:opacity-70"
                          >
                            {joiningCommunity === community.id ? 'Joining...' : 'Join'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FaUsers className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No communities found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery
                    ? `No communities match "${searchQuery}"`
                    : 'No communities found in this category'}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
                >
                  Show All Communities
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
