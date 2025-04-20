// frontend/src/App.js
import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate,
    // useLocation // Keep commented unless implementing page transitions
} from "react-router-dom";
// Removed LoadScript import
import { useAuthState } from "react-firebase-hooks/auth";
// import { AnimatePresence } from "framer-motion"; // Keep commented unless implementing

// Import Pages (Ensure all these files exist in ./pages/)
import Home from "./pages/Home";
import FindDoctor from "./pages/FindDoctor";
import ChatBot from "./pages/Chatbot"; // Check filename: ChatBot vs Chatbot
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AnonymousLetters from "./pages/AnonymousLetters";
import QuickRelief from "./pages/QuickRelief";
import WellnessStore from "./pages/WellnessStore";

// Import Components (Ensure all these files exist in ./components/)
import Sidebar from "./components/Sidebar";
import GlobalLoader from "./components/GlobalLoader";

// Import Services & Styles
import { auth as firebaseAuth } from "./services/firebaseConfig"; // Use specific name
import "./App.css"; // Main application styles

// Removed GOOGLE_MAPS_API_KEY definition

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
        // Render a generic error message within the main layout structure
        return (
             <div className="app-container">
                 <main className="content-container">
                     <GlobalLoader message="Error loading user data. Please try refreshing." />
                 </main>
            </div>
        );
    }

    // If not loading and no user, redirect to Auth page
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // If user is authenticated, render the children (the protected page)
    return children;
}

// --- Main App Component ---
function App() {
    const [user, loading, authError] = useAuthState(firebaseAuth);
    // const location = useLocation(); // Keep commented unless needed

    // Show global loader only during the VERY initial auth check
    if (loading) {
         return <GlobalLoader message="Initializing..." />;
    }

    // Handle initial auth error if user state couldn't be determined
    if (authError && !user && !loading) { // Check loading is false too
        console.error("Initial Firebase Auth Hook Error:", authError);
        // Render a simple error state - user will likely be redirected by ProtectedRoute anyway
        // if they try accessing protected routes, but this handles the initial screen better.
        return (
            <Router>
                <div className="app-container">
                    <main className="content-container">
                       <GlobalLoader message="Authentication error. Please try refreshing or logging in." />
                       {/* Optional: Add a button to go to login */}
                       {/* <button onClick={() => window.location.href = '/auth'}>Go to Login</button> */}
                    </main>
                </div>
            </Router>
        );
    }

    // Removed Google Maps API Key validation check

    return (
        // No LoadScript wrapper needed
        <Router>
            <div className="app-container">
                {/* Render Sidebar only if user is logged in */}
                {user && <Sidebar />}

                {/* Main Content Area: Apply 'content-shifted' class only when user exists */}
                <main className={`content-container ${user ? 'content-shifted' : ''}`}>
                    {/* <AnimatePresence mode="wait"> */} {/* Keep commented */}
                        {/* key={location.pathname} */}
                        <Routes>
                            {/* Public Route: Auth Page */}
                            {/* If user is logged in, trying to access /auth redirects to home */}
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
                            <Route path="*" element={<Navigate to={user ? "/" : "/auth"} replace />} />
                        </Routes>
                    {/* </AnimatePresence> */}
                </main>
            </div>
        </Router>
    );
}

export default App;