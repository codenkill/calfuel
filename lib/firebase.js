// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
  orderBy,
  startAfter,
  limit,
  limitToLast,
  enableIndexedDbPersistence
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence only in client-side authenticated contexts
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
}

// Verify database connection only when needed
const verifyDbConnection = async () => {
  // Only verify if we have a logged-in user
  if (!auth.currentUser) return;

  try {
    // Try to access a test collection
    const testRef = collection(db, '_connection_test');
    await getDocs(query(testRef, limit(1)));
    return true;
  } catch (error) {
    console.error('Firebase connection error:', error);
    if (error.code === 'permission-denied') {
      console.error('Please check your Firestore security rules');
    } else if (error.code === 'failed-precondition') {
      console.error('Please ensure you have created a Firestore database in your Firebase console');
    }
    return false;
  }
};

// Initialize connection
verifyDbConnection().catch(console.error);

// Default user settings
const defaultUserData = {
  targets: {
    calories: 2000,
    protein: 140,
    carbs: 250,
    fat: 70
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
};

// Initialize user data in Firestore
export const initializeUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, defaultUserData);
    }

    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await initializeUserData(userId);
      return defaultUserData;
    }

    return userDoc.data();
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Update user targets
export const updateUserTargets = async (userId, targets) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      targets,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user targets:', error);
    return false;
  }
};

