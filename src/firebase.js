import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase web configuration identifies the client project; never put service
// account credentials or other server secrets in this client-side file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAPSpj79Va-U_18tHbeoVN4Uy9_KY-omiI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'trip-plan-13743.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'trip-plan-13743',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'trip-plan-13743.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '441166486884',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:441166486884:web:b2c79ba5a2038ee46f6e71',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EVYHPJJDMV',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-northeast3');
