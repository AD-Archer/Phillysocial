'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import Sidebar from '@/layouts/Sidebar';
import Header from '@/layouts/Header';
import ChannelList from '@/components/Channels/ChannelList';
import PostList from '@/components/Posts/PostList';
import ChannelView from '@/components/Channels/ChannelView';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isChannelListVisible, setIsChannelListVisible] = useState(true);
  const postsRef = useRef<HTMLDivElement>(null);
  const channelListRef = useRef<HTMLDivElement>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // On mobile, collapse channel list when a channel is selected
      if (isMobileView && selectedChannelId) {
        setIsChannelListVisible(false);
      } else {
        setIsChannelListVisible(true);
      }
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [selectedChannelId]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    
    // On mobile, collapse the channel list and scroll to the posts section
    if (isMobile) {
      setIsChannelListVisible(false);
      setTimeout(() => {
        postsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const toggleChannelList = () => {
    setIsChannelListVisible(!isChannelListVisible);
    
    // Scroll to the channel list when expanding it
    if (!isChannelListVisible && channelListRef.current) {
      setTimeout(() => {
        channelListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)}
        onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Profile Dropdown */}
      {isProfileOpen && (
        <div className="absolute right-4 top-16 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-16 flex-1 flex flex-col">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 w-full flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
            {/* Channels Sidebar - Only visible on larger screens */}
            <div className="hidden md:block md:col-span-3 pl-0 sticky top-20 self-start">
              <ChannelList 
                onSelectChannel={handleChannelSelect}
                selectedChannelId={selectedChannelId}
              />
            </div>
            
            {/* Main Content Area */}
            <div className="md:col-span-9 flex flex-col flex-1">
              {/* Mobile & Desktop: Show channel details if a channel is selected */}
              {selectedChannelId ? (
                <div className="flex flex-col flex-1">
                  <div className="mb-4">
                    <ChannelView channelId={selectedChannelId} />
                  </div>
                  
                  {/* Mobile & Desktop: Show posts section */}
                  <div ref={postsRef} id="posts-section" className="scroll-mt-20 flex-1">
                    <PostList channelId={selectedChannelId} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h2>
                  <p className="text-gray-500 max-w-md">
                    Choose a channel from the {isMobile ? 'list below' : 'sidebar'} or create a new one to get started
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile: Channel List at the bottom */}
          <div className="block md:hidden mt-4">
            {selectedChannelId && (
              <button 
                onClick={toggleChannelList}
                className="w-full flex items-center justify-center p-3 bg-white rounded-lg shadow-md mb-2 text-[#004C54]"
              >
                {isChannelListVisible ? (
                  <>
                    <span className="mr-2">Hide Channels</span>
                    <FaChevronDown />
                  </>
                ) : (
                  <>
                    <span className="mr-2">Show Channels</span>
                    <FaChevronUp />
                  </>
                )}
              </button>
            )}
            
            <div 
              ref={channelListRef}
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isChannelListVisible ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <ChannelList 
                onSelectChannel={handleChannelSelect}
                selectedChannelId={selectedChannelId}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
