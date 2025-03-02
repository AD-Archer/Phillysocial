'use client';
import { FaExclamationCircle } from 'react-icons/fa';

export default function GlobalError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#e6f0f0] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <FaExclamationCircle className="text-red-600 h-16 w-16" />
            </div>
            <h1 className="text-2xl font-bold text-[#004C54] mb-4">Critical Error</h1>
            <p className="text-gray-600 mb-8">
              A critical error has occurred. We&apos;re working on fixing it.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-[#004C54] text-white rounded-md hover:bg-[#003940] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 