'use client';
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Profile Dropdown */}
      {isProfileOpen && user && (
        <div className="absolute right-4 top-16 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-grow flex pt-16">
        <main className="flex-grow bg-gradient-to-b from-[#e6f0f0] to-[#d0e0e0] w-full">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout; 