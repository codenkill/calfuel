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

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const checkSubscription = async (user, userData) => {
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          customerId: userData.stripeCustomerId
        }),
      });
      
      const data = await response.json();
      console.log('Subscription check response:', data);
      
      if (data.isActive) {
        console.log('Setting subscription status to active');
        setSubscriptionStatus('active');
        if (userData.subscriptionStatus !== 'active') {
          await updateDoc(doc(db, 'users', user.uid), {
            subscriptionStatus: 'active',
            updatedAt: new Date()
          });
        }
      } else {
        console.log('Setting subscription status to inactive');
        setSubscriptionStatus('inactive');
        if (userData.subscriptionStatus === 'active') {
          await updateDoc(doc(db, 'users', user.uid), {
            subscriptionStatus: 'inactive',
            updatedAt: new Date()
          });
          if (pathname.startsWith('/dashboard')) {
            router.push('/subscribe');
          }
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus(userData.subscriptionStatus || 'inactive');
    }
  };

  useEffect(() => {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized.');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const now = Date.now();
            const timeSinceLastCheck = now - lastChecked;
            const FIVE_MINUTES = 5 * 60 * 1000;

            const urlParams = new URLSearchParams(window.location.search);
            const subscriptionActive = urlParams.get('subscription_active');

            if (subscriptionActive === 'true') {
              console.log('Setting subscription status to active from URL parameter');
              setSubscriptionStatus('active');
              await updateDoc(doc(db, 'users', user.uid), {
                subscriptionStatus: 'active',
                updatedAt: new Date()
              });
              setLastChecked(now);
              return;
            }

            if (
              userData.stripeCustomerId &&
              (timeSinceLastCheck > FIVE_MINUTES || subscriptionStatus === null) &&
              (pathname.startsWith('/dashboard') || pathname === '/subscribe') &&
              userData.subscriptionStatus !== 'active'
            ) {
              await checkSubscription(user, userData);
              setLastChecked(now);
            } else {
              setSubscriptionStatus(userData.subscriptionStatus || 'inactive');
            }

            if (userData.subscriptionStatus === 'active' && pathname === '/subscribe') {
              router.push('/dashboard');
            } else if (userData.subscriptionStatus !== 'active' && pathname.startsWith('/dashboard')) {
              router.push('/subscribe');
            }
          } else {
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              subscriptionStatus: 'inactive',
              createdAt: new Date(),
              updatedAt: new Date()
            });
            setSubscriptionStatus('inactive');
            if (pathname.startsWith('/dashboard')) {
              router.push('/subscribe');
            }
          }
        } catch (error) {
          console.error('Error:', error);
          setError(error.message);
          setSubscriptionStatus('inactive');
        }
      } else {
        setUser(null);
        setSubscriptionStatus(null);
        if (pathname.startsWith('/dashboard')) {
          router.push('/');
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [router, pathname, lastChecked, subscriptionStatus]);

  const signUp = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        subscriptionStatus: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      });
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

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      console.log('User document:', userDoc.exists() ? userDoc.data() : 'No document');

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.stripeCustomerId) {
          try {
            const response = await fetch('/api/check-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: userCredential.user.uid,
                customerId: userData.stripeCustomerId
              }),
            });
            
            const data = await response.json();
            console.log('Subscription check response:', data);
            
            if (data.isActive) {
              console.log('User has active subscription, redirecting to dashboard');
              router.push('/dashboard');
              return;
            }
          } catch (error) {
            console.error('Error checking subscription:', error);
          }
        }
        
        console.log('User needs subscription, redirecting to subscribe');
        router.push('/subscribe');
      } else {
        console.log('No user document found, creating one');
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          subscriptionStatus: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        });
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
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          subscriptionStatus: 'inactive',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else if (userDoc.data().subscriptionStatus !== 'active') {
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