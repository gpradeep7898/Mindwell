import React, { useState } from "react";
import { auth } from "../services/firebaseConfig";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import "./Auth.css";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Handle Email & Password Authentication
    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Handle Google Authentication
    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setLoading(true);
            await signInWithPopup(auth, provider);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {loading ? (
                <div className="fullscreen-loader">
                    <div className="loader"></div>
                </div>
            ) : (
                <motion.div className="auth-card" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <h2>{isSignUp ? "✨ Create an Account ✨" : "✨ Welcome Back! ✨"}</h2>
                    
                    <motion.form onSubmit={handleAuth} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {error && <p className="error">{error}</p>}
                        <motion.button type="submit" className="auth-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {isSignUp ? "Sign Up 🚀" : "Login 🚀"}
                        </motion.button>
                    </motion.form>
                    
                    <p className="toggle-auth" onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
                    </p>
                    
                    <motion.button className="google-btn" onClick={handleGoogleSignIn} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <FcGoogle className="icon" /> Continue with Google
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
};

export default Auth;
