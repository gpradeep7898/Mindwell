// frontend/src/firebaseConfig.js
// Initializes Firebase and exports necessary services

import { initializeApp, getApps, getApp } from "firebase/app"; // Import getApps and getApp for check
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Optional

// --- Your Firebase Project Configuration ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    // measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID // Optional
};

// --- Input Validation (Basic) ---
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
    console.error("**********************************************************************");
    console.error("CRITICAL Firebase Config Error: Missing essential configuration values.");
    console.error("Check REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_PROJECT_ID,");
    console.error("and REACT_APP_FIREBASE_AUTH_DOMAIN in your .env file.");
    console.error("**********************************************************************");
}

// Initialize Firebase App (prevent re-initialization)
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase App Initialized.");
} else {
    app = getApp(); // Get the already initialized app
    // console.log("Firebase App already initialized."); // Optional log
}

// --- Initialize and Export Firebase Services ---
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Optional

export { app, auth, db };