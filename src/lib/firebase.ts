import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDIMnkG1GHl11KS9nSDZwkGjVKpDzuZmak",
    authDomain: "monopoluri-v3-eden.firebaseapp.com",
    projectId: "monopoluri-v3-eden",
    storageBucket: "monopoluri-v3-eden.firebasestorage.app",
    messagingSenderId: "64877475950",
    appId: "1:64877475950:web:1c9f0eecb903c6f2f38e7f"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
