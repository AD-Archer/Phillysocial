'use client';
import { useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

interface Position {
  top: number;
  left: number;
}

interface UseUserMiniProfileReturn {
  isOpen: boolean;
  user: User | null;
  position: Position | null;
  loading: boolean;
  error: string | null;
  openProfile: (userId: string, event: React.MouseEvent) => Promise<void>;
  closeProfile: () => void;
}

export const useUserMiniProfile = (): UseUserMiniProfileReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openProfile = useCallback(async (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate position based on click event
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      
      // Position the popup to the right of the element if possible, otherwise to the left
      const windowWidth = window.innerWidth;
      const popupWidth = 288; // w-72 = 18rem = 288px
      
      let left = rect.right + 10;
      if (left + popupWidth > windowWidth) {
        left = rect.left - popupWidth - 10;
      }
      
      // If still doesn't fit, center it
      if (left < 0) {
        left = Math.max(10, (windowWidth - popupWidth) / 2);
      }
      
      // Position vertically centered with the element
      const top = rect.top + window.scrollY;
      
      setPosition({ top, left });
      
      // Fetch user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          uid: userId,
          displayName: userData.fullName || userData.displayName || 'Unknown User',
          email: userData.email || '',
          photoURL: userData.photoURL,
          bio: userData.bio || ''
        });
        setIsOpen(true);
      } else {
        setError('User not found');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeProfile = useCallback(() => {
    setIsOpen(false);
    setUser(null);
    setPosition(null);
  }, []);

  return {
    isOpen,
    user,
    position,
    loading,
    error,
    openProfile,
    closeProfile
  };
};

export default useUserMiniProfile; 