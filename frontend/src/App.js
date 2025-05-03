// frontend/src/App.js
// Uses AuthContext for state, defines routing structure.

import React from "react";
import {
    // BrowserRouter as Router, // Removed Router from here, assumed to be in index.js
    Route,
    Routes,
    Navigate,
    useLocation
} from "react-router-dom";

// Pages
import Home from "./pages/Home";
import FindDoctor from "./pages/FindDoctor";
import ChatBot from "./pages/Chatbot";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AnonymousLetters from "./pages/AnonymousLetters";
import QuickRelief from "./pages/QuickRelief";
import WellnessStore from "./pages/WellnessStore";
import AccountSettings from './pages/AccountSettings'; 
// Components
import Sidebar from "./components/Sidebar";
import GlobalLoader from "./components/GlobalLoader";
import { AnimatePresence } from 'framer-motion';

// Context & Styles
import { useAuth } from "./context/AuthContext"; // <<< Use AuthContext hook
import "./App.css";

// --- Protected Route Component ---
function ProtectedRoute({ children, isAuthenticated, isLoading }) {
    // Redirect to auth if context is done loading and user is not authenticated
    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }
    // Render children if context is done loading and user is authenticated
    if (!isLoading && isAuthenticated) {
        return children;
    }
    // Show loader while context is initially loading auth state
    // This loader might flash briefly. Consider styling or removing if jarring.
    return <GlobalLoader message="Verifying session..." />;
}


// --- Main App Component ---
function App() {
    // Get state from AuthContext
    const { currentUser, loading } = useAuth(); // <<< Use context state

    const isAuthenticated = !!currentUser;

    const location = useLocation(); 

    return (
        // Router removed from here, assuming it's in index.js now
        <div className="app-container">
            {/* Sidebar: Render only if authenticated */}
            {/* Ensure Sidebar component correctly uses useAuth if needed */}
            {isAuthenticated && <Sidebar />}

            {/* Main Content Area */}
            <main className={`content-container ${isAuthenticated ? 'content-shifted' : ''}`}>
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        {/* Public Route: Auth Page */}
                        <Route
                            path="/auth"
                            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />} // Redirect to dashboard on login
                        />

                        {/* Protected Routes: Use context state */}
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
                            path="/chatbot" // Path for AI Assistant
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
                        <Route
                            path="/account-settings" 
                            element={<ProtectedRoute isAuthenticated={isAuthenticated} isLoading={loading}><AccountSettings /></ProtectedRoute>}
                        />
                        {/* Fallback Route */}
                        <Route
                            path="*"
                            // Redirect to dashboard if logged in, auth page if not
                            element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />}
                        />
                    </Routes>
                </AnimatePresence>
            </main>
        </div>
    );
}

// Export App directly as Router is likely moved to index.js
export default App;