import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, collection, doc, getDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators if in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // Auth emulator typically runs on port 9099
  connectAuthEmulator(auth, 'http://localhost:9099');
  
  // Firestore emulator typically runs on port 8080
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Storage emulator typically runs on port 9199
  connectStorageEmulator(storage, 'localhost', 9199);
  
  console.log('Connected to Firebase emulators');
}

// Helper function to check if a user has permission to access a channel
export const userCanAccessChannel = async (userId: string, channelId: string): Promise<boolean> => {
  try {
    const channelRef = doc(db, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    
    if (!channelSnap.exists()) return false;
    
    const channelData = channelSnap.data();
    return channelData.isPublic || channelData.members.includes(userId);
  } catch (error) {
    console.error('Error checking channel access:', error);
    return false;
  }
};

// Helper function to check if a user has permission to post in a channel
export const userCanPostInChannel = async (userId: string, channelId: string): Promise<boolean> => {
  try {
    const channelRef = doc(db, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);
    
    if (!channelSnap.exists()) return false;
    
    const channelData = channelSnap.data();
    return channelData.members.includes(userId);
  } catch (error) {
    console.error('Error checking posting permission:', error);
    return false;
  }
};

export { app, auth, db, storage }; 