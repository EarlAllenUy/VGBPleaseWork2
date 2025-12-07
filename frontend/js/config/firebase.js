// Firebase Client SDK Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
// Replace with YOUR actual config from Firebase Console
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLQ9lhm-_rxC5KUOgjZvKGiQk_ZpUSSLY",
  authDomain: "video-game-bulletin-bdae7.firebaseapp.com",
  databaseURL: "https://video-game-bulletin-bdae7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "video-game-bulletin-bdae7",
  storageBucket: "video-game-bulletin-bdae7.firebasestorage.app",
  messagingSenderId: "81198101400",
  appId: "1:81198101400:web:50d793c6dfd60ac71671ed",
  measurementId: "G-0EHZVHZZX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };