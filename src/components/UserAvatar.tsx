'use client';
import React from 'react';
import Image from 'next/image';
import { useUserMiniProfileContext } from '@/lib/context/UserMiniProfileContext';

interface UserAvatarProps {
  userId: string;
  displayName: string;
  photoURL?: string;
  size?: number;
  showStatus?: boolean;
  status?: 'online' | 'offline' | 'away' | 'deleted';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  displayName,
  photoURL,
  size = 40,
  showStatus = false,
  status = 'offline',
  className = ''
}) => {
  const { openProfile, loading } = useUserMiniProfileContext();

  const handleClick = (e: React.MouseEvent) => {
    openProfile(userId, e);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'deleted':
        return 'bg-red-500';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`relative inline-block ${className}`}
      aria-label={`View ${displayName}'s profile`}
    >
      <div 
        className="rounded-full overflow-hidden"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <Image
          src={photoURL || '/default-avatar.png'}
          alt={displayName}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
      
      {showStatus && (
        <div 
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${getStatusColor()}`}
          style={{ 
            width: `${size / 4}px`, 
            height: `${size / 4}px`,
            bottom: '0',
            right: '0'
          }}
        />
      )}
    </button>
  );
};

export default UserAvatar; 