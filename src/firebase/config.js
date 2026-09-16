// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBffq1ANXUapIjK-wG2yGFwg2-44e3A8Pc",
  authDomain: "hpair-deliv-6443a.firebaseapp.com",
  projectId: "hpair-deliv-6443a",
  storageBucket: "hpair-deliv-6443a.firebasestorage.app",
  messagingSenderId: "908480646127",
  appId: "1:908480646127:web:e8861bd5881b714a4d041a",
  measurementId: "G-5KKED2YT25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Firebase Storage holds uploaded resumes and portfolio files.
export const storage = getStorage(app);

export default app;
