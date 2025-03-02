'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import Header from '@/layouts/Header';
import Sidebar from '@/layouts/Sidebar';
import Link from 'next/link';

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);

  // Create a dedicated toggle function to handle sidebar state
  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={toggleSidebar}
        onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {/* Profile Dropdown */}
      {isProfileOpen && (
        <div className="absolute right-4 top-16 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[60]">
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

      {/* Login/Register prompt for non-authenticated users */}
      {!user && showLoginPrompt && (
        <div className="fixed top-16 right-4 mt-2 p-4 bg-white rounded-md shadow-lg z-50 w-64">
          <button 
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
          >
            ✕
          </button>
          <p className="text-sm text-gray-700 mb-3">
            Sign in to access all features including saving articles, commenting, and personalizing your news feed.
          </p>
          <div className="flex space-x-2">
            <Link 
              href="/login" 
              className="flex-1 px-4 py-2 bg-[#004C54] text-white text-sm font-medium rounded-md text-center hover:bg-[#003940] transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md text-center hover:bg-gray-200 transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-16">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 