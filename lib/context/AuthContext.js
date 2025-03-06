"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateEmail as updateFirebaseEmail, updatePassword as updateFirebasePassword } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      throw new Error('Firebase authentication is not initialized. Please check your environment variables.');
    }

    const unsubscribe = onAuthStateChanged(auth, 
      async (user) => {
        if (user) {
          setUser(user);
          // Check subscription status only for authenticated users
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsSubscribed(userDoc.data()?.isSubscribed || false);
          }
        } else {
          setUser(null);
          setIsSubscribed(false);
          if (pathname.startsWith('/dashboard')) {
            router.push('/auth');
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, error, isSubscribed }}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 