// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics } from "firebase/analytics";
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { Database, getDatabase } from "firebase/database";

// Dynamically import getReactNativePersistence - it might be available at runtime
let getReactNativePersistence: any;
try {
  // Try multiple ways to access getReactNativePersistence
  const firebaseAuth = require('firebase/auth');
  getReactNativePersistence = firebaseAuth.getReactNativePersistence;
  
  // If not found, try @firebase/auth
  if (!getReactNativePersistence) {
    try {
      const firebaseAuthCore = require('@firebase/auth');
      getReactNativePersistence = firebaseAuthCore.getReactNativePersistence;
    } catch (e2) {
      // Not found
    }
  }
  
  console.log('🔍 [Firebase] getReactNativePersistence available:', typeof getReactNativePersistence === 'function');
} catch (e) {
  console.log('⚠️ [Firebase] Could not find getReactNativePersistence');
  getReactNativePersistence = null;
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKh8xESZCOE2jDBCUvOcq6DcxPhKBd-ak",
  authDomain: "sportsaddict-2f874.firebaseapp.com",
  projectId: "sportsaddict-2f874",
  storageBucket: "sportsaddict-2f874.firebasestorage.app",
  messagingSenderId: "726517767562",
  appId: "1:726517767562:web:9141cbb5fef5e487413c73",
  measurementId: "G-58E7FX3ZZ3"
};

// Initialize Firebase - check if already initialized to avoid duplicate initialization
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 [Firebase] App initialized');
} else {
  app = getApps()[0];
  console.log('🔥 [Firebase] Using existing app');
}

// Initialize Firebase Authentication with AsyncStorage persistence for React Native
let auth: Auth;
try {
  // For React Native/Expo, we need to use initializeAuth
  // Check if we're in a React Native/Expo environment (not web)
  const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';
  
  if (!isWeb) {
    // React Native/Expo environment - use initializeAuth with AsyncStorage
    console.log('💾 [Firebase] Initializing Auth for React Native/Expo with AsyncStorage...');
    try {
      // Use getReactNativePersistence if available
      if (getReactNativePersistence && typeof getReactNativePersistence === 'function') {
        console.log('✅ [Firebase] Using getReactNativePersistence');
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } else {
        // Fallback: Try initializeAuth without explicit persistence
        // Firebase should handle it automatically in React Native
        console.log('⚠️ [Firebase] getReactNativePersistence not found, using initializeAuth without explicit persistence');
        console.log('💡 [Firebase] Note: This may result in memory-only persistence');
        auth = initializeAuth(app);
      }
      console.log('✅ [Firebase] Auth initialized with AsyncStorage persistence');
    } catch (initError: any) {
      // If already initialized, get the existing instance
      if (initError.code === 'auth/already-initialized' || initError.message?.includes('already-initialized')) {
        console.log('✅ [Firebase] Auth already initialized, getting existing instance');
        auth = getAuth(app);
      } else {
        console.log('⚠️ [Firebase] initializeAuth failed, falling back to getAuth:', initError.message);
        auth = getAuth(app);
      }
    }
  } else {
    // Web environment - use regular getAuth
    console.log('🌐 [Firebase] Initializing Auth for web...');
    auth = getAuth(app);
    console.log('✅ [Firebase] Auth initialized for web');
  }
} catch (error) {
  console.error('❌ [Firebase] Error initializing Auth:', error);
  // Fallback to getAuth if all else fails
  auth = getAuth(app);
  console.log('⚠️ [Firebase] Using fallback getAuth');
}

// Verify auth is properly initialized
if (!auth) {
  console.error('Firebase Auth failed to initialize');
} else {
  console.log('Firebase Auth is ready');
}

export { auth };

// Initialize Analytics (only for web)
let analytics: ReturnType<typeof getAnalytics> | undefined;
try {
  // Only initialize analytics on web platform
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  // Analytics initialization failed (likely on native platform)
  console.log('Analytics not available on this platform');
}

// Initialize Realtime Database
let database: Database;
try {
  database = getDatabase(app);
  console.log('✅ [Firebase] Realtime Database initialized');
} catch (error) {
  console.error('❌ [Firebase] Error initializing Realtime Database:', error);
  throw error;
}

export { analytics, app, database };

