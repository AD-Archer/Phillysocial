'use client';
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from '@/layouts/Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Create a dedicated toggle function to handle sidebar state
  const toggleSidebar = () => {
    setIsSidebarOpen(prevState => !prevState);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header 
        onMenuClick={toggleSidebar}
        onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-grow w-full pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 