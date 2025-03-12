"use client";

import { useEffect } from 'react';
import { useAuth } from '../lib/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }) {
  const { user, loading, subscriptionStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('ProtectedRoute effect:', {
      loading,
      hasUser: !!user,
      subscriptionStatus,
      userEmail: user?.email
    });

    // Only redirect if we have complete information
    if (!loading && user && subscriptionStatus === null) {
      // Wait for subscription status to be determined
      return;
    }

    if (!loading) {
      if (!user) {
        console.log('No user, redirecting to auth');
        router.push('/auth');
      } else if (subscriptionStatus !== 'active') {
        console.log('User not subscribed, redirecting to subscribe');
        router.push('/subscribe');
      } else {
        console.log('User authenticated and subscribed');
      }
    }
  }, [user, loading, subscriptionStatus, router]);

  // Show loading state while we're determining subscription status
  if (loading || (user && subscriptionStatus === null)) {
    console.log('ProtectedRoute: Loading or determining subscription status...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || subscriptionStatus !== 'active') {
    console.log('ProtectedRoute: Access denied -', !user ? 'No user' : 'Not subscribed');
    return null;
  }

  console.log('ProtectedRoute: Rendering protected content');
  return children;
} 