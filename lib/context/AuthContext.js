"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateEmail as updateFirebaseEmail,
  updatePassword as updateFirebasePassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { checkSubscriptionStatus, manuallyUpdateSubscriptionStatus } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized. Please check your environment variables.');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        setUser(user);
        console.log('Checking user document for:', user.uid);
        // Check subscription status
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('User document exists:', userDoc.exists());
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Complete user data:', userData);

            // Check if user has a Stripe customer ID but subscription status is inactive
            if (userData.stripeCustomerId && userData.subscriptionStatus !== 'active') {
              console.log('User has Stripe customer ID, updating subscription status...');
              await updateDoc(doc(db, 'users', user.uid), {
                subscriptionStatus: 'active',
                updatedAt: new Date()
              });
              setSubscriptionStatus('active');
              console.log('Updated subscription status to active');
              router.push('/dashboard');
              return;
            }

            setSubscriptionStatus(userData.subscriptionStatus || 'inactive');

            // If subscription is active, ensure we're on the dashboard
            if (userData.subscriptionStatus === 'active') {
              router.push('/dashboard');
            }
          } else {
            console.log('Creating new user document');
            // New user - create document with default subscription status
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              subscriptionStatus: 'inactive',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            setSubscriptionStatus('inactive');
          }
        } catch (error) {
          console.error('Error checking/creating user document:', error);
          setError(error.message);
          // Set a default status in case of error
          setSubscriptionStatus('inactive');
        }
      } else {
        setUser(null);
        setSubscriptionStatus(null);
        if (pathname.startsWith('/dashboard')) {
          router.push('/auth');
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [router, pathname]);

  const signUp = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document with default subscription status
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        subscriptionStatus: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      // Redirect to subscription page
      router.push('/subscribe');
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email, password) => {
    console.log('Starting sign in process for:', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User authenticated:', userCredential.user.uid);

      // Check subscription status with detailed logging
      const userData = await checkSubscriptionStatus(userCredential.user.uid);
      console.log('Detailed user data:', userData);

      if (userData && userData.subscriptionStatus === 'active') {
        console.log('User has active subscription, redirecting to dashboard');
        router.push('/dashboard');
      } else {
        console.log('User needs subscription, redirecting to subscribe');
        router.push('/subscribe');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        // New user - create document with default subscription status
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          subscriptionStatus: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (userDoc.data().subscriptionStatus !== 'active') {
        // Existing user without active subscription
        router.push('/subscribe');
        return;
      }

      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    subscriptionStatus,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    sendPasswordResetEmail,
    updateFirebaseEmail,
    updateFirebasePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 