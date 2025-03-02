'use client';
import React from 'react';
import { useUserMiniProfileContext } from '@/lib/context/UserMiniProfileContext';

interface UserProfileLinkProps {
  userId: string;
  displayName: string;
  className?: string;
}

const UserProfileLink: React.FC<UserProfileLinkProps> = ({
  userId,
  displayName,
  className = ''
}) => {
  const { openProfile, loading } = useUserMiniProfileContext();

  const handleClick = (e: React.MouseEvent) => {
    openProfile(userId, e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-[#004C54] hover:underline font-medium cursor-pointer ${className}`}
      aria-label={`View ${displayName}'s profile`}
    >
      {displayName}
    </button>
  );
};

export default UserProfileLink; 