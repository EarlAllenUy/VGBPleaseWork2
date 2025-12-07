// Authentication Service
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from '../config/firebase.js';
import { authAPI } from './api.js';
import { redirectBasedOnRole } from './utils/helpers.js';

// Current user state
let currentUser = null;
let currentUserData = null;

// Initialize auth state listener
export const initAuth = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        console.log('✅ User authenticated:', user.uid);
        
        // Get ID token and store
        const token = await user.getIdToken();
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user.uid);
        
        // Get user data from backend
        try {
          currentUserData = await authAPI.getUser(user.uid);
          localStorage.setItem('userRole', currentUserData.administrator ? 'admin' : 'user');
          console.log('✅ User data loaded:', currentUserData);
        } catch (error) {
          console.error('❌ Failed to get user data:', error);
          // Don't fail auth if we can't get user data
          localStorage.setItem('userRole', 'user');
        }
      } else {
        currentUser = null;
        currentUserData = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.setItem('userRole', 'guest');
        console.log('👤 User is guest');
      }
      resolve(user);
    });
  });
};

// Register new user
export const register = async (email, password, username, isAdmin = false) => {
  try {
    console.log('📝 Registering user:', email);
    
    // Step 1: Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase Auth user created:', user.uid);
    
    // Step 2: Get ID token
    const token = await user.getIdToken();
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', user.uid);
    
    // Step 3: Create user in backend database (this will use the same UID)
    try {
      const response = await authAPI.register({
        email,
        password,
        username,
        isAdmin
      });
      console.log('✅ User registered in backend:', response);
    } catch (backendError) {
      console.error('⚠️ Backend registration warning:', backendError);
      // Continue anyway - user exists in Firebase Auth
    }
    
    // Step 4: Set user role
    localStorage.setItem('userRole', isAdmin ? 'admin' : 'user');
    
    return { success: true, userId: user.uid, username };
  } catch (error) {
    console.error('❌ Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Login user
export const login = async (email, password) => {
  try {
    console.log('🔐 Logging in:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ User logged in:', user.uid);
    
    // Get and store token
    const token = await user.getIdToken();
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', user.uid);
    
    // Get user data from backend
    try {
      currentUserData = await authAPI.getUser(user.uid);
      localStorage.setItem('userRole', currentUserData.administrator ? 'admin' : 'user');
      console.log('✅ User data loaded:', currentUserData);
      
      return { success: true, userId: user.uid, userData: currentUserData };
    } catch (error) {
      console.error('⚠️ Could not load user data:', error);
      // User can still login, just without backend data
      localStorage.setItem('userRole', 'user');
      return { success: true, userId: user.uid, userData: null };
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return { success: false, error: error.message };
  }
};

// Logout user
export const logout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.setItem('userRole', 'guest');
    currentUser = null;
    currentUserData = null;
    console.log('👋 User logged out');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => currentUser;

// Get current user data
export const getCurrentUserData = () => currentUserData;

// Check if user is authenticated
export const isAuthenticated = () => !!currentUser;

// Check if user is admin
export const isAdmin = () => {
  return currentUserData?.administrator === true;
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem('userRole') || 'guest';
};

// Redirect based on role
export const redirectBasedOnRole = (page = 'index') => {
  const role = getUserRole();
  const pageMap = {
    index: { guest: 'index.html', user: 'user_index.html', admin: 'admin_index.html' },
    calendar: { guest: 'calendar.html', user: 'user_calendar.html', admin: 'admin_calendar.html' },
    reviews: { guest: 'reviews.html', user: 'user_reviews.html', admin: 'admin_reviews.html' }
  };
  
  const targetPage = pageMap[page]?.[role] || 'index.html';
  window.location.href = targetPage;
};

// After successful login
export const handleLoginSuccess = (result) => {
  if (result.success) {
    showMessage('Login successful! Welcome back.');
    // ADD THIS LINE → redirect based on role
    redirectBasedOnRole('index');
  }
};

// After successful register
export const handleRegisterSuccess = (result) => {
  if (result.success) {
    showMessage(`Welcome ${result.username}! Account created.`);
    // ADD THIS LINE
    redirectBasedOnRole('index');
  }
};
