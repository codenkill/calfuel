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
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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
      
      // Update foods while preserving uniqueness
      setFoods(prevFoods => {
        const existingIds = new Set(prevFoods.map(f => f.id));
        const uniqueNewFoods = result.foods.filter(food => !existingIds.has(food.id));
        
        // Monitor for potential duplicate attempts
        const duplicateCount = result.foods.length - uniqueNewFoods.length;
        if (duplicateCount > 0) {
          console.warn(`Prevented ${duplicateCount} duplicate food items from being created`);
        }
        
        return [...prevFoods, ...uniqueNewFoods];
      });
      
      setLastFoodDoc(result.lastVisible);
      setHasMoreFoods(result.hasMore && result.foods.length > 0);
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
      
      // Create a Set of existing meal IDs
      const existingIds = new Set(todaysMeals.map(meal => meal.id));
      
      // Filter out any duplicates from the new meals and ensure all meals have IDs
      const uniqueNewMeals = result.meals
        .filter(meal => meal.id && !existingIds.has(meal.id))
        .map(meal => ({
          ...meal,
          id: meal.id || doc(collection(db, 'users', user.uid, 'meals')).id
        }));
      
      if (uniqueNewMeals.length > 0) {
        setTodaysMeals(prev => [...prev, ...uniqueNewMeals]);
      }
      
      setLastMealDoc(result.lastVisible);
      setHasMoreMeals(result.hasMore && uniqueNewMeals.length > 0);
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
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      
      Promise.all([
        loadInitialFoods(),
        loadMealsForRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      ])
      .finally(() => setLoading(false));
    } else {
      setFoods([]);
      setTodaysMeals([]);
      resetPagination();
    }
  }, [user]);

  // Utility function to ensure unique IDs
  const ensureUniqueIds = (items, prefix = '') => {
    const seenIds = new Set();
    return items.map(item => {
      let id = item.id;
      // If no ID or duplicate ID, generate a new one
      if (!id || seenIds.has(id)) {
        id = `${prefix}_${uuidv4()}`;
      }
      seenIds.add(id);
      return { ...item, id };
    });
  };

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
          const todayMealIds = new Set(todayMeals.map(m => m.id));
          
          const updatedMeals = meals.map(meal => ({
            ...meal,
            id: meal.id || uuidv4(), // Ensure all meals have an ID
            isToday: todayMealIds.has(meal.id)
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
    const foodsQuery = query(
      foodsRef, 
      orderBy('createdAt', 'desc'), 
      // Strict limit to prevent excessive data loading
      limit(50)
    );
    
    const unsubscribeFoods = onSnapshot(foodsQuery, 
      (snapshot) => {
        const foodsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        // Update foods while preserving uniqueness by ID
        setFoods(prevFoods => {
          const existingIds = new Set(prevFoods.map(f => f.id));
          const newFoods = foodsList.filter(food => !existingIds.has(food.id));
          
          // Monitor for potential duplicate attempts
          const duplicateCount = foodsList.length - newFoods.length;
          if (duplicateCount > 0) {
            console.warn(`Prevented ${duplicateCount} duplicate food items from being added via real-time update`);
          }
          
          // Ensure we're not accumulating more items than necessary
          const combinedFoods = [...prevFoods, ...newFoods];
          if (combinedFoods.length > 100) {
            console.warn('Foods list exceeding recommended size, trimming to prevent memory issues');
            return combinedFoods.slice(0, 100);
          }
          
          return combinedFoods;
        });
      },
      (err) => {
        console.error('Error in foods listener:', err);
        setError('Failed to load foods');
      }
    );

    // Set up real-time listener for today's meals
    const mealsRef = collection(db, 'users', user.uid, 'meals');
    const todayMealsQuery = query(
      mealsRef,
      where('lastUpdated', '>=', new Date(new Date().setHours(0, 0, 0, 0)))
    );
    
    const unsubscribeMeals = onSnapshot(todayMealsQuery,
      (snapshot) => {
        const today = new Date().toISOString().split('T')[0];
        const todayDoc = snapshot.docs.find(doc => doc.id === today);
        const todayMealsList = todayDoc ? todayDoc.data().meals || [] : [];
        
        // Ensure unique IDs for today's meals
        const uniqueTodayMeals = ensureUniqueIds(todayMealsList, 'today');
        setTodaysMeals(uniqueTodayMeals);
        
        // Update isToday status in meal history with unique IDs
        const todayMealIds = new Set(uniqueTodayMeals.map(m => m.id));
        setMealHistory(prevHistory => {
          const updatedHistory = ensureUniqueIds(prevHistory, 'history');
          return updatedHistory.map(meal => ({
            ...meal,
            isToday: todayMealIds.has(meal.id)
          }));
        });
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
      // Add a unique ID to the meal data
      const mealWithId = {
        ...mealData,
        id: `meal_${uuidv4()}`, // Add a prefixed unique ID
        timestamp: mealData.timestamp || Date.now()
      };
      const success = await addMeal(user.uid, mealWithId);
      if (success) {
        // Refresh both today's meals and meal history
        const [updatedMeals, updatedHistory] = await Promise.all([
          getMealsForDate(user.uid, today),
          getAllMeals(user.uid)
        ]);
        // Ensure unique IDs before updating state
        setTodaysMeals(ensureUniqueIds(updatedMeals, 'meal'));
        setMealHistory(ensureUniqueIds(updatedHistory, 'history'));
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

  const removeMealFromToday = async (mealId) => {
    if (!user) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const mealRef = doc(db, 'users', user.uid, 'meals', today);
      
      // Get the current meals for today
      const mealDoc = await getDoc(mealRef);
      if (!mealDoc.exists()) return false;

      const meals = mealDoc.data().meals || [];
      
      // Filter out the meal with the matching ID from today's meals
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      
      // Update today's meals document
      await setDoc(mealRef, { meals: updatedMeals }, { merge: true });

      // Update local states
      setTodaysMeals(prevMeals => prevMeals.filter(meal => meal.id !== mealId));
      
      // Update meal history to reflect that this meal is no longer marked for today
      setMealHistory(prevHistory => 
        prevHistory.map(meal => 
          meal.id === mealId 
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