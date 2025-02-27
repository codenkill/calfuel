'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      fullError: error
    });
  }, [error]);

  const errorMessage = error?.message || 'We apologize for the inconvenience. Please try again.';
  const isFirebaseError = errorMessage.includes('Firebase');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isFirebaseError ? 'Configuration Error' : 'Something went wrong'}
        </h2>
        <p className="text-gray-600 mb-2">{errorMessage}</p>
        {isFirebaseError && (
          <p className="text-sm text-gray-500 mb-6">
            Please make sure all environment variables are properly set in Vercel.
          </p>
        )}
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors w-full"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
} 