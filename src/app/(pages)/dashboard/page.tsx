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
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaCompass, FaUsers, FaCalendarAlt, FaStore, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    if (!loading && !user) {
      router.push('/login');
    }
    
    // Check if welcome message has been dismissed before
    const dismissed = localStorage.getItem('welcomeDismissed');
    if (dismissed === 'true') {
      setWelcomeDismissed(true);
    }
    
    // Add Eagles font and breathing gradient if not already added
    const eaglesFontExists = document.head.querySelector('#eagles-font-style');
    if (!eaglesFontExists) {
      const style = document.createElement('style');
      style.id = 'eagles-font-style';
      style.textContent = `
        @font-face {
          font-family: 'NFLEagles';
          src: url('/font/NFLEAGLE.TTF') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        .eagles-font {
          font-family: 'NFLEagles', sans-serif;
        }
      `;
      document.head.appendChild(style);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
          <p className="text-white text-lg">Loading your Philly Social experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Quick links for dashboard
  const quickLinks = [
    { icon: <FaHome size={20} />, label: 'Home', href: '/dashboard' },
    { icon: <FaCompass size={20} />, label: 'Discover', href: '/discover' },
    { icon: <FaUsers size={20} />, label: 'Communities', href: '/communities' },
    { icon: <FaCalendarAlt size={20} />, label: 'Events', href: '/events' },
    { icon: <FaStore size={20} />, label: 'Local Business', href: '/local-business' },
  ];

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
          
          {/* Quick Links - Desktop */}
          <div className="hidden md:flex mb-6 bg-white rounded-xl shadow-md overflow-hidden">
            {quickLinks.map((link, index) => (
              <motion.div 
                key={index}
                whileHover={{ backgroundColor: 'rgba(0, 76, 84, 0.05)' }}
                className="flex-1"
              >
                <Link 
                  href={link.href}
                  className="flex flex-col items-center justify-center p-4 text-gray-700 hover:text-[#004C54] transition-colors"
                >
                  <div className="text-[#004C54] mb-2">{link.icon}</div>
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
          
          {/* Quick Links - Mobile */}
          <div className="flex md:hidden mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex space-x-2">
              {quickLinks.map((link, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href={link.href}
                    className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md text-gray-700 whitespace-nowrap"
                  >
                    <span className="text-[#004C54]">{link.icon}</span>
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

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
        </main>
      </div>
    </div>
  );
}
