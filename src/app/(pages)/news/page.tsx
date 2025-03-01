'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { auth } from '@/lib/firebaseConfig';
import { signOut } from 'firebase/auth';
import NewsFeed from '@/components/NewsFeed';
import Header from '@/layouts/Header';
import Sidebar from '@/components/Sidebar';
import { FaNewspaper, FaFilter } from 'react-icons/fa';

export default function NewsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const categories = [
    { id: null, name: 'All News' },
    { id: 'general', name: 'General' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'education', name: 'Education' },
    { id: 'lifestyle', name: 'Lifestyle' }
  ];

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
      <div className="pt-16 lg:pl-64">
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaNewspaper className="mr-2 text-[#004C54]" />
                  Philadelphia News
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Stay updated with the latest news from Philadelphia&apos;s top sources
                </p>
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <FaFilter className="text-gray-400" />
                  <select
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(e.target.value || null)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#004C54] focus:border-[#004C54] sm:text-sm rounded-md"
                  >
                    {categories.map((category) => (
                      <option key={category.id || 'all'} value={category.id || ''}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <NewsFeed category={selectedCategory || undefined} limit={50} />
        </main>
      </div>
    </div>
  );
}
