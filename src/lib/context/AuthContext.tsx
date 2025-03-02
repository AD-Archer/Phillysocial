'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Extend the Firebase User type
type ExtendedUser = User & {
  firestoreData?: {
    displayName?: string;
    photoURL?: string;
    [key: string]: unknown;
  };
};

interface AuthContextType {
  user: ExtendedUser | null;
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
  const [user, setUser] = useState<ExtendedUser | null>(null);
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
        
        // Fetch user data from Firestore
        try {
          const userRef = doc(db, 'users', authUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            // Attach Firestore data to the user object
            const extendedUser = {
              ...authUser,
              firestoreData: userSnap.data()
            } as ExtendedUser;
            
            setUser(extendedUser);
          } else {
            setUser(authUser as ExtendedUser);
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          setUser(authUser as ExtendedUser);
        }
      } else {
        setUser(null);
      }
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
      
      // Update the state with the latest user, preserving firestoreData
      const updatedUser = { 
        ...currentUser,
        ...(user?.firestoreData && { firestoreData: user.firestoreData })
      } as ExtendedUser;
      
      setUser(updatedUser);
      
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