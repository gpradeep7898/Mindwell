// frontend/src/pages/AnonymousLetters.js
// Updated: Uses useAuth hook, handles moderation errors, general refinements

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
// Import ONLY useAuth from context now
import { useAuth } from "../context/AuthContext"; // <<< Use context hook
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiMessageSquare, FiTrash2, FiSend, FiAlertCircle, FiMail, FiLoader } from "react-icons/fi"; // Added Mail, Loader icons
import GlobalLoader from "../components/GlobalLoader";
import "./AnonymousLetters.css"; // Link specific styles

// --- Define API URL (Use environment variable) ---
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";
const LETTERS_API = `${API_URL}/api/anonymous-letters`;

// --- Helper: makeAuthenticatedRequest ---
// Utility function to simplify making requests that require authentication
async function makeAuthenticatedRequest(user, method, url, data = null) {
    // Check if user object is valid and has getIdToken method
    if (!user || typeof user.getIdToken !== 'function') {
        console.error("Attempted authenticated request without a valid user object.");
        throw new Error("User not logged in or session invalid. Please log in again.");
    }

    try {
        const token = await user.getIdToken(); // Get the latest Firebase ID token

        // Configure Axios request
        const config = {
            method: method.toLowerCase(), // Ensure method is lowercase
            url: url,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json', // Assume JSON content type
            },
            // Conditionally include data payload for POST/PUT requests
            ...( (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') && data && { data: data }),
        };

        console.log(`Making ${method.toUpperCase()} request to ${url}`); // Debugging log
        return await axios(config); // Execute request

    } catch (error) {
        console.error(`Error in makeAuthenticatedRequest to ${url}:`, error);
        // Check if the error is specifically due to token expiration from Firebase itself
        if (error.code === 'auth/id-token-expired') {
             throw new Error("Your session has expired. Please log in again.");
        }
        // Re-throw the original Axios error (or other errors) to be handled by the caller
        throw error;
    }
}


// --- AnonymousLetters Component ---
const AnonymousLetters = () => {
    // --- State ---
    const [letters, setLetters] = useState([]); // Array of letter objects
    const [content, setContent] = useState(""); // Input for new letter
    // const [sort, setSort] = useState("latest"); // Removed sort state for now, add back with UI later
    const [replyContent, setReplyContent] = useState({}); // Reply inputs keyed by letterId
    const [isLoading, setIsLoading] = useState(true); // Loading initial letters
    const [isSubmittingLetter, setIsSubmittingLetter] = useState(false); // Loading state for new letter submission
    const [isSubmittingReply, setIsSubmittingReply] = useState({}); // Loading state for replies (keyed by letterId)
    const [isLiking, setIsLiking] = useState({}); // Loading state for likes (keyed by letterId)
    const [pageError, setPageError] = useState(null); // Errors related to fetching letters
    const [actionError, setActionError] = useState(null); // Errors for specific actions (submit, reply, like, delete)
    const replyInputRefs = useRef({}); // Refs to focus reply inputs

    // --- Get Authentication State from Context ---
    const { currentUser: user, loading: authLoading } = useAuth(); // Use context hook

    // --- Fetch Letters ---
    // useCallback prevents function recreation on every render unless dependencies change
    const fetchLetters = useCallback(async (currentPage = 1) => {
        // Don't fetch if auth is still loading (optional, depends if fetch needs user)
        // if (authLoading) return; // <-- If fetching requires auth, wait

        setIsLoading(true); // Set loading state for letter list
        setPageError(null); // Clear previous page errors
        setActionError(null); // Clear previous action errors
        const currentSort = 'latest'; // Keep sort fixed for now
        console.log(`Fetching letters with sort: ${currentSort}, page: ${currentPage}`);

        try {
            // Public GET request - no auth needed based on backend setup
            const response = await axios.get(LETTERS_API, {
                params: { sort: currentSort, page: currentPage, limit: 10 } // Query parameters
            });
            // Ensure 'replies' is always an array for consistent rendering
            const formattedLetters = response.data.map(letter => ({
                ...letter,
                replies: Array.isArray(letter.replies) ? letter.replies : []
            }));
            setLetters(formattedLetters);
        } catch (err) {
            console.error("Error fetching letters:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to load letters.";
            setPageError(`Failed to load letters. ${err.response?.status === 404 ? 'Resource not found.' : 'Please try refreshing.'}`);
        } finally {
            setIsLoading(false); // Clear loading state
        }
    }, []); // Empty dependency array - function is stable (unless authLoading is added)

    // --- Initial Data Load ---
    // useEffect runs once on mount to fetch initial letters
    useEffect(() => {
        fetchLetters();
    }, [fetchLetters]); // Depend on the stable fetchLetters function

    // --- Submit New Letter ---
    const submitLetter = async () => {
        // Check content and authentication
        if (!content.trim()) {
            setActionError("Please write something to share.");
            return;
        }
        if (!user) { // Check if user is available from context
            setActionError("Please log in to post a letter.");
            return;
        }

        setIsSubmittingLetter(true);
        setActionError(null); // Clear previous action errors

        try {
            // Make authenticated request using the helper
            await makeAuthenticatedRequest(user, 'post', LETTERS_API, { content: content.trim() });
            setContent(""); // Clear input field on success
            await fetchLetters(); // Refresh the letters list
            // TODO: Add success feedback (e.g., toast notification)
        } catch (err) {
            console.error("Error submitting letter:", err);
            // Handle specific moderation error message
            const message = (err.response?.status === 400 && err.response.data?.error?.includes("violate community guidelines"))
                          ? err.response.data.error // Show moderation message
                          : err.response?.data?.error || err.message || "Failed to submit letter."; // Show other errors
            setActionError(message);
        } finally {
            setIsSubmittingLetter(false); // Clear loading state
        }
    };

    // --- Submit Reply ---
    const submitReply = async (letterId) => {
        const replyText = replyContent[letterId]?.trim();
        if (!replyText) return; // Don't submit empty replies
        if (!user) {
            setActionError("Please log in to reply."); // Should ideally disable input if not logged in
            return;
        }

        setIsSubmittingReply(prev => ({ ...prev, [letterId]: true }));
        setActionError(null);

        try {
            await makeAuthenticatedRequest(user, 'post', `${LETTERS_API}/${letterId}/reply`, { content: replyText });
            setReplyContent((prev) => ({ ...prev, [letterId]: "" })); // Clear specific input field
            await fetchLetters(); // Refresh list (could be optimized to update only one letter)
        } catch (err) {
            console.error("Error submitting reply:", err);
            // Handle specific moderation error message
            const message = (err.response?.status === 400 && err.response.data?.error?.includes("violate community guidelines"))
                          ? err.response.data.error // Show moderation message
                          : err.response?.data?.error || err.message || "Failed to post reply.";
            setActionError(`Reply Error on letter ${letterId}: ${message}`);
        } finally {
             setIsSubmittingReply(prev => ({ ...prev, [letterId]: false }));
        }
    };

    // --- Like/Unlike a Letter ---
    const toggleLikeLetter = async (id) => {
        if (!user) {
             setActionError("Please log in to like letters.");
             return;
        }
        if (isLiking[id]) return; // Prevent multiple clicks while processing

        setIsLiking(prev => ({ ...prev, [id]: true }));
        setActionError(null);

        try {
            const response = await makeAuthenticatedRequest(user, 'post', `${LETTERS_API}/${id}/like`);
            // Optimistic UI update (or update based on response)
            // For simplicity, we refetch, but updating local state is better UX
            // const { likes } = response.data; // Assuming backend returns new like count
            // setLetters(prevLetters => prevLetters.map(l =>
            //      l.id === id ? { ...l, likes: likes /*, likedByCurrentUser: !l.likedByCurrentUser */ } : l
            // ));
            await fetchLetters(); // Simple refresh for now
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
        // Client-side check (primary check is backend)
        if (!user || user.email?.split('@')[0] !== authorUsername) {
             setActionError("You can only delete your own letters.");
             return;
         }
        // Confirmation dialog
        if (!window.confirm("Are you sure you want to permanently delete this letter and its replies?")) {
             return;
         }
        setActionError(null);
        // TODO: Add a specific loading state for delete action if desired

        try {
            await makeAuthenticatedRequest(user, 'delete', `${LETTERS_API}/${id}`);
            // Remove letter directly from state for immediate feedback (Optimistic UI)
            setLetters(prevLetters => prevLetters.filter(letter => letter.id !== id));
            // Or refetch: await fetchLetters();
        } catch (err) {
            console.error("Error deleting letter:", err);
            const message = err.response?.data?.error || err.message || "Failed to delete letter.";
            setActionError(`Delete Error: ${message}`);
        } finally {
             // Clear delete loading state if used
        }
    };

    // --- Format Timestamp Helper ---
     const formatTimestamp = useCallback((isoStringOrDate) => {
        if (!isoStringOrDate) return 'Just now'; // Fallback
        try {
            const date = new Date(isoStringOrDate);
             if (isNaN(date.getTime())) return 'Invalid date';
             // Simple relative time or specific format
             // Consider using a library like `date-fns` for more complex relative time
             return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        } catch (e) { return 'Invalid date'; }
    }, []);

    // --- Animation Variants ---
    const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };
    const cardVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } } };
    const errorVariants = { hidden: { opacity: 0, height: 0, marginBottom: 0 }, visible: { opacity: 1, height: 'auto', marginBottom: '1rem' }, exit: { opacity: 0, height: 0, marginBottom: 0 } };


    // --- Conditional Rendering Based on Loading/Error States ---
    const renderContent = () => {
        if (isLoading) { // Initial loading state for the whole list
             return <GlobalLoader message="Loading letters..."/>;
        }
        if (pageError) { // Error fetching the list
             return <div className="error-message page-error" role="alert"><FiAlertCircle/> {pageError}</div>;
        }
        if (letters.length === 0) { // No letters found
             return <p className="no-results-message">No letters found yet. Why not share something?</p>;
        }
        // Render the list of letters
        return (
             <div className="letters-list">
                 <AnimatePresence initial={false}> {/* Allow exit animations */}
                     {letters.map((letter) => (
                         <motion.div
                             key={letter.id}
                             className="aura-card letter-card"
                             variants={cardVariants}
                             initial="hidden" animate="visible" exit="exit"
                             layout // Enable smooth layout animations
                         >
                             {/* Author Info */}
                             <div className="letter-author">
                                 <span className="author-avatar">👤</span>
                                 <strong>@{letter.username}</strong> {/* Display username (already formatted from backend) */}
                                 <span className="letter-timestamp">{formatTimestamp(letter.timestamp)}</span>
                             </div>

                             {/* Content */}
                              <p className="letter-content">{letter.content}</p>
                              {letter.title && letter.title !== "Untitled" && <p className="letter-title"><em>Title: {letter.title}</em></p>}
                              {letter.mood && letter.mood !== "Neutral" && <span className="letter-mood-tag">{letter.mood}</span>}


                             {/* Footer Actions */}
                             <div className="letter-footer">
                                 <motion.button
                                     className={`action-button like-button ${isLiking[letter.id] ? 'processing' : ''}`}
                                     onClick={() => toggleLikeLetter(letter.id)}
                                     disabled={!user || isLiking[letter.id]} // Disable if not logged in or already processing
                                     whileHover={!isLiking[letter.id] ? { scale: 1.1 } : {}}
                                     whileTap={!isLiking[letter.id] ? { scale: 0.9 } : {}}
                                     aria-label={`Like letter, ${letter.likes || 0} likes`}
                                     title={user ? (isLiking[letter.id] ? "Processing..." : "Like/Unlike") : "Log in to like"}
                                 >
                                      {isLiking[letter.id] ? <FiLoader className="mini-spinner" /> : <FiHeart />}
                                      <span>{letter.likes || 0}</span>
                                 </motion.button>

                                 <span className="action-button reply-icon-indicator" title={`${letter.replyCount || 0} Replies`}>
                                     <FiMessageSquare /> {letter.replyCount || 0}
                                 </span>

                                 {/* Delete Button (Show conditionally) */}
                                 {user && user.email?.split('@')[0] === letter.username && (
                                     <motion.button
                                         className="action-button delete-button"
                                         onClick={() => deleteLetter(letter.id, letter.username)}
                                         whileHover={{ scale: 1.1, color: 'var(--color-error, #dc3545)' }} whileTap={{ scale: 0.9 }}
                                         aria-label="Delete this letter" title="Delete My Letter"
                                     > <FiTrash2 /> </motion.button>
                                 )}
                             </div>

                             {/* Replies Section */}
                              <div className="replies-container">
                                 {letter.replies && letter.replies.length > 0 && (
                                     <div className="replies-list">
                                          <h4 className="replies-heading">Replies</h4>
                                         {letter.replies.map((reply, index) => (
                                             <motion.div
                                                key={`${letter.id}-reply-${index}-${reply.timestamp}`} // More unique key
                                                className="reply-item"
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
                                                >
                                                 <p className="reply-content">
                                                     <span className="reply-author"><strong>@{reply.username}:</strong></span>
                                                     {' '}{reply.content}
                                                 </p>
                                                  <span className="reply-timestamp">{formatTimestamp(reply.timestamp)}</span>
                                             </motion.div>
                                         ))}
                                     </div>
                                 )}

                                  {/* Reply Input Form (Show if logged in) */}
                                  {user && (
                                     <form className="reply-form" onSubmit={(e) => { e.preventDefault(); submitReply(letter.id); }}>
                                         <input
                                             type="text"
                                             ref={(el) => (replyInputRefs.current[letter.id] = el)}
                                             placeholder="Write a supportive reply..."
                                             value={replyContent[letter.id] || ""}
                                             onChange={(e) => setReplyContent({ ...replyContent, [letter.id]: e.target.value })}
                                             aria-label={`Reply to letter by @${letter.username}`}
                                             disabled={isSubmittingReply[letter.id]}
                                             maxLength={500} // Match backend
                                         />
                                         <motion.button
                                             type="submit" // Make it a submit button for form
                                             className="send-reply-button"
                                             disabled={!replyContent[letter.id]?.trim() || isSubmittingReply[letter.id]}
                                             whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                             aria-label="Send reply"
                                             title="Send Reply"
                                         >
                                              {isSubmittingReply[letter.id] ? <FiLoader className="mini-spinner" /> : <FiSend />}
                                         </motion.button>
                                     </form>
                                 )}
                             </div>
                         </motion.div>
                     ))}
                 </AnimatePresence>
             </div>
        );
    };


    // --- Main Render ---
    return (
        <motion.div
            className="anon-letters-page-container"
            variants={pageVariants} initial="hidden" animate="visible"
        >
            {/* Header */}
             <header className="page-header letters-header">
                 <FiMail className="header-icon"/> {/* Changed icon */}
                <h2 className="page-title">Community Letters</h2>
                <p className="page-subtitle">Share thoughts anonymously and offer support to others. Be kind and respectful.</p>
            </header>

             {/* Submission Form - Conditionally Rendered */}
             {user ? (
                <motion.form
                    className="submission-form-container"
                    onSubmit={(e)=>{e.preventDefault(); submitLetter();}} // Use form onSubmit
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    layout
                >
                    <textarea
                        placeholder="Share your thoughts, feelings, or experiences here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        aria-label="New anonymous letter content"
                        disabled={isSubmittingLetter}
                        maxLength={2000}
                    />
                    <motion.button
                        type="submit" // Submit button for form
                        className="aura-button primary post-letter-button"
                        disabled={!content.trim() || isSubmittingLetter}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                        {isSubmittingLetter ? <><FiLoader className="mini-spinner"/> Posting...</> : "Post Letter"}
                    </motion.button>
                </motion.form>
            ) : (
                 <p className="login-prompt">Please log in to post, reply, or like letters.</p>
            )}

             {/* Action Error Display */}
             <AnimatePresence>
                {actionError && (
                    <motion.div className="error-message action-error" variants={errorVariants} initial="hidden" animate="visible" exit="exit" role="alert">
                        <FiAlertCircle/> {actionError}
                    </motion.div>
                )}
             </AnimatePresence>

            {/* Content Area - Render based on loading/error state */}
            <div className="letters-content-area">
                 <div className="controls-header">
                    <h3 className="section-heading">Recent Letters</h3>
                    {/* TODO: Add Sort Select UI component here */}
                 </div>
                 {renderContent()}
                 {/* TODO: Add Pagination Controls component here */}
            </div>
        </motion.div>
    );
};

export default AnonymousLetters;