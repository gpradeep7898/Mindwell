// frontend/src/App.js
import React from "react";
import {
    BrowserRouter as Router,
    Route,
    Routes,
    Navigate
} from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";

// Import Pages
import Home from "./pages/Home";
import FindDoctor from "./pages/FindDoctor";
import ChatBot from "./pages/Chatbot"; // Check filename consistency if needed
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AnonymousLetters from "./pages/AnonymousLetters";
import QuickRelief from "./pages/QuickRelief";
import WellnessStore from "./pages/WellnessStore";

// Import Components
import Sidebar from "./components/Sidebar";
import GlobalLoader from "./components/GlobalLoader";

// Import Services & Styles
import { auth as firebaseAuth } from "./services/firebaseConfig";
import "./App.css";

// --- Modified Protected Route Component ---
// Accepts auth status as props instead of using the hook internally
function ProtectedRoute({ children, isAuthenticated, isLoading }) {

    // Show loader based on the App component's INITIAL loading state passed down
    // We rely on App component to handle the initial load screen
    // This check here might be redundant if App already shows loader,
    // but can serve as a fallback. Consider if needed.
    // if (isLoading) {
    //     return <GlobalLoader message="Initializing..." />;
    // }

    // If initial loading is done and user is NOT authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
        // console.log("ProtectedRoute: Not authenticated, navigating to /auth"); // Debug log
        return <Navigate to="/auth" replace />;
    }

    // If initial loading is done and user IS authenticated, render the protected content
    if (!isLoading && isAuthenticated) {
        return children;
    }

    // Return null or a loader while waiting for initial App loading state determination
    // If the parent App handles the main initial load, this might not be strictly necessary,
    // but returning null prevents rendering children prematurely.
    return <GlobalLoader message="Checking authentication..." />; // Or return null;
}


// --- Main App Component ---
function App() {
    // Use useAuthState hook ONCE here in the main App component
    const [user, loading, authError] = useAuthState(firebaseAuth);

    // Derive boolean authentication status from user object
    const isAuthenticated = !!user; // True if user object exists, false otherwise

    // Handle INITIAL app loading state (while firebase checks auth status)
    if (loading) {
         // Show a full-page loader during this initial check
         return <GlobalLoader message="Initializing MindWell..." />;
    }

    // Handle initial Firebase auth hook errors (e.g., connection issues)
    if (authError && !loading) { // Make sure loading is false before declaring error
        console.error("Initial Firebase Auth Hook Error:", authError);
        return (
            // Provide basic structure even for errors
            <Router>
                <div className="app-container">
                    <main className="content-container" style={{ width: '100%', paddingLeft: 0 }}>
                       <GlobalLoader message="Authentication error. Please try refreshing." />
                       {/* Consider adding a button to try logging in again */}
                    </main>
                </div>
            </Router>
        );
    }

    // --- Render the main application structure ---
    return (
        <Router>
            <div className="app-container">
                {/* Sidebar: Conditionally render based on the derived isAuthenticated status */}
                {isAuthenticated && <Sidebar />}

                {/* Main Content Area: Adjust class based on auth status */}
                <main className={`content-container ${isAuthenticated ? 'content-shifted' : ''}`}>
                    <Routes>
                         {/* Public Route: Authentication Page */}
                         {/* Redirect logged-in users away from /auth */}
                        <Route
                            path="/auth"
                            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
                        />

                        {/* Protected Routes: Wrap element with ProtectedRoute and pass props */}
                        {/* Pass the loading status AND the derived isAuthenticated status */}
                        <Route
                            path="/"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><Home /></ProtectedRoute>}
                        />
                        <Route
                            path="/dashboard"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><Dashboard /></ProtectedRoute>}
                        />
                        <Route
                            path="/find-doctor"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><FindDoctor /></ProtectedRoute>}
                        />
                        <Route
                            path="/chatbot"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><ChatBot /></ProtectedRoute>}
                        />
                        <Route
                            path="/anonymous-letters"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><AnonymousLetters /></ProtectedRoute>}
                        />
                        <Route
                            path="/quick-relief"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><QuickRelief /></ProtectedRoute>}
                        />
                        <Route
                            path="/wellness-store"
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><WellnessStore /></ProtectedRoute>}
                        />

                        {/* Fallback Route: Redirect everything else */}
                        <Route
                            path="*"
                            element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;