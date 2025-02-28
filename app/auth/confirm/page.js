"use client";

import { useEffect, useState } from 'react';
import { auth } from '../../../lib/firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const [status, setStatus] = useState('Verifying...');
  const router = useRouter();

  useEffect(() => {
    const handleEmailLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
          // If email is not found in localStorage, you might want to ask the user for it
          email = window.prompt('Please provide your email for confirmation');
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          
          if (result.user) {
            setStatus('Success! Redirecting...');
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error signing in with email link:', error);
          setStatus('Error signing in. Please try again.');
          setTimeout(() => router.push('/auth'), 2000);
        }
      } else {
        setStatus('Invalid sign-in link.');
        setTimeout(() => router.push('/auth'), 2000);
      }
    };

    handleEmailLink();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-3xl">🌱</span>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status}
          </h2>
        </div>
      </div>
    </div>
  );
} 