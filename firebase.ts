
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2uoiu8xgEodAlOXmQGUe3gk4UJONlyY0",
  authDomain: "fiscalcontrol-v1.firebaseapp.com",
  projectId: "fiscalcontrol-v1",
  storageBucket: "fiscalcontrol-v1.firebasestorage.app",
  messagingSenderId: "590197371362",
  appId: "1:590197371362:web:5a5dfaa6045171108609bb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
