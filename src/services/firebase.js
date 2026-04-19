import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDNqwhBsCwjU-w7KPubAYWs2CRAE-yu-2s",
  authDomain: "faceattend-a19ef.firebaseapp.com",
  projectId: "faceattend-a19ef",
  storageBucket: "faceattend-a19ef.firebasestorage.app",
  messagingSenderId: "1030476624116",
  appId: "1:1030476624116:web:4210929fc209ca4b396ea1",
  measurementId: "G-J5MTPM8TBL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Sign in anonymously as soon as app loads — satisfies Firestore security rules
// without requiring users to create Firebase accounts
signInAnonymously(auth).catch(() => {});
