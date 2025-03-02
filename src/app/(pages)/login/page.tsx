'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signInWithGoogle } from '@lib/auth';
import { useRouter } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Both fields are required.');
      }

      const userCredential = await signIn(email, password);
      console.log('Login successful, user:', userCredential.uid);
      
      // Check if user document exists, if not create it
      try {
        const userRef = doc(db, 'users', userCredential.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('First time login, creating user document');
          // Create user document for first-time login
          await setDoc(userRef, {
            displayName: userCredential.displayName || '',
            email: userCredential.email,
            photoURL: userCredential.photoURL || '',
            bio: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'online',
            role: 'member'
          });
          
          // Redirect to profile completion for new users
          console.log('Redirecting new user to profile completion');
          await router.push('/profile?complete=required');
          return;
        }
        
        // Check if profile is complete
        const userData = userDoc.data();
        const isProfileComplete = Boolean(
          userData.displayName && 
          userData.bio && 
          userData.bio.trim().length > 0
        );
        
        console.log('Profile complete:', isProfileComplete);
        
        // Redirect based on profile completion status
        if (isProfileComplete) {
          console.log('Redirecting to dashboard');
          await router.push('/dashboard');
        } else {
          console.log('Redirecting to profile completion');
          await router.push('/profile?complete=required');
        }
      } catch (docError) {
        console.error('Error checking/creating user document:', docError);
        throw docError;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Login error:', err.message);
        setError(err.message);
      } else {
        console.error('Unknown login error');
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      console.log('Google login successful, user:', userCredential.uid);
      
      // Check if user document exists, if not create it
      try {
        const userRef = doc(db, 'users', userCredential.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          console.log('First time Google login, creating user document');
          // Create user document for first-time Google login
          await setDoc(userRef, {
            displayName: userCredential.displayName || '',
            email: userCredential.email,
            photoURL: userCredential.photoURL || '',
            bio: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'online',
            role: 'member'
          });
        }
        
        // Check if profile is complete
        const userData = userDoc.exists() ? userDoc.data() : { displayName: userCredential.displayName, bio: '' };
        const isProfileComplete = Boolean(
          userData.displayName && 
          userData.bio && 
          userData.bio.trim().length > 0
        );
        
        console.log('Profile complete:', isProfileComplete);
        
        // Redirect based on profile completion status
        if (isProfileComplete) {
          console.log('Redirecting to dashboard');
          await router.push('/dashboard');
        } else {
          console.log('Redirecting to profile completion');
          await router.push('/profile?complete=required');
        }
      } catch (docError) {
        console.error('Error checking/creating user document:', docError);
        throw docError;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Google login error:', err.message);
        setError(err.message);
      } else {
        console.error('Unknown Google login error');
        setError('Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <form onSubmit={handleSubmit} className="bg-[#f0f5f5] p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Sign In</h1>
          
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={loading}
          >
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
              alt="Google logo" 
              width={20} 
              height={20} 
              className="w-5 h-5"
            />
            Sign in with Google
          </button>

          <p className="mt-4 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </MainLayout>
  );
}