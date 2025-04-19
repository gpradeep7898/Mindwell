// frontend/src/pages/AnonymousLetters.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged, getIdToken } from "firebase/auth"; // Firebase Auth functions
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiMessageSquare, FiTrash2, FiSend, FiAlertCircle } from "react-icons/fi"; // Icons
import GlobalLoader from "../components/GlobalLoader"; // Loader component
import { auth as firebaseAuth } from "../services/firebaseConfig"; // Firebase auth instance
import "./AnonymousLetters.css"; // Link specific styles

// Define API URL (Use environment variable)
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";
const LETTERS_API = `${API_URL}/api/anonymous-letters`;

// --- Helper function for authenticated requests ---
// (Ensure this helper handles token acquisition and headers correctly)
async function makeAuthenticatedRequest(method, url, data = null) {
    const user = firebaseAuth.currentUser;

    if (!user) {
        console.error("Attempted authenticated request without logged-in user.");
        // Throw an error that can be caught by the calling function
        throw new Error("User not logged in. Please log in again.");
    }

    try {
        const token = await getIdToken(user); // Get the Firebase ID token

        const config = {
            method: method.toLowerCase(), // Ensure method is lowercase
            url: url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            // Only include data body for relevant methods
            ...( (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') && data && { data: data }),
        };
        console.log(`Making ${method.toUpperCase()} request to ${url}`); // Debug log
        return await axios(config);

    } catch (error) {
        console.error(`Error in makeAuthenticatedRequest to ${url}:`, error);
        // Rethrow a potentially more informative error
        if (error.code === 'auth/user-token-expired') {
             throw new Error("Your session has expired. Please log in again.");
        }
        throw error; // Re-throw original or modified error
    }
}


// --- AnonymousLetters Component ---
const AnonymousLetters = () => {
    const [letters, setLetters] = useState([]);
    const [content, setContent] = useState("");
    const [sort, setSort] = useState("latest"); // Default sort order
    const [replyContent, setReplyContent] = useState({}); // State for reply inputs, keyed by letterId
    const [currentUser, setCurrentUser] = useState(null); // Store user object
    const [isLoading, setIsLoading] = useState(true); // Loading letters
    const [isSubmittingLetter, setIsSubmittingLetter] = useState(false); // Submitting new letter
    const [isSubmittingReply, setIsSubmittingReply] = useState({}); // Submitting reply, keyed by letterId
    const [isLiking, setIsLiking] = useState({}); // Liking state, keyed by letterId
    const [error, setError] = useState(null); // General page errors
    const [actionError, setActionError] = useState(null); // Errors related to specific actions (like, reply)
    const replyInputRefs = useRef({}); // Refs for reply input fields

    // --- Authentication State ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setCurrentUser(user); // Store the whole user object or null
            if (user) {
                console.log("User is logged in:", user.email);
            } else {
                console.log("User is logged out");
                 // Clear potentially sensitive state on logout
                 setReplyContent({});
            }
             // Fetch letters initially or when user changes (if access depends on auth)
             // For public GET, fetch regardless, but auth state needed for actions
             fetchLetters(sort);
        });
        // Cleanup listener on unmount
        return () => unsubscribe();
        // Fetch letters depends on sort state as well
    }, [sort]); // Rerun only if sort changes after initial load


    // --- Fetch Letters ---
    // Wrap in useCallback to stabilize function identity
    const fetchLetters = useCallback(async (currentSort = 'latest', currentPage = 1) => {
        setIsLoading(true);
        setError(null); // Clear general errors on new fetch
        setActionError(null); // Clear action errors on new fetch
        console.log(`Fetching letters with sort: ${currentSort}, page: ${currentPage}`);
        try {
            // GET request doesn't need auth token based on backend setup
            const response = await axios.get(LETTERS_API, {
                params: { sort: currentSort, page: currentPage, limit: 10 } // Add params
            });
            // Ensure replies is always an array
            const formattedLetters = response.data.map(letter => ({
                ...letter,
                replies: Array.isArray(letter.replies) ? letter.replies : []
            }));
            setLetters(formattedLetters);
        } catch (err) {
            console.error("Error fetching letters:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to load letters.";
            setError(`Failed to load letters. ${err.response?.status === 404 ? 'Endpoint not found.' : 'Please try refreshing.'}`);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means fetchLetters function is created once

    // --- Submit Letter ---
    const submitLetter = async () => {
        if (!content.trim() || !currentUser) {
            setActionError("Please write something and ensure you are logged in.");
            return;
        }
        setIsSubmittingLetter(true);
        setActionError(null);
        try {
            await makeAuthenticatedRequest('post', LETTERS_API, { content: content.trim() });
            setContent(""); // Clear input on success
            await fetchLetters(sort); // Refresh letters list
            // Optionally show a success notification
        } catch (err) {
            console.error("Error submitting letter:", err);
            const message = err.response?.data?.error || err.message || "Failed to submit letter.";
            setActionError(message); // Show specific action error
        } finally {
            setIsSubmittingLetter(false);
        }
    };

    // --- Submit Reply ---
    const submitReply = async (letterId) => {
        const replyText = replyContent[letterId]?.trim();
        if (!replyText || !currentUser) {
             // Maybe a subtle hint instead of error? Or disable button.
            return;
        }
        setIsSubmittingReply(prev => ({ ...prev, [letterId]: true }));
        setActionError(null);
        try {
            await makeAuthenticatedRequest('post', `${LETTERS_API}/${letterId}/reply`, { content: replyText });
            // Clear specific reply input on success
            setReplyContent((prev) => ({ ...prev, [letterId]: "" }));
            await fetchLetters(sort); // Refresh list
        } catch (err) {
            console.error("Error submitting reply:", err);
            const message = err.response?.data?.error || err.message || "Failed to post reply.";
            setActionError(`Reply Error: ${message}`);
        } finally {
             setIsSubmittingReply(prev => ({ ...prev, [letterId]: false }));
        }
    };

    // --- Like/Unlike a Letter ---
    const toggleLikeLetter = async (id) => {
        if (!currentUser) return; // Must be logged in
        if (isLiking[id]) return; // Prevent double clicks

        setIsLiking(prev => ({ ...prev, [id]: true }));
        setActionError(null);

        try {
            // Send request to backend's like toggle endpoint
            await makeAuthenticatedRequest('post', `${LETTERS_API}/${id}/like`);
            // Refresh the list to show updated like count & potentially user's like status
            // More advanced: Update state optimistically or parse response for new count
            await fetchLetters(sort);
        } catch (err) {
            console.error("Error liking/unliking letter:", err);
            const message = err.response?.data?.error || err.message || "Failed to update like status.";
             setActionError(`Like Error: ${message}`);
        } finally {
            setIsLiking(prev => ({ ...prev, [id]: false }));
        }
    };

    // --- Delete Letter ---
    const deleteLetter = async (id, authorUsername) => {
        // Client-side check is secondary; backend enforces ownership
        if (!currentUser || currentUser.email?.split('@')[0] !== authorUsername) {
             setActionError("You can only delete your own letters.");
             return;
         }
        if (!window.confirm("Are you sure you want to delete this letter permanently?")) {
             return;
         }
        setActionError(null);
        // Add loading state for delete if needed
        try {
            await makeAuthenticatedRequest('delete', `${LETTERS_API}/${id}`);
            await fetchLetters(sort); // Refresh list
             // Optionally show success notification
        } catch (err) {
            console.error("Error deleting letter:", err);
            const message = err.response?.data?.error || err.message || "Failed to delete letter.";
            setActionError(`Delete Error: ${message}`);
        } finally {
             // Clear loading state if used
        }
    };

    // --- Format Timestamp ---
     const formatTimestamp = useCallback((isoStringOrDate) => {
        if (!isoStringOrDate) return '';
        try {
            const date = new Date(isoStringOrDate); // Works for ISO strings & Date objects
             if (isNaN(date.getTime())) return ''; // Check for invalid date
             // Example format: Jan 5, 2024, 10:30 AM
             return date.toLocaleString(undefined, { // Use user's locale
                 dateStyle: 'medium',
                 timeStyle: 'short'
             });
        } catch (e) {
            console.error("Timestamp format error:", e);
            return 'Invalid date';
        }
    }, []);

    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };
    const cardVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, x: -20 } };
    const errorVariants = { hidden: { opacity: 0, height: 0 }, visible: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 } };

    // --- Render ---
    return (
        <motion.div
            className="anon-letters-page-container"
            variants={pageVariants} initial="hidden" animate="visible"
        >
            {/* Header */}
             <header className="page-header letters-header">
                 <span className="header-icon">✉️</span>
                <h2 className="page-title">Community Letters</h2>
                <p className="page-subtitle">Share thoughts anonymously and offer support to others.</p>
            </header>

             {/* Submission Form - Only show if logged in */}
             {currentUser ? (
                <motion.div
                    className="submission-form-container"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    layout
                >
                    <textarea
                        placeholder="Share your thoughts here anonymously..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        aria-label="New anonymous letter content"
                        disabled={isSubmittingLetter}
                        maxLength={2000} // Match backend validation
                    />
                    <motion.button
                        className="aura-button primary post-letter-button"
                        onClick={submitLetter}
                        disabled={!content.trim() || isSubmittingLetter}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                        {isSubmittingLetter ? "Posting..." : "Post Letter"}
                    </motion.button>
                </motion.div>
            ) : (
                 <p className="login-prompt">Please log in to post, reply, or like letters.</p>
            )}

             {/* Action Error Display */}
             <AnimatePresence>
                {actionError && (
                    <motion.div
                        className="error-message action-error"
                        variants={errorVariants} initial="hidden" animate="visible" exit="hidden"
                        role="alert"
                    >
                        <FiAlertCircle/> {actionError}
                    </motion.div>
                )}
             </AnimatePresence>

            {/* Content Area */}
            <div className="letters-content-area">
                 <div className="controls-header">
                    <h3 className="section-heading">Recent Letters</h3>
                    {/* TODO: Add Sort Select UI */}
                    {/* <select value={sort} onChange={(e) => setSort(e.target.value)} disabled={isLoading}>...</select> */}
                 </div>

                 {/* General Loading/Error State for the list */}
                 {isLoading ? ( <GlobalLoader message="Loading letters..."/> )
                  : error ? ( <div className="error-message page-error" role="alert">{error}</div> )
                  : letters.length === 0 ? ( <p className="no-results-message">No letters found. Be the first to share!</p> )
                  : (
                    <div className="letters-list">
                        {/* AnimatePresence helps animate items added/removed */}
                        <AnimatePresence>
                            {letters.map((letter) => (
                                <motion.div
                                    key={letter.id}
                                    className="aura-card letter-card"
                                    variants={cardVariants}
                                    initial="hidden" animate="visible" exit="exit"
                                    layout // Animate layout changes smoothly
                                >
                                    {/* Author Info */}
                                    <div className="letter-author">
                                        <span className="author-avatar">👤</span>
                                        {/* Display only username part */}
                                        <strong>@{letter.username}</strong>
                                        <span className="letter-timestamp">{formatTimestamp(letter.timestamp)}</span>
                                    </div>

                                    {/* Content */}
                                    {/* Use dangerouslySetInnerHTML ONLY if you trust the escaped content */}
                                    {/* For basic text, just render normally: */}
                                     <p className="letter-content">{letter.content}</p>

                                    {/* Footer Actions */}
                                    <div className="letter-footer">
                                        {/* Like Button */}
                                        <motion.button
                                            className={`action-button like-button ${isLiking[letter.id] ? 'liking' : ''}`}
                                            onClick={() => toggleLikeLetter(letter.id)}
                                            disabled={!currentUser || isLiking[letter.id]}
                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                            aria-label={`Like letter, currently ${letter.likes || 0} likes`}
                                            title={currentUser ? "Like/Unlike" : "Log in to like"}
                                        >
                                             <FiHeart /> <span>{letter.likes || 0}</span>
                                        </motion.button>

                                        {/* Reply Icon/Button (optional - just shows reply section) */}
                                        <span className="action-button reply-icon-indicator" title="Replies">
                                            <FiMessageSquare /> {letter.replies?.length || 0}
                                        </span>


                                        {/* Delete Button - Show only if user is the author */}
                                        {currentUser && currentUser.email?.startsWith(letter.username + '@') && (
                                            <motion.button
                                                className="action-button delete-button"
                                                onClick={() => deleteLetter(letter.id, letter.username)}
                                                whileHover={{ scale: 1.1, color: 'var(--color-error)' }} whileTap={{ scale: 0.9 }}
                                                aria-label="Delete this letter"
                                                title="Delete My Letter"
                                            > <FiTrash2 /> </motion.button>
                                        )}
                                    </div>

                                    {/* Replies Section */}
                                     <div className="replies-container">
                                        {/* Existing Replies List */}
                                        {letter.replies && letter.replies.length > 0 && (
                                            <div className="replies-list">
                                                 <h4 className="replies-heading">Replies:</h4>
                                                {letter.replies.map((reply, index) => (
                                                    <div key={`${letter.id}-reply-${index}`} className="reply-item"> {/* More unique key */}
                                                        <p className="reply-content">
                                                            <span className="reply-author"><strong>@{reply.username}:</strong></span>
                                                            {' '}{reply.content}
                                                        </p>
                                                         <span className="reply-timestamp">{formatTimestamp(reply.timestamp)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                         {/* Reply Input Form (Show if logged in) */}
                                         {currentUser && (
                                            <div className="reply-form">
                                                <input
                                                    type="text"
                                                    ref={(el) => (replyInputRefs.current[letter.id] = el)} // Assign ref
                                                    placeholder="Write a supportive reply..."
                                                    value={replyContent[letter.id] || ""}
                                                    onChange={(e) => setReplyContent({ ...replyContent, [letter.id]: e.target.value })}
                                                    aria-label={`Reply to letter by @${letter.username}`}
                                                    disabled={isSubmittingReply[letter.id]}
                                                    maxLength={500} // Match backend validation
                                                />
                                                <motion.button
                                                    className="send-reply-button"
                                                    onClick={() => submitReply(letter.id)}
                                                    disabled={!replyContent[letter.id]?.trim() || isSubmittingReply[letter.id]}
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    aria-label="Send reply"
                                                >
                                                     {isSubmittingReply[letter.id] ? <div className="mini-spinner"></div> : <FiSend />}
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                 {/* TODO: Add Pagination Controls here if implementing */}
            </div>
        </motion.div>
    );
};

export default AnonymousLetters;