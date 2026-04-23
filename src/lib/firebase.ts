import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDIMnkG1GHl11KS9nSDZwkGjVKpDzuZmak",
    authDomain: "monopoluri-v3-eden.firebaseapp.com",
    projectId: "monopoluri-v3-eden",
    storageBucket: "monopoluri-v3-eden.firebasestorage.app",
    messagingSenderId: "64877475950",
    appId: "1:64877475950:web:1c9f0eecb903c6f2f38e7f"
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = isNewApp
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  : getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
