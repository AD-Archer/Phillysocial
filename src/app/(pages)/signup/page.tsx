'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signUp, signInWithGoogle } from '@lib/auth';
import { useRouter } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!name || !email || !password) {
        throw new Error('All fields are required.');
      }

      // Check if a user with this email already exists in Firestore
      try {
        console.log('Checking if email already exists:', email);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          console.log('Email already in use');
          throw new Error('Email already in use. Please sign in instead.');
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Error checking email availability.');
      }

      console.log('Creating new user with email:', email);
      const userCredential = await signUp(email, password);
      
      // Create initial user document with name but incomplete profile
      try {
        await setDoc(doc(db, 'users', userCredential.uid), {
          displayName: name,
          email: userCredential.email,
          photoURL: '',
          bio: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'online',
          role: 'member'
        });
        console.log('User document created successfully');
      } catch (docError) {
        console.error('Error creating initial user document:', docError);
      }
      
      // Redirect to profile completion
      console.log('Redirecting to profile completion');
      router.push('/profile?complete=required');
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Signup error:', err.message);
        setError(err.message);
      } else {
        console.error('Unknown signup error');
        setError('Failed to sign up. Please try again.');
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
      console.log('Google sign-in successful, checking if user exists:', userCredential.uid);
      
      // Check if user document already exists
      try {
        const userRef = doc(db, 'users', userCredential.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          console.log('User already exists, checking profile completion');
          // User already exists, check if profile is complete
          const userData = userDoc.data();
          const isProfileComplete = Boolean(
            userData.displayName && 
            userData.bio && 
            userData.bio.trim().length > 0
          );
          
          if (isProfileComplete) {
            console.log('Profile is complete, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            console.log('Profile is incomplete, redirecting to profile completion');
            router.push('/profile?complete=required');
          }
        } else {
          console.log('New user, creating document');
          // New user, create document
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
          
          // Redirect to profile completion
          console.log('Redirecting new user to profile completion');
          router.push('/profile?complete=required');
        }
      } catch (docError) {
        console.error('Error checking/creating user document:', docError);
        throw docError;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Google sign-up error:', err.message);
        setError(err.message);
      } else {
        console.error('Unknown Google sign-up error');
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
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Create Your Account</h1>
          
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>

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
              placeholder="Create a password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
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
            Sign up with Google
          </button>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </MainLayout>
  );
}