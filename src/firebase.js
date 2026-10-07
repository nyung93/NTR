// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPSpj79Va-U_18tHbeoVN4Uy9_KY-omiI",
  authDomain: "trip-plan-13743.firebaseapp.com",
  projectId: "trip-plan-13743",
  storageBucket: "trip-plan-13743.firebasestorage.app",
  messagingSenderId: "441166486884",
  appId: "1:441166486884:web:b2c79ba5a2038ee46f6e71",
  measurementId: "G-EVYHPJJDMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Firestore 데이터베이스 내보내기 (다른 파일에서 쓸 수 있게 함)
export const db = getFirestore(app);
import { getFirestore } from "firebase/firestore";
