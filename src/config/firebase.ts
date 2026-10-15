import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase Web project configuration from Firebase Console:
// https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: "AIzaSyANImBKQMmOVL0Q68TLcJPF7ALTDnXhjo0",
  authDomain: "my-montly-budget-app-3e713.firebaseapp.com",
  projectId: "my-montly-budget-app-3e713",
  storageBucket: "my-montly-budget-app-3e713.firebasestorage.app",
  messagingSenderId: "862202980196",
  appId: "1:862202980196:web:0075f2dbdd6586752f7c71",
  measurementId: "G-6R836JC9Z1"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default app;
