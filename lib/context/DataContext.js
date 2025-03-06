"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { 
  getUserFoods, 
  getMealsForDate, 
  updateUserTargets,
  addFood,
  addMeal,
  getUserData,
  deleteFood,
  getAllMeals,
  updateMeal,
  deleteMeal,
  getPaginatedFoods,
  getPaginatedMeals
} from '../firebase';
import { 
  collection, 
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  enableIndexedDbPersistence,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

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

// Create context
const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [foods, setFoods] = useState([]);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [mealHistory, setMealHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  
  // Pagination states
  const [lastFoodDoc, setLastFoodDoc] = useState(null);
  const [hasMoreFoods, setHasMoreFoods] = useState(true);
  const [lastMealDoc, setLastMealDoc] = useState(null);
  const [hasMoreMeals, setHasMoreMeals] = useState(true);

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
    return date.toISOString().split('T')[0];
  }, []);

  // Load initial foods
  const loadInitialFoods = async () => {
    if (!user) return;
    try {
      const result = await getPaginatedFoods(user.uid);
      setFoods(result.foods);
      setLastFoodDoc(result.lastVisible);
      setHasMoreFoods(result.hasMore);
    } catch (error) {
      console.error('Error loading foods:', error);
      setError('Failed to load foods');
    }
  };

  // Load more foods
  const loadMoreFoods = async () => {
    if (!user || !hasMoreFoods || !lastFoodDoc) return;
    try {
      const result = await getPaginatedFoods(user.uid, lastFoodDoc);
      setFoods(prev => [...prev, ...result.foods]);
      setLastFoodDoc(result.lastVisible);
      setHasMoreFoods(result.hasMore);
    } catch (error) {
      console.error('Error loading more foods:', error);
      setError('Failed to load more foods');
    }
  };

  // Load meals for date range
  const loadMealsForRange = async (startDate, endDate) => {
    if (!user) return;
    try {
      const result = await getPaginatedMeals(user.uid, startDate, endDate);
      setTodaysMeals(result.meals);
      setLastMealDoc(result.lastVisible);
      setHasMoreMeals(result.hasMore);
    } catch (error) {
      console.error('Error loading meals:', error);
      setError('Failed to load meals');
    }
  };

  // Load more meals
  const loadMoreMeals = async (startDate, endDate) => {
    if (!user || !hasMoreMeals || !lastMealDoc) return;
    try {
      const result = await getPaginatedMeals(user.uid, startDate, endDate, lastMealDoc);
      setTodaysMeals(prev => [...prev, ...result.meals]);
      setLastMealDoc(result.lastVisible);
      setHasMoreMeals(result.hasMore);
    } catch (error) {
      console.error('Error loading more meals:', error);
      setError('Failed to load more meals');
    }
  };

  // Reset pagination
  const resetPagination = () => {
    setLastFoodDoc(null);
    setHasMoreFoods(true);
    setLastMealDoc(null);
    setHasMoreMeals(true);
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        loadInitialFoods(),
        loadMealsForRange(
          new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        )
      ])
      .finally(() => setLoading(false));
    } else {
      setFoods([]);
      setTodaysMeals([]);
      resetPagination();
    }
  }, [user]);

  // Set up real-time listeners when user is authenticated
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setTodaysMeals([]);
      setMealHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load initial user data and meal history
    Promise.all([
      getUserData(user.uid),
      getAllMeals(user.uid)
    ])
      .then(([data, meals]) => {
        setUserData(data);
        // Mark meals that are in today's meals as isToday: true
        const today = new Date().toISOString().split('T')[0];
        const mealsRef = doc(db, 'users', user.uid, 'meals', today);
        return getDoc(mealsRef).then(todayDoc => {
          const todayMeals = todayDoc.exists() ? todayDoc.data().meals || [] : [];
          const todayMealTimestamps = new Set(todayMeals.map(m => m.timestamp));
          
          const updatedMeals = meals.map(meal => ({
            ...meal,
            isToday: todayMealTimestamps.has(meal.timestamp)
          }));
          
          setMealHistory(updatedMeals);
          setTodaysMeals(todayMeals);
        });
      })
      .catch(err => {
        console.error('Error loading user data:', err);
        setError('Failed to load user data');
      })
      .finally(() => setLoading(false));

    // Set up real-time listener for foods
    const foodsRef = collection(db, 'users', user.uid, 'foods');
    const foodsQuery = query(foodsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeFoods = onSnapshot(foodsQuery, 
      (snapshot) => {
        const foodsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFoods(foodsList);
      },
      (err) => {
        console.error('Error in foods listener:', err);
        setError('Failed to load foods');
      }
    );

    // Set up real-time listener for today's meals
    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const todayMealsQuery = query(mealsRef);
    
    const unsubscribeMeals = onSnapshot(todayMealsQuery,
      (snapshot) => {
        const today = new Date().toISOString().split('T')[0];
        const todayDoc = snapshot.docs.find(doc => doc.id === today);
        const todayMealsList = todayDoc ? todayDoc.data().meals || [] : [];
        
        setTodaysMeals(todayMealsList);
        
        // Update isToday status in meal history
        const todayMealTimestamps = new Set(todayMealsList.map(m => m.timestamp));
        setMealHistory(prevHistory => 
          prevHistory.map(meal => ({
            ...meal,
            isToday: todayMealTimestamps.has(meal.timestamp)
          }))
        );
      },
      (err) => {
        console.error('Error in meals listener:', err);
        setError('Failed to load meals');
      }
    );

    // Cleanup listeners on unmount
    return () => {
      unsubscribeFoods();
      unsubscribeMeals();
    };
  }, [user]);

  // Update user targets
  const updateTargets = async (newTargets) => {
    if (!user) return;
    try {
      setError(null);
      await updateUserTargets(user.uid, newTargets);
      setUserData(prev => ({
        ...prev,
        targets: newTargets
      }));
    } catch (error) {
      setError('Failed to update targets. Please try again.');
    }
  };

  // Add new food
  const addNewFood = async (foodData) => {
    if (!user) return null;
    try {
      setError(null);
      const newFood = await addFood(user.uid, foodData);
      if (newFood) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding food:', error);
      setError('Failed to add food. Please try again.');
      return false;
    }
  };

  // Delete food
  const deleteFoodItem = async (foodId) => {
    if (!user) return false;
    try {
      setError(null);
      const success = await deleteFood(user.uid, foodId);
      return success;
    } catch (error) {
      console.error('Error deleting food:', error);
      setError('Failed to delete food. Please try again.');
      return false;
    }
  };

  // Add new meal
  const addNewMeal = async (mealData) => {
    if (!user) return false;
    try {
      setError(null);
      const success = await addMeal(user.uid, mealData);
      if (success) {
        // Refresh both today's meals and meal history
        const [updatedMeals, updatedHistory] = await Promise.all([
          getMealsForDate(user.uid, today),
          getAllMeals(user.uid)
        ]);
        setTodaysMeals(updatedMeals);
        setMealHistory(updatedHistory);
      }
      return success;
    } catch (error) {
      setError('Failed to add meal. Please try again.');
      return false;
    }
  };

  // Update existing meal
  const updateExistingMeal = async (date, mealData, originalTimestamp) => {
    if (!user) return false;
    try {
      setError(null);
      const success = await updateMeal(user.uid, date, mealData, originalTimestamp);
      if (success) {
        // Refresh meal history
        const updatedMeals = await getAllMeals(user.uid);
        setMealHistory(updatedMeals);
      }
      return success;
    } catch (error) {
      setError('Failed to update meal. Please try again.');
      return false;
    }
  };

  const deleteMealItem = async (date, mealTimestamp) => {
    if (!user) return false;
    setError(null);
    setLoading(true);
    
    try {
      const success = await deleteMeal(user.uid, date, mealTimestamp);
      if (success) {
        // Refresh meal history after successful deletion
        const updatedHistory = await getAllMeals(user.uid);
        setMealHistory(updatedHistory);
        return true;
      }
      setError('Failed to delete meal');
      return false;
    } catch (err) {
      console.error('Error deleting meal:', err);
      setError('Error deleting meal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeMealFromToday = async (timestamp) => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const mealRef = doc(db, 'users', user.uid, 'meals', today);
      
      // Get the current meals for today
      const mealDoc = await getDoc(mealRef);
      if (!mealDoc.exists()) return false;

      const meals = mealDoc.data().meals || [];
      
      // Filter out the meal with the matching timestamp from today's meals
      const updatedMeals = meals.filter(meal => meal.timestamp !== timestamp);
      
      // Update today's meals document
      await setDoc(mealRef, { meals: updatedMeals }, { merge: true });

      // Update local states
      setTodaysMeals(prevMeals => prevMeals.filter(meal => meal.timestamp !== timestamp));
      
      // Update meal history to reflect that this meal is no longer marked for today
      setMealHistory(prevHistory => 
        prevHistory.map(meal => 
          meal.timestamp === timestamp 
            ? { ...meal, isToday: false }
            : meal
        )
      );

      return true;
    } catch (error) {
      console.error('Error removing meal from today:', error);
      return false;
    }
  };

  const value = {
    userData,
    foods,
    todaysMeals,
    mealHistory,
    loading,
    error,
    isOffline,
    hasMoreFoods,
    hasMoreMeals,
    loadMoreFoods,
    loadMoreMeals,
    loadMealsForRange,
    resetPagination,
    updateTargets,
    addNewFood,
    addNewMeal,
    deleteFoodItem,
    updateExistingMeal,
    deleteMealItem,
    removeMealFromToday
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}; 