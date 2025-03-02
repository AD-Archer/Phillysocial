'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import Sidebar from '@/layouts/Sidebar';
import Header from '@/layouts/Header';
import ChannelList from '@/components/Channels/ChannelList';
import PostList from '@/components/Posts/PostList';
import ChannelView from '@/components/Channels/ChannelView';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'posts' | 'channel'>('posts');

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
    // When a channel is selected, default to showing the channel view on mobile
    if (window.innerWidth < 768) {
      setActiveView('channel');
    }
  };

  const toggleView = () => {
    setActiveView(activeView === 'posts' ? 'channel' : 'posts');
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
    <div className="min-h-screen bg-gray-50">
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
      <div className="pt-16">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Channels Sidebar - Only visible on larger screens */}
            <div className="hidden md:block md:col-span-3 pl-0">
              <ChannelList 
                onSelectChannel={handleChannelSelect}
                selectedChannelId={selectedChannelId}
              />
            </div>
            
            {/* Mobile View Toggle - Only visible on mobile */}
            <div className="block md:hidden mb-4">
              <div className="flex justify-between items-center">
                <button
                  onClick={toggleView}
                  className="px-4 py-2 bg-[#004C54] text-white rounded-md hover:bg-[#003940]"
                >
                  {activeView === 'posts' ? 'View Channel Details' : 'View Posts'}
                </button>
                
                <div className="text-sm font-medium text-gray-700">
                  {activeView === 'posts' ? 'Posts View' : 'Channel View'}
                </div>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="md:col-span-9">
              {/* On mobile, conditionally show either posts or channel view */}
              <div className={`block md:hidden ${activeView === 'posts' ? 'block' : 'hidden'}`}>
                <PostList channelId={selectedChannelId} />
              </div>
              
              <div className={`block md:hidden ${activeView === 'channel' ? 'block' : 'hidden'}`}>
                <ChannelView channelId={selectedChannelId} />
              </div>
              
              {/* On desktop, show channel header and management, then posts */}
              <div className="hidden md:block">
                {selectedChannelId ? (
                  <div className="grid grid-cols-1 gap-4">
                    {/* Channel header and management only */}
                    <div className="bg-white rounded-lg shadow-md">
                      <ChannelView channelId={selectedChannelId} />
                    </div>
                    
                    {/* Posts with their own input */}
                    <div className="bg-white rounded-lg shadow-md">
                      <PostList channelId={selectedChannelId} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h2>
                    <p className="text-gray-500 max-w-md">
                      Choose a channel from the sidebar or create a new one to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile Channel Selection - Only visible on mobile when in posts view */}
            <div className={`block md:hidden mt-6 ${activeView === 'posts' ? 'block' : 'hidden'}`}>
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
