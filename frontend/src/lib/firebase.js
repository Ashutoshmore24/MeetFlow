import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDnfcEzbmIE894mwL5hq7VFmGunA_K9ej0",
  authDomain: "meetflow-b3822.firebaseapp.com",
  projectId: "meetflow-b3822",
  storageBucket: "meetflow-b3822.firebasestorage.app",
  messagingSenderId: "1026458551390",
  appId: "1:1026458551390:web:8b94ce06bfdd2bff18a0cf",
  measurementId: "G-18WH07C489",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
