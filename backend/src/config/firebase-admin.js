import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import ENV from "../lib/env.js";

initializeApp({
  projectId: ENV.FIREBASE_PROJECT_ID,
});

const adminAuth = getAuth();

export default adminAuth;
