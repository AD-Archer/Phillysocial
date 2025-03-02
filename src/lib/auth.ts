import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Signed in
    const user = userCredential.user;
    return user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error signing up:", error);
      throw error.message;
    }
    throw 'Failed to sign up';
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('Auth - Attempting to sign in with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Auth - Sign in successful for user:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error signing in:", error);
      throw error.message;
    }
    throw 'Failed to sign in';
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('Auth - Attempting to sign in with Google');
    const result = await signInWithPopup(auth, googleProvider);
    console.log('Auth - Google sign in successful for user:', result.user.uid);
    return result.user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error signing in with Google:", error);
      throw error.message;
    }
    throw 'Failed to sign in with Google';
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error signing out:", error);
      throw error.message;
    }
    throw 'Failed to sign out';
  }
}; 