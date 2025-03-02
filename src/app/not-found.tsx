'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/layouts/MainLayout';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@/lib/context/AuthContext';

export default function NotFound() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // If still loading or user is logged in and about to redirect, show minimal loading state
  if (loading || (user && !loading)) {
    return (
      <MainLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
        </div>
      </MainLayout>
    );
  }

  // Show not found page for non-authenticated users
  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center w-full px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <FaExclamationTriangle className="text-[#004C54] h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-[#004C54] mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
            >
              Return Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-[#004C54] text-[#004C54] rounded-md hover:bg-[#e6f0f0] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 