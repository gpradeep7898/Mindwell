// frontend/src/services/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics"; // Optional: if you want Analytics

// Your web app's Firebase configuration using environment variables
// IMPORTANT: Your .env variables MUST start with REACT_APP_
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  // measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID // Optional
};

// Validate that environment variables are loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error(
        "Firebase configuration error: Required environment variables (REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_PROJECT_ID) are missing." +
        " Make sure you have a .env file in the 'frontend' directory and have restarted the development server."
    );
    // Optionally throw an error or handle this state appropriately
    // throw new Error("Firebase environment variables missing.");
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Optional

// Export the initialized services
export { app, auth, db }; // Add 'analytics' here if you enabled it