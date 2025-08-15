// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB79b9uzVZL0xLzBZYszkJQl8USlPP0-9c",
  authDomain: "learning-app-8b876.firebaseapp.com",
  projectId: "learning-app-8b876",
  storageBucket: "learning-app-8b876.firebasestorage.app",
  messagingSenderId: "664149028776",
  appId: "1:664149028776:web:7cbfba342c76c98c42379d",
  measurementId: "G-LRC02KTK6G",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (optional)
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
