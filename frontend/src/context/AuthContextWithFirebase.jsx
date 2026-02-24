import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { firebaseAuth } from '../config/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false); // Toggle between JWT and Firebase

  useEffect(() => {
    // Check for existing JWT token
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Listen to Firebase auth state if enabled
    if (useFirebase) {
      const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Get Firebase ID token
          const idToken = await firebaseAuth.getIdToken();
          
          // Sync with backend
          try {
            const response = await api.post('/auth/firebase-login', { idToken });
            const { user: backendUser, token } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(backendUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(backendUser);
          } catch (error) {
            console.error('Firebase sync error:', error);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
    
    setLoading(false);
  }, [useFirebase]);

  // JWT Login (existing)
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    return user;
  };

  // Firebase Login
  const loginWithFirebase = async (email, password) => {
    const firebaseUser = await firebaseAuth.signIn(email, password);
    const idToken = await firebaseAuth.getIdToken();
    
    // Sync with backend
    const response = await api.post('/auth/firebase-login', { idToken });
    const { user: backendUser, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(backendUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(backendUser);
    return backendUser;
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    const firebaseUser = await firebaseAuth.signInWithGoogle();
    const idToken = await firebaseAuth.getIdToken();
    
    // Sync with backend
    const response = await api.post('/auth/firebase-login', { 
      idToken,
      isNewUser: true 
    });
    const { user: backendUser, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(backendUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(backendUser);
    return backendUser;
  };

  // JWT Register (existing)
  const register = async (username, email, password, role, department, employeeId, studentId, phone) => {
    const response = await api.post('/auth/register', { 
      username, 
      email, 
      password, 
      role,
      department,
      employee_id: employeeId,
      student_id: studentId,
      phone
    });
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(user);
    return user;
  };

  // Firebase Register
  const registerWithFirebase = async (email, password, additionalData) => {
    const firebaseUser = await firebaseAuth.signUp(email, password);
    const idToken = await firebaseAuth.getIdToken();
    
    // Create user in backend
    const response = await api.post('/auth/firebase-register', { 
      idToken,
      ...additionalData
    });
    const { user: backendUser, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(backendUser));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setUser(backendUser);
    return backendUser;
  };

  const logout = async () => {
    if (useFirebase) {
      await firebaseAuth.signOut();
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithFirebase,
      loginWithGoogle,
      register,
      registerWithFirebase,
      logout, 
      loading,
      useFirebase,
      setUseFirebase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
