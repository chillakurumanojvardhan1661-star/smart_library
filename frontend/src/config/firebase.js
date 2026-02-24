import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Firebase configuration
// Replace these with your actual Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
let app;
let auth;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.warn('⚠️  Firebase not configured:', error.message);
}

// Auth functions
export const firebaseAuth = {
  // Sign in with email and password
  signIn: async (email, password) => {
    if (!auth) throw new Error('Firebase not initialized');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign up with email and password
  signUp: async (email, password) => {
    if (!auth) throw new Error('Firebase not initialized');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    if (!auth || !googleProvider) throw new Error('Firebase not initialized');
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  // Sign out
  signOut: async () => {
    if (!auth) throw new Error('Firebase not initialized');
    await signOut(auth);
  },

  // Get current user
  getCurrentUser: () => {
    if (!auth) return null;
    return auth.currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  },

  // Get ID token
  getIdToken: async () => {
    if (!auth || !auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }
};

export { auth, googleProvider };
export default app;
