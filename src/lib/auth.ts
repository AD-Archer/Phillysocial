import { auth } from './firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  AuthError,
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    const result = await signInWithPopup(auth, googleProvider);
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