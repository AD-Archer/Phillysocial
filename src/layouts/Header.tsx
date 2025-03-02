'use client';
import React from 'react';
import { FaBars, FaUser } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick }) => {
  const { user } = useAuth();
  const router = useRouter();
  
  // Get the profile picture URL from firestoreData if available, otherwise use the default photoURL
  const profilePicture = user?.firestoreData?.photoURL || user?.photoURL;
  // Get the display name or email for the fallback avatar
  const displayName = user?.firestoreData?.displayName || user?.displayName;
  const email = user?.firestoreData?.email || user?.email;

  const handleSignInClick = () => {
    router.push('/login');
  };

  return (
    <header className="bg-[#003940] text-white p-4 shadow-lg fixed top-0 w-full z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="text-white focus:outline-none"
          >
            <FaBars size={24} />
          </button>
          <Link href="/" className="text-lg font-bold hover:text-[#A5ACAF] transition-colors">
            Philly Social
          </Link>
        </div>
        
        {user ? (
          <div className="relative">
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {(displayName || email || '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-white truncate max-w-[150px]">
                {displayName || email}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSignInClick}
              className="flex items-center space-x-2 px-3 py-1.5 bg-[#004C54] hover:bg-[#003940] rounded-md transition-colors focus:outline-none"
            >
              <FaUser size={14} />
              <span className="text-sm font-medium">Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;