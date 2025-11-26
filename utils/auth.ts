import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";

/**
 * Create a new user account with email and password
 */
export const signUp = async (email: string, password: string) => {
  try {
    console.log('📝 [Auth] Sign up attempt for:', email);
    // Ensure auth is properly initialized
    if (!auth) {
      throw new Error("Firebase Auth is not initialized");
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ [Auth] Sign up successful:', userCredential.user.email);
    console.log('💾 [Auth] Session will be persisted to AsyncStorage');
    console.log('👤 [Auth] User UID:', userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Sign up error:", error);
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password should be at least 6 characters.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
    }
    return { user: null, error: errorMessage };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string) => {
  try {
    console.log('🔐 [Auth] Sign in attempt for:', email);
    // Ensure auth is properly initialized
    if (!auth) {
      throw new Error("Firebase Auth is not initialized");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ [Auth] Sign in successful:', userCredential.user.email);
    console.log('💾 [Auth] Session will be persisted to AsyncStorage');
    console.log('👤 [Auth] User UID:', userCredential.user.uid);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Sign in error:", error);
    // Provide more user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
    }
    return { user: null, error: errorMessage };
  }
};

/**
 * Sign out the current user and clear session
 */
export const logout = async () => {
  try {
    console.log('🚪 [Auth] Logout initiated');
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log('👤 [Auth] Logging out user:', currentUser.email);
    }
    
    await signOut(auth);
    console.log('✅ [Auth] Sign out successful');
    console.log('💾 [Auth] Session cleared from AsyncStorage');
    console.log('👤 [Auth] Current user after logout:', auth.currentUser ? 'still exists (error!)' : 'null (success)');
    
    return { error: null };
  } catch (error: any) {
    console.error('❌ [Auth] Logout error:', error);
    return { error: error.message };
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = (): User | null => {
  const user = auth.currentUser;
  console.log('👤 [Auth] getCurrentUser called, result:', user ? {
    email: user.email,
    uid: user.uid
  } : 'null');
  return user;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  console.log('🔔 [Auth] Setting up auth state listener');
  console.log('🔔 [Auth] Auth instance:', auth ? 'exists' : 'null');
  
  // Check if there's a persisted session
  const currentUser = auth.currentUser;
  if (currentUser) {
    console.log('💾 [Auth] Found persisted session for:', currentUser.email);
  } else {
    console.log('💾 [Auth] No persisted session found');
  }
  
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log('🔔 [Auth] onAuthStateChanged fired');
    if (user) {
      console.log('💾 [Auth] Session restored from AsyncStorage');
      console.log('👤 [Auth] User state:', {
        email: user.email,
        uid: user.uid,
        emailVerified: user.emailVerified
      });
    } else {
      console.log('💾 [Auth] No user session found in AsyncStorage');
      console.log('🔔 [Auth] User state: null');
    }
    callback(user);
  });
  
  return unsubscribe;
};

