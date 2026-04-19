import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAymvDBKn8ERya2qXxQZ-4zjo_NAxCOigk",
  authDomain: "smartaid-f2eee.firebaseapp.com",
  projectId: "smartaid-f2eee",
  storageBucket: "smartaid-f2eee.firebasestorage.app",
  messagingSenderId: "662663140938",
  appId: "1:662663140938:web:8154734af595fc6ae6f8b3",
  measurementId: "G-RRLQVC5CKV"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

getAnalytics(app);
getAuth(app);