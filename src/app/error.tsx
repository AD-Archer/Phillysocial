'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';
import { FaExclamationCircle } from 'react-icons/fa';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center w-full px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <FaExclamationCircle className="text-red-600 h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-[#004C54] mb-4">Something Went Wrong</h1>
          <p className="text-gray-600 mb-8">
            We're sorry, but there was an error processing your request.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-[#004C54] text-[#004C54] rounded-md hover:bg-[#e6f0f0] transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 