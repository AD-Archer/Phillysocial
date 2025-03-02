'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import Sidebar from '@/layouts/Sidebar';
import Header from '@/layouts/Header';
import { motion } from 'framer-motion';
import { FaHome, FaCompass, FaCalendarAlt, FaStore, FaLock, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthMessage, setShowAuthMessage] = useState(false);

  // Create a dedicated toggle function to handle sidebar state
  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthMessage(true);
      // Don't redirect immediately, show the message first
      // We'll still have a button to redirect to login
    }
    
    // Add Eagles font if not already added
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

  // Quick links for dashboard
  const quickLinks = [
    { icon: <FaHome size={20} />, label: 'Home', href: '/dashboard' },
    { icon: <FaCompass size={20} />, label: 'Discover', href: '/dashboard/discover' },
    { icon: <FaCalendarAlt size={20} />, label: 'Events', href: '/dashboard/events' },
    { icon: <FaStore size={20} />, label: 'Local Business', href: '/local-business' },
  ];

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

  if (showAuthMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#004C54]/10 rounded-full flex items-center justify-center">
              <FaLock size={40} className="text-[#004C54]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 text-center mb-8">
            You need to be logged in to access the dashboard and connect with your Philly community.
          </p>
          
          <div className="flex flex-col space-y-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className="w-full bg-[#004C54] text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium"
            >
              <FaSignInAlt className="mr-2" /> Log In
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/signup')}
              className="w-full bg-white border border-[#004C54] text-[#004C54] py-3 px-4 rounded-lg flex items-center justify-center font-medium"
            >
              <FaUserPlus className="mr-2" /> Sign Up
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg flex items-center justify-center font-medium"
            >
              Return to Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onMenuClick={toggleSidebar}
        onProfileClick={() => {}}
        isSidebarOpen={isSidebarOpen}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <div className="pt-16 flex-1 flex flex-col">
        <main className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 w-full flex-1 flex flex-col">
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

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
} 