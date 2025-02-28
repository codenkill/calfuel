"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, enableIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
} catch (err) {
  console.warn('Error enabling persistence:', err);
}

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
      setError(null);
    }

    function handleOffline() {
      setIsOffline(true);
      setError('You are currently offline. Some data may not be up to date.');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!window.navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache today's date
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Initial data fetch with retry logic
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    async function fetchInitialData() {
      if (!user) {
        setUserData(null);
        setTodaysMeals([]);
        setLoading(false);
        return;
      }

      try {
        setError(null);
        // Fetch user data and today's meals in parallel
        const [userDoc, mealsDoc] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'users', user.uid, 'meals', today.toISOString().split('T')[0]))
        ]);

        if (!isMounted) return;

        // Process user data
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Process meals data
        if (mealsDoc.exists()) {
          const meals = mealsDoc.data().meals || [];
          setTodaysMeals(meals.sort((a, b) => new Date(a.time) - new Date(b.time)));
        } else {
          setTodaysMeals([]);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        if (!isMounted) return;

        if (retryCount < maxRetries && error.code === 'failed-precondition') {
          retryCount++;
          setTimeout(fetchInitialData, retryDelay * retryCount);
        } else {
          setError(error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [user, today]);

  // Setup real-time listeners after initial load
  useEffect(() => {
    if (!user || loading) return;

    const unsubscribers = [];

    // Subscribe to user data changes with error handling
    const userUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
          setError(null);
        }
      },
      (error) => {
        console.error('Error in user data subscription:', error);
        if (error.code !== 'failed-precondition') {
          setError('Error updating user data. Some information may be outdated.');
        }
      }
    );
    unsubscribers.push(userUnsubscribe);

    // Subscribe to today's meals with error handling
    const mealsUnsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'meals', today.toISOString().split('T')[0]),
      (doc) => {
        if (doc.exists()) {
          const meals = doc.data().meals || [];
          setTodaysMeals(meals.sort((a, b) => new Date(a.time) - new Date(b.time)));
          setError(null);
        } else {
          setTodaysMeals([]);
        }
      },
      (error) => {
        console.error('Error in meals subscription:', error);
        if (error.code !== 'failed-precondition') {
          setError('Error updating meal data. Some information may be outdated.');
        }
      }
    );
    unsubscribers.push(mealsUnsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, today, loading]);

  // Memoize daily progress calculations
  const dailyProgress = useMemo(() => ({
    calories: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      target: userData?.targets?.calories || 2000
    },
    protein: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
      target: userData?.targets?.protein || 140
    },
    carbs: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
      target: userData?.targets?.carbs || 250
    },
    fat: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
      target: userData?.targets?.fat || 70
    }
  }), [todaysMeals, userData]);

  const value = useMemo(() => ({
    userData,
    todaysMeals,
    dailyProgress,
    loading,
    error,
    isOffline
  }), [userData, todaysMeals, dailyProgress, loading, error, isOffline]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
} 