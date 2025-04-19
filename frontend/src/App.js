// frontend/src/App.js
import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    // useLocation // Keep commented unless implementing page transitions
} from "react-router-dom";
//import { LoadScript } from "@react-google-maps/api";
import { useAuthState } from "react-firebase-hooks/auth";
// import { AnimatePresence } from "framer-motion"; // Keep commented unless implementing

// Import Pages (Make sure all these exist or create them)
import Home from "./pages/Home";
import FindDoctor from "./pages/FindDoctor";
import ChatBot from "./pages/Chatbot"; // Ensure filename matches if ChatBot or Chatbot
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AnonymousLetters from "./pages/AnonymousLetters";
import QuickRelief from "./pages/QuickRelief";
import WellnessStore from "./pages/WellnessStore";

// Import Components (Make sure all these exist or create them)
import Sidebar from "./components/Sidebar";
import GlobalLoader from "./components/GlobalLoader";

// Import Services & Styles
import { auth as firebaseAuth } from "./services/firebaseConfig"; // Use specific name
import "./App.css"; // Main application styles

// Google Maps API Key - Ensure this is in your .env file prefixed with REACT_APP_
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// --- Protected Route Component ---
// Handles authentication check and loading state for protected areas
function ProtectedRoute({ children }) {
    const [user, loading, error] = useAuthState(firebaseAuth);

    if (loading) {
        // Show loader while checking auth status
        return <GlobalLoader message="Checking authentication..." />;
    }

    if (error) {
        // Handle potential auth state errors
        console.error("Firebase Auth State Error:", error);
        // You might want to show an error message component here
        return <GlobalLoader message="Error loading user data." />;
    }

    // If not loading and no user, redirect to Auth page
    if (!user) {
        // Redirect them to the /auth page
        // replace prop ensures the /auth route doesn't get added to history stack
        return <Navigate to="/auth" replace />;
    }

    // If user is authenticated, render the children (the protected page)
    return children;
}

// --- Main App Component ---
function App() {
    // Get user state (loading/error handled in ProtectedRoute)
    const [user, loading, authError] = useAuthState(firebaseAuth); // Capture authError here too
    // const location = useLocation(); // Keep commented unless needed

    // Show global loader only during the VERY initial auth check
    if (loading) {
         return <GlobalLoader message="Initializing..." />;
    }

    // Handle initial auth error more gracefully if needed
    if (authError && !user) {
        console.error("Initial Firebase Auth Hook Error:", authError);
        // Maybe render a generic error page or try to redirect to Auth
        // This might be redundant if ProtectedRoute handles it, but good for initial load check
        return (
            <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""}
            libraries={googleMapsLibraries} // <-- Use the const variable here
            loadingElement={<GlobalLoader message="Loading map services..." />}
            onError={(error) => console.error("Google Maps LoadScript Error:", error)}
        >
            <Router>
                <div className="app-container">
                    <main className="content-container">
                       <GlobalLoader message="Authentication error. Please try refreshing or logging in." />
                       {/* Optionally force redirect */}
                       {/* <Navigate to="/auth" replace /> */}
                    </main>
                </div>
            </Router>
            </LoadScript>
        )
    }

    // Validate Google Maps API Key
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Google Maps API Key Error: REACT_APP_GOOGLE_MAPS_API_KEY is missing in the .env file.");
         // Render an error message or a limited version of the app
         // For now, just log error and proceed, map features will fail
    }

    return (
        // Load Google Maps script - Places library is often useful
        <LoadScript
            googleMapsApiKey={GOOGLE_MAPS_API_KEY || ""} // Pass empty string if missing to avoid errors? Check LoadScript docs.
            libraries={["places"]}
            loadingElement={<GlobalLoader message="Loading map services..." />}
            onError={(error) => console.error("Google Maps LoadScript Error:", error)}
        >
            <Router>
                <div className="app-container">
                    {/* Render Sidebar only if user is logged in */}
                    {user && <Sidebar />}

                    {/* Main Content Area: Apply 'content-shifted' class only when user (and thus sidebar) exists */}
                    <main className={`content-container ${user ? 'content-shifted' : ''}`}>
                        {/* <AnimatePresence mode="wait"> */} {/* Keep commented */}
                            {/* key={location.pathname} */}
                            <Routes>
                                {/* Public Route: Auth Page */}
                                {/* If user is logged in, redirect from /auth to home */}
                                <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

                                {/* Protected Routes */}
                                <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/find-doctor" element={<ProtectedRoute><FindDoctor /></ProtectedRoute>} />
                                <Route path="/chatbot" element={<ProtectedRoute><ChatBot /></ProtectedRoute>} />
                                <Route path="/anonymous-letters" element={<ProtectedRoute><AnonymousLetters /></ProtectedRoute>} />
                                <Route path="/quick-relief" element={<ProtectedRoute><QuickRelief /></ProtectedRoute>} />
                                <Route path="/wellness-store" element={<ProtectedRoute><WellnessStore /></ProtectedRoute>} />

                                {/* Fallback Route: Redirects to Home if logged in, Auth otherwise */}
                                {/* Handles any undefined paths */}
                                <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
                            </Routes>
                        {/* </AnimatePresence> */}
                    </main>
                </div>
            </Router>
        </LoadScript>
    );
}

export default App;