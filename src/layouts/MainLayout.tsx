'use client';
import React, { useState, useEffect } from 'react';
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

  // Add meta viewport tag to ensure proper mobile scaling
  useEffect(() => {
    // Check if viewport meta tag exists
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      // Create viewport meta tag if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0';
      document.head.appendChild(meta);
    } else {
      // Update existing viewport meta tag
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    }
    
    // Add touch scrolling styles
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      .mobile-scroll {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header 
        onMenuClick={toggleSidebar}
        onProfileClick={() => setIsProfileOpen(!isProfileOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-grow w-full pt-16 mobile-scroll">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout; 