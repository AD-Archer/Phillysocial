'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import ChannelList from '@/components/Channels/ChannelList';
import PostList from '@/components/Posts/PostList';
import ChannelView from '@/components/Channels/ChannelView';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaChevronUp, FaChevronDown } from 'react-icons/fa';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isChannelListVisible, setIsChannelListVisible] = useState(true);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
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
    // Check if welcome message has been dismissed before
    const dismissed = localStorage.getItem('welcomeDismissed');
    if (dismissed === 'true') {
      setWelcomeDismissed(true);
    }
  }, []);

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
  
  const dismissWelcome = () => {
    setWelcomeDismissed(true);
    localStorage.setItem('welcomeDismissed', 'true');
  };

  // Get user's display name or first part of email
  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) {
      const emailParts = user.email.split('@');
      return emailParts[0];
    }
    return 'User';
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Welcome Banner */}
      <AnimatePresence>
        {!welcomeDismissed && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-[#003940] to-[#046A38] rounded-xl shadow-lg mb-6 overflow-hidden"
          >
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl eagles-font text-white mb-2">Welcome back, {getUserDisplayName()}!</h2>
                <p className="text-[#A5ACAF] max-w-2xl">
                  Connect with your Philly community, join discussions, and discover local events. 
                  Check out the latest updates and conversations in your channels.
                </p>
              </div>
              <button 
                onClick={dismissWelcome}
                className="mt-4 sm:mt-0 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1">
        {/* Channels Sidebar - Only visible on larger screens */}
        <div className="hidden md:block md:col-span-3 pl-0 sticky top-20 self-start">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#004C54]">Your Channels</h2>
            </div>
            <ChannelList 
              onSelectChannel={handleChannelSelect}
              selectedChannelId={selectedChannelId}
            />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="md:col-span-9 flex flex-col flex-1">
          {selectedChannelId ? (
            <div className="flex flex-col flex-1">
              <div className="mb-4">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <ChannelView channelId={selectedChannelId} />
                </div>
              </div>
              
              {/* Posts with their own input */}
              <div ref={postsRef} id="posts-section" className="scroll-mt-20 flex-1">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <PostList channelId={selectedChannelId} />
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white rounded-xl shadow-md"
            >
              <div className="w-16 h-16 bg-[#004C54]/10 rounded-full flex items-center justify-center mb-4">
                <FaUsers size={32} className="text-[#004C54]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Select a channel</h2>
              <p className="text-gray-500 max-w-md">
                Choose a channel from the {isMobile ? 'list below' : 'sidebar'} or create a new one to start connecting with your community
              </p>
            </motion.div>
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
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#004C54]">Your Channels</h2>
            </div>
            <ChannelList 
              onSelectChannel={handleChannelSelect}
              selectedChannelId={selectedChannelId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
