'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaSignInAlt, FaUserPlus, FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick }) => {
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileToggle = () => {
    setIsProfileOpen(!isProfileOpen);
    onProfileClick(); // Keep the original handler for backward compatibility
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsProfileOpen(false);
      router.push('/');
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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

  // Animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <header className="bg-gradient-to-r from-[#003940] to-[#046A38] text-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)] fixed top-0 w-full z-[50]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onMenuClick}
            className="text-white focus:outline-none hover:text-[#A5ACAF] transition-colors"
            aria-label="Open menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaBars size={24} />
          </motion.button>
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative w-10 h-10">
              <Image
                src="/Logo.png"
                alt="Philly Social Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl eagles-font">Philly Social</h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {!user && (
            <div className="hidden md:flex space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#A5ACAF] to-[#046A38] rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <Link 
                  href="/login" 
                  className="relative flex items-center space-x-2 bg-[#003940] border border-[#A5ACAF]/50 text-[#A5ACAF] px-4 py-2 rounded-lg hover:text-white transition-colors duration-300"
                >
                  <FaSignInAlt />
                  <span>Sign In</span>
                </Link>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  href="/signup" 
                  className="flex items-center space-x-2 bg-[#A5ACAF] text-[#003038] px-4 py-2 rounded-lg hover:bg-white transition-colors duration-300 shadow-lg"
                >
                  <FaUserPlus />
                  <span>Sign Up</span>
                </Link>
              </motion.div>
            </div>
          )}
          
          {user && (
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={handleProfileToggle}
                  className="flex items-center space-x-2 focus:outline-none bg-black/20 rounded-full pl-2 pr-4 py-1 hover:bg-black/30 transition-colors"
                  aria-label="Open profile menu"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#A5ACAF] flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                    {user?.photoURL ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={user.photoURL}
                          alt="Profile"
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <FaUserCircle size={24} className="text-[#003940]" />
                    )}
                  </div>
                  <span className="hidden md:block text-white font-medium">
                    {getUserDisplayName()}
                  </span>
                </motion.button>
                
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white z-50 overflow-hidden"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {/* User info header */}
                      <div className="bg-gradient-to-r from-[#003940] to-[#046A38] p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-[#A5ACAF] flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            {user?.photoURL ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={user.photoURL}
                                  alt="Profile"
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <FaUserCircle size={36} className="text-[#003940]" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{getUserDisplayName()}</p>
                            <p className="text-[#A5ACAF] text-sm truncate max-w-[180px]">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div className="py-2">
                        <Link href="/profile" className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors">
                          <FaUser className="text-[#004C54]" />
                          <span>My Profile</span>
                        </Link>
                       
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <FaSignOutAlt />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;