// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAhNSDx0sTqk6-dG-aJ6oJpNVzTvHdlo6E",
  authDomain: "whatsappyass.firebaseapp.com",
  databaseURL: "https://whatsappyass-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whatsappyass",
  storageBucket: "whatsappyass.firebasestorage.app",
  messagingSenderId: "867446369148",
  appId: "1:867446369148:web:10a8d342ad1cb0b58cd2f9",
  measurementId: "G-451VVBH7T6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
// This ensures auth state persists between app sessions
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Realtime Database and get a reference to the service
export const realtimeDb = getDatabase(app);

export default app;

