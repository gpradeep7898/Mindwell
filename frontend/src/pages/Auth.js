// frontend/src/pages/Auth.js
import React, { useState } from "react";
import { auth } from "../services/firebaseConfig"; // Path to your firebase config
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile // Import updateProfile
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc"; // Google icon
import { motion, AnimatePresence } from "framer-motion";
import GlobalLoader from "../components/GlobalLoader"; // Import loader
import "./Auth.css"; // Link to specific Auth styles
import AppLogoImage from '../assets/Logo.webp'; // Path to your logo

// --- Auth Component ---
const Auth = () => {
    // Start with Sign Up panel active
    const [isSignUpActive, setIsSignUpActive] = useState(true);
    // Form fields state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState(""); // Name field for sign-up
    // UI/Error state
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // Navigation hook
    const navigate = useNavigate();

    // --- Authentication Logic ---
    const handleAuthSubmit = async (e, isSignUpForm) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        console.log(`Attempting ${isSignUpForm ? 'Sign Up' : 'Sign In'}...`);
        const currentEmail = email;
        const currentPassword = password;
        const currentName = name;

        try {
            if (isSignUpForm) {
                // Validate name for sign-up
                if (!currentName.trim()) {
                    const nameError = new Error("Name is required for sign up.");
                    nameError.code = 'auth/missing-name';
                    throw nameError;
                }
                // Create user
                const userCredential = await createUserWithEmailAndPassword(auth, currentEmail, currentPassword);
                // Set display name (optional but good practice)
                 await updateProfile(userCredential.user, { displayName: currentName.trim() });
                 console.log("Sign up successful, display name set:", userCredential.user.uid);

            } else {
                // Sign in user
                const userCredential = await signInWithEmailAndPassword(auth, currentEmail, currentPassword);
                console.log("Sign in successful:", userCredential.user.uid);
            }
            // Navigate to home/dashboard after successful auth
            navigate("/");

        } catch (err) {
            handleAuthError(err); // Use helper to handle errors
        } finally {
            setLoading(false); // Stop loading indicator
        }
    };

    // --- Google Sign-In Logic ---
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        setError(null);
        setLoading(true);
        console.log("Attempting Google Sign In...");
        try {
            await signInWithPopup(auth, provider);
            console.log("Google Sign In successful");
            navigate("/"); // Navigate after successful Google sign-in
        } catch (err) {
            handleAuthError(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Error Handling Helper ---
    const handleAuthError = (err) => {
        let friendlyError = "An authentication error occurred. Please try again.";
        console.error("Auth Error Raw:", err);
        const errorCode = err.code || '';

        switch (errorCode) {
             case 'auth/user-not-found':
             case 'auth/wrong-password':
             case 'auth/invalid-credential':
                 friendlyError = "Invalid email or password.";
                 break;
             case 'auth/email-already-in-use':
                 friendlyError = "This email address is already registered.";
                 break;
             case 'auth/weak-password':
                 friendlyError = "Password should be at least 6 characters long.";
                 break;
             case 'auth/popup-closed-by-user':
             case 'auth/cancelled-popup-request':
                 friendlyError = "Sign-in cancelled.";
                 break;
             case 'auth/account-exists-with-different-credential':
                 friendlyError = "An account already exists with this email using a different sign-in method (e.g., Google).";
                 break;
             case 'auth/invalid-email':
                 friendlyError = "Please enter a valid email address.";
                 break;
             case 'auth/missing-name': // Custom code from our validation
                 friendlyError = err.message;
                 break;
             case 'auth/network-request-failed':
                 friendlyError = "Network error. Please check your connection and try again.";
                 break;
             default:
                 console.error("Unhandled Auth Error Code:", errorCode, err.message);
                 // Use the default message or Firebase's message if available
                 friendlyError = err.message || friendlyError;
                 break;
        }
        setError(friendlyError);
    };

    // --- Function to Toggle Form View ---
    const toggleForm = (activateSignUp) => {
        if (loading) return; // Prevent toggle while loading
        setIsSignUpActive(activateSignUp);
        // Clear form fields and errors on toggle
        setError(null);
        setName("");
        setEmail("");
        setPassword("");
    };

    // --- Framer Motion Variants ---
     const buttonVariants = {
        hover: { scale: 1.03, transition: { duration: 0.2 } },
        tap: { scale: 0.97, transition: { duration: 0.1 } },
    };

    // --- Render Component ---
    return (
        <div className="auth-page-container">
            {/* Loading Overlay - Use GlobalLoader */}
            <AnimatePresence>
                {loading && <GlobalLoader message="Processing..." />}
            </AnimatePresence>

             {/* Add panel-active class when Sign In is active (isSignUpActive is false) */}
            <div className={`auth-panel-container ${!isSignUpActive ? 'panel-active' : ''}`}>

                {/* --- Sign Up Form (Left side initially) --- */}
                <div className="form-container sign-up-container">
                    <form onSubmit={(e) => handleAuthSubmit(e, true)} noValidate>
                    <img src={AppLogoImage} alt="MindWell Logo" className="auth-form-logo-image" />
                        <h1>Create Account</h1>
                         <div className="social-icons">
                            <motion.button type="button" aria-label="Sign up with Google" onClick={handleGoogleSignIn} className="social-icon google" variants={buttonVariants} whileHover="hover" whileTap="tap" disabled={loading}>
                                <FcGoogle />
                            </motion.button>
                         </div>
                        <span>or use your email for registration</span>
                        {/* Name Input */}
                        <div className="input-group">
                            <label htmlFor="signup-name">Name</label>
                            <input id="signup-name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} autoComplete="name"/>
                        </div>
                        {/* Email Input */}
                        <div className="input-group">
                            <label htmlFor="signup-email">Email</label>
                            <input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email"/>
                        </div>
                        {/* Password Input */}
                        <div className="input-group">
                            <label htmlFor="signup-password">Password</label>
                            <input id="signup-password" type="password" placeholder="Password (min. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} autoComplete="new-password"/>
                        </div>
                        {/* Error Message Area for Sign Up */}
                        <AnimatePresence>
                            {error && isSignUpActive && (
                                <motion.p className="error-message form-error" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} role="alert">
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        {/* Submit Button */}
                        <motion.button type="submit" className="auth-button primary form-button" disabled={loading} variants={buttonVariants} whileHover="hover" whileTap="tap">
                             Sign Up
                        </motion.button>
                        {/* Toggle Link (Mobile View) */}
                        <button type="button" className="toggle-auth-mode mobile-toggle" onClick={() => toggleForm(false)} disabled={loading}>
                            Already have an account? Sign In
                        </button>
                    </form>
                </div>

                {/* --- Sign In Form (Slides in from right) --- */}
                <div className="form-container sign-in-container">
                     <form onSubmit={(e) => handleAuthSubmit(e, false)} noValidate>
                     <img src={AppLogoImage} alt="MindWell Logo" className="auth-form-logo-image" />
                        <h1>Sign In</h1>
                         <div className="social-icons">
                             <motion.button type="button" aria-label="Sign in with Google" onClick={handleGoogleSignIn} className="social-icon google" variants={buttonVariants} whileHover="hover" whileTap="tap" disabled={loading}>
                                <FcGoogle />
                            </motion.button>
                         </div>
                        <span>or use your email password</span>
                        {/* Email Input */}
                        <div className="input-group">
                            <label htmlFor="signin-email">Email</label>
                            <input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} autoComplete="email"/>
                        </div>
                        {/* Password Input */}
                        <div className="input-group">
                            <label htmlFor="signin-password">Password</label>
                            <input id="signin-password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} autoComplete="current-password"/>
                        </div>
                         {/* Error Message Area for Sign In */}
                        <AnimatePresence>
                            {error && !isSignUpActive && (
                                <motion.p className="error-message form-error" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} exit={{opacity: 0, height: 0}} role="alert">
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        {/* Submit Button */}
                        <motion.button type="submit" className="auth-button primary form-button" disabled={loading} variants={buttonVariants} whileHover="hover" whileTap="tap">
                            Sign In
                        </motion.button>
                         {/* Toggle Link (Mobile View) */}
                         <button type="button" className="toggle-auth-mode mobile-toggle" onClick={() => toggleForm(true)} disabled={loading}>
                             Don't have an account? Create one
                         </button>
                    </form>
                </div>

                 {/* --- Sliding Overlay Container (Desktop View) --- */}
                  <div className="overlay-container">
                     <div className="overlay"> {/* Gradient background */}

                        {/* Left Overlay Panel (Shown when Sign In form is active) */}
                        <div className="overlay-panel overlay-left">
                            <h1>Welcome Back!</h1>
                            <p>Already have an account? Sign in to continue your journey.</p>
                            {/* Button to switch to Sign Up form */}
                            <motion.button
                                type="button"
                                className="auth-button ghost"
                                onClick={() => toggleForm(true)} // Activate Sign Up view
                                variants={buttonVariants} whileHover="hover" whileTap="tap"
                                disabled={loading}
                            >
                                Sign Up
                            </motion.button>
                        </div>

                         {/* Right Overlay Panel (Shown when Sign Up form is active) */}
                        <div className="overlay-panel overlay-right">
                            <h1>Hello, Friend!</h1>
                            <p>New here? Enter your details and start your journey with us.</p>
                             {/* Button to switch to Sign In form */}
                             <motion.button
                                type="button"
                                className="auth-button ghost"
                                onClick={() => toggleForm(false)} // Activate Sign In view
                                variants={buttonVariants} whileHover="hover" whileTap="tap"
                                disabled={loading}
                            >
                                Sign In
                             </motion.button>
                        </div>
                    </div>
                </div>

            </div> {/* End Auth Panel Container */}
        </div> // End Auth Page Container
    );
};

export default Auth;