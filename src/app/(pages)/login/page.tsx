'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, signUp, signInWithGoogle } from '@lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaGoogle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '@/lib/context/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if user is already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Check for mode parameter in URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [searchParams]);

  // Add Eagles font and breathing gradient
  useEffect(() => {
    // Add the Eagles font to the document
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'NFLEagles';
        src: url('/font/NFLEAGLE.TTF') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      .eagles-font {
        font-family: 'NFLEagles', sans-serif;
      }
      
      .breathing-gradient {
        background-size: 400% 400%;
        animation: gradient 15s ease infinite;
      }
      
      @keyframes gradient {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!email || !password) {
          throw new Error('Both fields are required.');
        }
        await signIn(email, password);
        router.push('/dashboard');
      } else {
        if (!name || !email || !password) {
          throw new Error('All fields are required.');
        }
        // Show success animation before redirecting
        setSuccess(true);
        
        // Simulate a delay for the success animation
        setTimeout(async () => {
          await signUp(email, password);
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err: unknown) {
      setSuccess(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`Failed to ${isLogin ? 'sign in' : 'sign up'}. Please try again.`);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    
    // Update URL without refreshing the page
    const newUrl = isLogin 
      ? `${window.location.pathname}?mode=signup` 
      : window.location.pathname;
    
    window.history.pushState({}, '', newUrl);
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  return (
    <MainLayout>
      <div className="min-h-screen breathing-gradient bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        {authLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : user ? (
          // This should never render because of the redirect, but just in case
          <div className="text-center text-white">
            <p>You are already signed in. Redirecting to dashboard...</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-md w-full"
          >
            <div className="text-center mb-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-6 inline-block"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <Image
                    src="/Logo.png"
                    alt="Philly Social Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </motion.div>
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={isLogin ? "login-title" : "signup-title"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl eagles-font tracking-tight text-white mb-2"
                >
                  {isLogin ? (
                    <>Welcome <span className="text-[#A5ACAF]">Back</span></>
                  ) : (
                    <>Join <span className="text-[#A5ACAF]">Philly Social</span></>
                  )}
                </motion.h1>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={isLogin ? "login-subtitle" : "signup-subtitle"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[#A5ACAF] text-lg"
                >
                  {isLogin 
                    ? "Sign in to connect with your community" 
                    : "Connect with your community and make a difference"
                  }
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 shadow-xl">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-6"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
                  <p className="text-[#A5ACAF]">Redirecting you to your dashboard...</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait" custom={isLogin ? -1 : 1}>
                  <motion.form
                    key={isLogin ? "login-form" : "signup-form"}
                    custom={isLogin ? -1 : 1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    onSubmit={handleSubmit}
                  >
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/20 border border-red-500/50 text-white p-4 rounded-lg mb-6"
                      >
                        <p className="text-center">{error}</p>
                      </motion.div>
                    )}

                    {!isLogin && (
                      <div className="mb-5">
                        <label className="block text-[#A5ACAF] mb-2 text-sm font-medium" htmlFor="name">
                          Full Name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaUser className="text-[#A5ACAF]" />
                          </div>
                          <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required={!isLogin}
                            className="bg-black/20 text-white pl-10 block w-full border border-[#A5ACAF]/30 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#A5ACAF] focus:border-transparent placeholder-[#A5ACAF]/50"
                            placeholder="Enter your name"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-5">
                      <label className="block text-[#A5ACAF] mb-2 text-sm font-medium" htmlFor="email">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaEnvelope className="text-[#A5ACAF]" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="bg-black/20 text-white pl-10 block w-full border border-[#A5ACAF]/30 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#A5ACAF] focus:border-transparent placeholder-[#A5ACAF]/50"
                          placeholder="Enter your email"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-[#A5ACAF] mb-2 text-sm font-medium" htmlFor="password">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FaLock className="text-[#A5ACAF]" />
                        </div>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="bg-black/20 text-white pl-10 block w-full border border-[#A5ACAF]/30 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#A5ACAF] focus:border-transparent placeholder-[#A5ACAF]/50"
                          placeholder={isLogin ? "Enter your password" : "Create a password"}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      className="w-full bg-[#A5ACAF] text-[#003038] py-3 px-4 rounded-xl font-semibold hover:bg-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54] disabled:opacity-50"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading 
                        ? (isLogin ? 'Signing in...' : 'Creating Account...') 
                        : (isLogin ? 'Sign In' : 'Create Account')
                      }
                    </motion.button>

                    <div className="mt-6 relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#A5ACAF]/30"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-[#004C54] text-[#A5ACAF]">Or continue with</span>
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="mt-6 w-full flex items-center justify-center gap-2 bg-white/10 border border-[#A5ACAF]/30 rounded-xl p-3 text-white hover:bg-white/20 transition-colors duration-300 disabled:opacity-50"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaGoogle className="text-white" />
                      Sign {isLogin ? 'in' : 'up'} with Google
                    </motion.button>

                    <motion.div 
                      className="mt-6 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <button
                        type="button"
                        onClick={toggleAuthMode}
                        className="text-white hover:text-[#A5ACAF] font-medium inline-flex items-center transition-colors duration-300"
                      >
                        {isLogin ? (
                          <>
                            Don&apos;t have an account? <span className="ml-1 underline">Sign Up</span>
                            <FaArrowRight className="ml-2" />
                          </>
                        ) : (
                          <>
                            <FaArrowLeft className="mr-2" />
                            Already have an account? <span className="ml-1 underline">Sign In</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </motion.form>
                </AnimatePresence>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[#A5ACAF] text-sm">
                By continuing, you agree to our{' '}
                <Link href="#" className="text-white hover:text-[#A5ACAF]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-white hover:text-[#A5ACAF]">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}