// Add new food
export const addFood = async (userId, foodData) => {
  try {
    const foodRef = collection(db, 'users', userId, 'foods');
    const timestamp = serverTimestamp();
    const newFood = {
      ...foodData,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const docRef = await addDoc(foodRef, newFood);

    // Return the food data with the ID and current Date instead of serverTimestamp
    return {
      id: docRef.id,
      ...foodData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error adding food:', error);
    return null;
  }
};

// Get paginated foods for a user
export const getPaginatedFoods = async (userId, lastDoc = null, limitCount = 10) => {
  try {
    const foodsRef = collection(db, 'users', userId, 'foods');
    let q;

    if (lastDoc) {
      q = query(
        foodsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        foodsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const foods = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamp to Date for consistent handling
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    return {
      foods,
      lastVisible,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Error getting paginated foods:', error);
    return { foods: [], lastVisible: null, hasMore: false };
  }
};

// Get all foods for a user (with cache optimization)
export const getUserFoods = async (userId) => {
  try {
    // First try to get from cache
    const foodsRef = collection(db, 'users', userId, 'foods');
    const q = query(
      foodsRef,
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamp to Date for consistent handling
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting foods:', error);
    return [];
  }
};

// Delete a food
export const deleteFood = async (userId, foodId) => {
  try {
    const foodRef = doc(db, 'users', userId, 'foods', foodId);
    await deleteDoc(foodRef);
    return true;
  } catch (error) {
    console.error('Error deleting food:', error);
    return false;
  }
};

// Add a meal that will recur daily
export const addMeal = async (userId, mealData) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    const mealRef = doc(db, 'users', userId, 'meals', date);
    const mealDoc = await getDoc(mealRef);

    const newMeal = {
      ...mealData,
      timestamp: new Date().toISOString(),
      isRecurring: true, // Mark the meal as recurring
      addedDate: date // Keep track of when the meal was first added
    };

    if (mealDoc.exists()) {
      const currentMeals = mealDoc.data().meals || [];
      await updateDoc(mealRef, {
        meals: [...currentMeals, newMeal],
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(mealRef, {
        meals: [newMeal],
        lastUpdated: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.error('Error adding meal:', error);
    return false;
  }
};

// Get all recurring meals
export const getAllMeals = async (userId) => {
  try {
    const mealsRef = collection(db, 'users', userId, 'meals');
    const snapshot = await getDocs(mealsRef);
    const meals = [];
    const today = new Date().toISOString().split('T')[0];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.meals && Array.isArray(data.meals)) {
        meals.push(...data.meals.map(meal => ({
          ...meal,
          date: doc.id,
          isToday: doc.id === today
        })));
      }
    });

    // Sort meals: Today's meals first, then by timestamp
    return meals.sort((a, b) => {
      if (a.isToday !== b.isToday) {
        return a.isToday ? -1 : 1;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  } catch (error) {
    console.error('Error getting meals:', error);
    return [];
  }
};

// Delete a meal
export const deleteMeal = async (userId, date, mealTimestamp) => {
  try {
    const mealRef = doc(db, 'users', userId, 'meals', date);
    const mealDoc = await getDoc(mealRef);

    if (mealDoc.exists()) {
      const currentMeals = mealDoc.data().meals || [];
      const updatedMeals = currentMeals.filter(meal => meal.timestamp !== mealTimestamp);

      if (updatedMeals.length === 0) {
        await deleteDoc(mealRef);
      } else {
        await updateDoc(mealRef, {
          meals: updatedMeals,
          lastUpdated: serverTimestamp()
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting meal:', error);
    return false;
  }
};

// Get meals for a specific date
export const getMealsForDate = async (userId, date) => {
  try {
    const mealRef = doc(db, 'users', userId, 'meals', date);
    const mealDoc = await getDoc(mealRef);

    if (mealDoc.exists()) {
      return mealDoc.data().meals || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting meals for date:', error);
    return [];
  }
};

// Update a meal
export const updateMeal = async (userId, date, mealTimestamp, updatedMealData) => {
  try {
    const mealRef = doc(db, 'users', userId, 'meals', date);
    const mealDoc = await getDoc(mealRef);

    if (mealDoc.exists()) {
      const currentMeals = mealDoc.data().meals || [];
      const updatedMeals = currentMeals.map(meal =>
        meal.timestamp === mealTimestamp
          ? { ...meal, ...updatedMealData, timestamp: mealTimestamp }
          : meal
      );

      await updateDoc(mealRef, {
        meals: updatedMeals,
        lastUpdated: serverTimestamp()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating meal:', error);
    return false;
  }
};

// Get paginated meals for a date range
export const getPaginatedMeals = async (userId, startDate, endDate, lastDoc = null, limitCount = 10) => {
  try {
    const mealsRef = collection(db, 'users', userId, 'meals');
    let q;

    if (lastDoc) {
      q = query(
        mealsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    } else {
      q = query(
        mealsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const meals = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.meals && Array.isArray(data.meals)) {
        meals.push(...data.meals.map(meal => ({
          ...meal,
          date: doc.id,
        })));
      }
    });

    return {
      meals,
      lastVisible,
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Error getting paginated meals:', error);
    return { meals: [], lastVisible: null, hasMore: false };
  }
};

// Add index creation helper
export const createRequiredIndexes = async () => {
  try {
    // Log index requirements
    console.info('Required indexes for optimal performance:');
    console.info('Collection: users/{userId}/foods');
    console.info('Fields to index: createdAt (DESC)');
    console.info('Collection: users/{userId}/meals');
    console.info('Fields to index: date (DESC)');

    // You can add actual index creation logic here if you have the required permissions
    return true;
  } catch (error) {
    console.error('Error creating indexes:', error);
    return false;
  }
};

// Check and update subscription status
export const checkSubscriptionStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('No user document found for subscription check');
      return null;
    }

    const userData = userDoc.data();
    console.log('Checking subscription status for user:', userData);

    // If user has a Stripe customer ID, they should be active
    if (userData.stripeCustomerId && userData.subscriptionStatus !== 'active') {
      console.log('User has Stripe customer ID, updating to active status');
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        updatedAt: new Date()
      });
      return { ...userData, subscriptionStatus: 'active' };
    }

    return userData;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return null;
  }
};

// Manually update subscription status
export const manuallyUpdateSubscriptionStatus = async (userId, status) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: status,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return false;
  }
};

export { auth, db };
