'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUserProfile: (profileData: { displayName?: string; photoURL?: string }) => Promise<void>;
  ensureUserDocument: (user: User) => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUserProfile: async () => {},
  ensureUserDocument: async () => {},
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to ensure a user document exists in Firestore
  const ensureUserDocument = async (user: User) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      // If the user document doesn't exist, create it
      if (!userSnap.exists()) {
        console.log('Creating new user document for:', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous',
          email: user.email,
          photoURL: user.photoURL || '',
          createdAt: new Date(),
          joinedAt: new Date(),
          updatedAt: new Date(),
          bio: '',
          theme: 'light'
        });
      }
    } catch (error) {
      console.error('Error ensuring user document exists:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // Ensure user document exists when user signs in
        await ensureUserDocument(authUser);
      }
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (profileData: { displayName?: string; photoURL?: string }) => {
    // Get the current user directly from auth instead of using the state
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is signed in');
    }
    
    try {
      // Update the profile using the current user from auth
      await updateProfile(currentUser, profileData);
      
      // Update the state with the latest user
      setUser({ ...currentUser });
      
      console.log('Profile updated successfully:', profileData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUserProfile, ensureUserDocument }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 