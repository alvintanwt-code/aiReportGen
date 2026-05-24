import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWLJwO1NsnIufRNqxxGPjs21qKIo4zyUE",
  authDomain: "aireportgen-9a757.firebaseapp.com",
  projectId: "aireportgen-9a757",
  storageBucket: "aireportgen-9a757.firebasestorage.app",
  messagingSenderId: "394567393510",
  appId: "1:394567393510:web:c6fde6cc014a8af5965b27",
  measurementId: "G-L8X5HLS0DP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
