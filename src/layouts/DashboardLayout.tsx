'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import Sidebar from '@/layouts/Sidebar';
import Header from '@/layouts/Header';
import { motion } from 'framer-motion';
import { FaHome, FaCompass, FaUsers, FaCalendarAlt, FaStore } from 'react-icons/fa';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Quick links for dashboard
  const quickLinks = [
    { icon: <FaHome size={20} />, label: 'Home', href: '/dashboard' },
    { icon: <FaCompass size={20} />, label: 'Discover', href: '/dashboard/discover' },
    { icon: <FaUsers size={20} />, label: 'Communities', href: '/dashboard/communities' },
    { icon: <FaCalendarAlt size={20} />, label: 'Events', href: '/dashboard/events' },
    { icon: <FaStore size={20} />, label: 'Local Business', href: '/dashboard/local-business' },
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