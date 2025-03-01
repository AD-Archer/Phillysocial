'use client';
import React from 'react';
import { FaBars } from 'react-icons/fa';
import Image from 'next/image';
import { useAuth } from '@/lib/context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onProfileClick }) => {
  const { user } = useAuth();

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
          <h1 className="text-lg font-bold">Philly Social</h1>
        </div>
        
        {user && (
          <div className="relative">
            <button
              onClick={onProfileClick}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-white">{user?.email}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;