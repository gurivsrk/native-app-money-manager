import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase Web project configuration from Firebase Console:
// https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDev-ChangeInProduction",
  authDomain: "monthly-budget-app.firebaseapp.com",
  projectId: "monthly-budget-app",
  storageBucket: "monthly-budget-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export default app;
