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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc
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
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize Firestore with optimized settings
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      tabManager: persistentMultipleTabManager()
    })
  });

  // Verify database connection
  const verifyDbConnection = async () => {
    try {
      const testDoc = doc(db, '_connection_test_', 'test');
      await getDoc(testDoc);
      console.log('✅ Firebase Database connected successfully');
    } catch (error) {
      console.error('❌ Firebase Database connection failed:', error);
      if (error.code === 'permission-denied') {
        console.error('Please ensure you have created a Firestore database in your Firebase console');
      }
    }
  };

  verifyDbConnection();

} catch (error) {
  console.error('Firebase initialization error:', error);
}

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

// Get all foods for a user
export const getUserFoods = async (userId) => {
  try {
    const foodsRef = collection(db, 'users', userId, 'foods');
    const snapshot = await getDocs(foodsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
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

export { auth, db };
