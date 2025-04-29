// frontend/src/context/AuthContext.js
// Provides Firebase Authentication context and hook for the application.

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// Assuming Firebase is initialized in firebaseConfig.js and runs early (e.g., imported in index.js)

// Create the React Context
const AuthContext = createContext(undefined); // Initialize with undefined

// --- Custom Hook: useAuth ---
// Provides an easy way for components to consume the context.
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Ensures the hook is used within a descendant of AuthProvider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// --- Provider Component: AuthProvider ---
// Manages the authentication state and provides it to the context.
export function AuthProvider({ children }) {
    // State to hold the current Firebase user object (null if logged out)
    const [currentUser, setCurrentUser] = useState(null);
    // State to indicate if the initial auth state check is complete
    const [loading, setLoading] = useState(true);

    // Effect to set up the Firebase auth state listener on component mount
    useEffect(() => {
        let auth;
        try {
            // Get the initialized Firebase Auth instance
            auth = getAuth();
        } catch (error) {
            console.error("AuthContext Error: Failed to get Firebase Auth instance. Was Firebase initialized?", error);
            setLoading(false);
            return; // Exit effect if auth can't be obtained
        }

        console.log("AuthContext: Setting up onAuthStateChanged listener...");

        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // This callback fires whenever the user logs in or out
            if (user) {
                console.log("AuthContext: onAuthStateChanged - User SIGNED IN:", user.uid);
                setCurrentUser(user);
            } else {
                console.log("AuthContext: onAuthStateChanged - User SIGNED OUT");
                setCurrentUser(null);
            }
            // Once the first callback fires, we know the initial state
            setLoading(false);
        },
        (error) => {
             console.error("AuthContext Error: Error in onAuthStateChanged listener:", error);
             setCurrentUser(null); // Assume logged out on error
             setLoading(false);
        });

        // Cleanup function: Unsubscribe when AuthProvider unmounts.
        return () => {
             console.log("AuthContext: Unsubscribing from onAuthStateChanged listener.");
             unsubscribe();
        };
    }, []); // Empty dependency array: Run only once on mount.

    // --- Context Value ---
    // Memoize the value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        currentUser, // The Firebase user object (or null)
        loading,     // Boolean indicating if initial auth check is done
    }), [currentUser, loading]);

    // --- Render ---
    // Provide the context value. Render children only after initial load.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {/* Optional: Display a global loading indicator */}
            {/* {loading && <YourGlobalLoadingComponent message="Checking session..." />} */}
        </AuthContext.Provider>
    );
}