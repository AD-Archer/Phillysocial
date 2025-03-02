'use client';
import Link from 'next/link';
import { FaNewspaper, FaUsers, FaUser, FaStream, FaTimes, FaHome, FaInfoCircle, FaCog } from 'react-icons/fa';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const menuItems = [
    { icon: FaHome, label: 'Home', href: '/' },
    { icon: FaStream, label: 'Social Feed', href: '/dashboard' },
    { icon: FaNewspaper, label: 'News Feed', href: '/news' },
    { icon: FaUser, label: 'Profile', href: '/profile' },
    { icon: FaCog, label: 'Settings', href: '/settings' },
    { icon: FaInfoCircle, label: 'About', href: '/about' },
  ];

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (isOpen && sidebar && !sidebar.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Blur overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 backdrop-blur-md bg-black/30 z-[40]" 
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 bg-[#004C54] text-white w-64 min-h-screen p-4 z-[45] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8 border-b border-[#A5ACAF]/20 pb-4">
              <h2 className="text-2xl eagles-font">Philly Social</h2>
              <motion.button 
                onClick={onClose} 
                className="text-white hover:text-[#A5ACAF] transition-colors"
                aria-label="Close sidebar"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes size={24} />
              </motion.button>
            </div>
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.li 
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#003940] transition-colors"
                        onClick={() => onClose()}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>
            
            <motion.div 
              className="absolute bottom-4 left-0 right-0 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="border-t border-[#A5ACAF]/20 pt-4 mt-4">
                <Link
                  href="/contact"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-[#003940] transition-colors"
                  onClick={() => onClose()}
                >
                  <span>Contact Us</span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar; 