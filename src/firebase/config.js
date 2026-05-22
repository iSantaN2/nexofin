import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAFjJxKx5Zfn7Or3JbpxBR3GvUl6MTIsIs",
  authDomain: "finapp-1eead.firebaseapp.com",
  projectId: "finapp-1eead",
  storageBucket: "finapp-1eead.firebasestorage.app",
  messagingSenderId: "968895224337",
  appId: "1:968895224337:web:638ffb68f52fcfc7346fb0",
  measurementId: "G-Q1ZQLZ48B1",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) getAnalytics(app);
    })
    .catch((err) => {
      console.warn("Analytics no esta disponible:", err.message);
    });
}

export default app;
