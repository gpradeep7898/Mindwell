// frontend/src/context/AuthContext.js
// Final Corrected Version: Imports and uses 'auth' instance directly.
// Provides Firebase Authentication context, state, and refresh function.

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback // Added useCallback back for refreshUserData
} from 'react';
// Import only the necessary Firebase Auth function used directly here
import { onAuthStateChanged } from 'firebase/auth';
// --- CORRECTED IMPORT ---
// Import the initialized 'auth' instance directly from your Firebase config file
// Ensure the path is correct relative to this context file
import { auth } from '../firebaseConfig'; // <<< Use the exported 'auth'
// --- END CORRECTION ---


// --- Create the React Context ---
// Define a default shape for the context value to help with typing and autocompletion
const defaultAuthContextValue = {
    currentUser: null, // Default to null when no user is logged in
    loading: true,     // Start in loading state until Firebase confirms auth status
    // Provide a default no-op function for refreshUserData
    refreshUserData: async () => {
        console.warn("AuthContext: refreshUserData called before AuthProvider initialized.");
        // Optionally return a rejected promise or specific value if needed
        // return Promise.reject(new Error("AuthProvider not ready"));
    },
};
// Create the context object with the default value
const AuthContext = createContext(defaultAuthContextValue);


// --- Custom Hook: useAuth ---
// Simplifies consuming the context value in components.
export function useAuth() {
    const context = useContext(AuthContext);
    // Ensure the hook is used within the provider's component tree
    if (context === undefined) {
        throw new Error('useAuth hook must be used within the AuthProvider component tree.');
    }
    return context;
}


// --- Provider Component: AuthProvider ---
// This component wraps your application or the parts that need access to auth state.
// It manages the authentication state internally and provides it down the tree.
export function AuthProvider({ children }) {
    // State variable to hold the current Firebase User object (or null)
    const [currentUser, setCurrentUser] = useState(null);
    // State variable to track if the initial authentication check by Firebase is complete
    const [loading, setLoading] = useState(true);

    // NOTE: We are now using the 'auth' instance imported directly above.
    // No need to call getAuth() here.

    // --- Function to Manually Refresh User Data ---
    // Uses useCallback to memoize the function itself.
    const refreshUserData = useCallback(async () => {
        // Use the imported 'auth' instance to get the current user
        const user = auth.currentUser;
        if (user) {
            try {
                console.log("AuthContext: Attempting user.reload()");
                setLoading(true); // Indicate activity
                await user.reload(); // Refresh the user's profile data
                // Get the potentially updated user instance *after* reload
                const refreshedUser = auth.currentUser;
                console.log("AuthContext: User data reloaded successfully. Updating context state.");
                // --- Store the actual Firebase User object instance ---
                setCurrentUser(refreshedUser); // Store the refreshed instance (or null)
            } catch (error) {
                console.error("AuthContext: Error occurred while reloading user data:", error);
                // Handle specific errors that might require user action or logout
                 if (error.code === 'auth/user-token-expired' || error.code === 'auth/user-disabled' || error.code === 'auth/user-not-found') {
                   console.warn(`AuthContext: User session issue (${error.code}). Forcing logout.`);
                   setCurrentUser(null); // Force logout if user state is invalid
                }
                 // Consider how to handle other errors - maybe set an error state?
            } finally {
                 setLoading(false); // Ensure loading state is reset
            }
        } else {
            // If no user is logged in when refresh is called
            console.log("AuthContext: refreshUserData called, but no user is currently signed in.");
        }
        // Dependency array includes the imported 'auth' instance, although it's unlikely to change
    }, [auth]);


    // --- Effect for Firebase Auth State Listener ---
    // This effect runs once when the AuthProvider mounts.
    useEffect(() => {
        console.log("AuthContext: Setting up Firebase onAuthStateChanged listener...");

        // onAuthStateChanged registers a listener for authentication state changes (login/logout).
        // It returns an `unsubscribe` function to detach the listener later.
        const unsubscribe = onAuthStateChanged(
            auth, // Use the imported auth instance
            (user) => { // Firebase calls this callback with the User object or null
                console.log("AuthContext: onAuthStateChanged detected user state:", user ? user.uid : 'null');
                // --- Store the actual Firebase User object instance ---
                setCurrentUser(user); // Update state with the actual User object or null
                // Mark initial loading as complete after the first check
                setLoading(false);
            },
            (error) => { // Handle errors specifically from the listener itself
                 console.error("AuthContext Error: Firebase onAuthStateChanged listener failed:", error);
                 setCurrentUser(null); // Assume user is logged out if listener breaks
                 setLoading(false);
            }
        );

        // Cleanup function for useEffect: This runs when the AuthProvider unmounts.
        // It's crucial to prevent memory leaks.
        return () => {
             console.log("AuthContext: Unsubscribing from onAuthStateChanged listener on unmount.");
             unsubscribe(); // Detach the listener
        };
        // Dependency array includes the imported 'auth' instance
    }, [auth]);


    // --- Context Value ---
    // Memoize the object being passed down via context.
    const value = useMemo(() => ({
        currentUser,
        loading,
        refreshUserData // Make the refresh function available to consumers
    }), [currentUser, loading, refreshUserData]); // Dependencies for memoization


    // --- Render Provider ---
    // Pass the memoized 'value' to the context provider.
    // Conditionally render children only when the initial loading is complete.
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}