'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import useUserMiniProfile from '@/lib/hooks/useUserMiniProfile';
import UserMiniProfile from '@/components/Profile/UserMiniProfile';

interface UserMiniProfileContextType {
  openProfile: (userId: string, event: React.MouseEvent) => Promise<void>;
  closeProfile: () => void;
  loading: boolean;
}

const UserMiniProfileContext = createContext<UserMiniProfileContextType | undefined>(undefined);

export const useUserMiniProfileContext = () => {
  const context = useContext(UserMiniProfileContext);
  if (context === undefined) {
    throw new Error('useUserMiniProfileContext must be used within a UserMiniProfileProvider');
  }
  return context;
};

interface UserMiniProfileProviderProps {
  children: ReactNode;
}

export const UserMiniProfileProvider: React.FC<UserMiniProfileProviderProps> = ({ children }) => {
  const {
    isOpen,
    user,
    position,
    loading,
    openProfile,
    closeProfile
  } = useUserMiniProfile();

  return (
    <UserMiniProfileContext.Provider value={{ openProfile, closeProfile, loading }}>
      {children}
      {isOpen && user && position && (
        <UserMiniProfile
          user={user}
          onClose={closeProfile}
          position={position}
        />
      )}
    </UserMiniProfileContext.Provider>
  );
};

export default UserMiniProfileProvider; 