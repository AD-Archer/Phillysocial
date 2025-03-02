'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

// Extended user interface that includes Firestore user data
export interface ExtendedUser extends User {
  firestoreData?: {
    displayName: string;
    photoURL: string;
    bio: string;
    email: string;
    status: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  firestoreLoading: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firestoreLoading: true,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log('AuthContext - Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user');
      setUser(firebaseUser as ExtendedUser | null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync with Firestore user document whenever Firebase user changes
  useEffect(() => {
    if (!user) {
      setFirestoreLoading(false);
      return;
    }

    console.log('AuthContext - Fetching Firestore data for user:', user.uid);
    const userRef = doc(db, 'users', user.uid);
    
    // Set up real-time listener for user data
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        console.log('AuthContext - Firestore user data received');
        const userData = doc.data();
        
        // Create a new user object with the Firestore data
        const extendedUser: ExtendedUser = {
          ...user,
          firestoreData: {
            displayName: userData.displayName || user.displayName || '',
            photoURL: userData.photoURL || user.photoURL || '',
            bio: userData.bio || '',
            email: userData.email || user.email || '',
            status: userData.status || 'online',
            role: userData.role || 'member',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
          }
        };

        // Only update the user state if the extendedUser is different
        if (JSON.stringify(extendedUser) !== JSON.stringify(user)) {
          console.log('AuthContext - Updating user with Firestore data');
          setUser(extendedUser);
        }
      } else {
        console.log('AuthContext - No Firestore document exists for user:', user.uid);
      }
      
      setFirestoreLoading(false);
    }, (error: Error) => {
      console.error("Error fetching user data:", error);
      setFirestoreLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, firestoreLoading }}>
      {!loading && !firestoreLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 