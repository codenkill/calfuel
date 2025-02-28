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
  CACHE_SIZE_UNLIMITED
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
  updatedAt: new Date().toISOString()
};

// Initialize user data in Firestore
export const initializeUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...defaultUserData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
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

// Update macro targets
export const updateMacroTarget = async (userId, macro, target) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`targets.${macro}`]: Number(target),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating macro target:', error);
    return false;
  }
};

// Add food entry to user's food log
export const addFoodEntry = async (userId, foodEntry) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return false;
    }

    const newFoodEntry = {
      ...foodEntry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    await updateDoc(userRef, {
      foodLog: arrayUnion(newFoodEntry),
      updatedAt: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error adding food entry:', error);
    return false;
  }
};

export { auth, db };
