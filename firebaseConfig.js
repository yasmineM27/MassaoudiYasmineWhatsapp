// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
// TODO: Remplacez ces valeurs par vos propres credentials Firebase
// Allez sur https://console.firebase.google.com/
// 1. Créez un nouveau projet ou sélectionnez un projet existant
// 2. Allez dans Project Settings (icône d'engrenage)
// 3. Faites défiler jusqu'à "Your apps" et cliquez sur l'icône Web (</>)
// 4. Copiez la configuration firebaseConfig

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
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Realtime Database and get a reference to the service
export const realtimeDb = getDatabase(app);

export default app;

