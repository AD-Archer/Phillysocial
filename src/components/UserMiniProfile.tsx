'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

interface UserMiniProfileProps {
  user: User;
  onClose: () => void;
  position?: { top: number; left: number };
}

const UserMiniProfile: React.FC<UserMiniProfileProps> = ({
  user,
  onClose,
  position
}) => {
  const profileRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the profile to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Default positioning if not provided
  const defaultPosition = {
    top: 50,
    left: 50
  };

  const profilePosition = position || defaultPosition;

  return (
    <div 
      ref={profileRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl p-4 w-72"
      style={{
        top: `${profilePosition.top}px`,
        left: `${profilePosition.left}px`,
        maxWidth: '90vw'
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-[#004C54]">User Profile</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
          aria-label="Close profile"
        >
          <FaTimes size={16} />
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-4">
        <div className="w-16 h-16 rounded-full overflow-hidden">
          <Image
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName}
            width={64}
            height={64}
            className="object-cover w-full h-full"
          />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{user.displayName}</h4>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </div>

      {user.bio && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-gray-700 mb-1">Bio</h5>
          <p className="text-sm text-gray-600">{user.bio}</p>
        </div>
      )}
    </div>
  );
};

export default UserMiniProfile; 