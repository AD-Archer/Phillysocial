'use client';
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from '@/layouts/Sidebar';
import { useAuth } from '@/lib/context/AuthContext';
import UserMiniProfileProvider from '@/lib/context/UserMiniProfileContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close profile modal when clicking outside
  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };

  return (
    <UserMiniProfileProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
        />
        
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Profile Modal */}
        {isProfileOpen && user && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
              onClick={handleCloseProfile}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
                    <button
                      onClick={handleCloseProfile}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                      <img 
                        src={user.photoURL || '/default-avatar.png'} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{user.displayName || 'User'}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                      onClick={handleCloseProfile}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        <main className="flex-grow w-full pt-16">
          <div className="mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </UserMiniProfileProvider>
  );
};

export default MainLayout; 