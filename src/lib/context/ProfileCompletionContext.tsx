'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useRouter, usePathname } from 'next/navigation';

interface ProfileCompletionContextType {
  isProfileComplete: boolean;
  checkProfileCompletion: () => Promise<boolean>;
  loading: boolean;
}

const ProfileCompletionContext = createContext<ProfileCompletionContextType>({
  isProfileComplete: false,
  checkProfileCompletion: async () => false,
  loading: true,
});

export const useProfileCompletion = () => useContext(ProfileCompletionContext);

interface ProfileCompletionProviderProps {
  children: ReactNode;
}

export const ProfileCompletionProvider = ({ children }: ProfileCompletionProviderProps) => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkProfileCompletion = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      // Check if the user has completed their profile
      // They need to have a display name and a bio
      const isComplete = Boolean(
        userData.displayName && 
        userData.bio && 
        userData.bio.trim().length > 0
      );
      
      setIsProfileComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  };

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const isComplete = await checkProfileCompletion();
      setLoading(false);

      // Exempt paths that should be accessible without a complete profile
      const exemptPaths = ['/profile', '/login', '/signup', '/logout', '/'];
      const isExemptPath = exemptPaths.some(path => pathname?.startsWith(path));

      console.log('ProfileCompletionContext - Path:', pathname, 'Exempt:', isExemptPath, 'Complete:', isComplete);

      // If profile is incomplete and user is not on an exempt path, redirect to profile
      if (!isComplete && !isExemptPath) {
        console.log('ProfileCompletionContext - Redirecting to profile completion');
        router.push('/profile?complete=required');
      }
    };

    checkAndRedirect();
  }, [user, pathname, checkProfileCompletion, router]);

  return (
    <ProfileCompletionContext.Provider value={{ isProfileComplete, checkProfileCompletion, loading }}>
      {children}
    </ProfileCompletionContext.Provider>
  );
}; 