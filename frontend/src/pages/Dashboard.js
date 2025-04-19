// frontend/src/pages/Dashboard.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../services/firebaseConfig"; // Correct path to firebase config
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot, // For real-time updates
    serverTimestamp, // For server-generated timestamps
    deleteDoc,
    doc,
    orderBy // To order fetched entries
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
// Icons
import { FaTrashAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { FiZap } from "react-icons/fi"; // Icon for Micro-Break Button

// Import Custom Components & Utils
import MoodConstellation from '../components/MoodConstellation';
import MicroBreakOverlay from '../components/MicroBreakOverlay';
import { getRandomExercise } from '../utils/microBreaks'; // Helper for micro-breaks
import GlobalLoader from "../components/GlobalLoader"; // Import loader

import "./Dashboard.css"; // Link to specific styles

// --- Skeleton Loader for Entry Cards ---
const SkeletonEntryCard = () => (
    <div className="skeleton-entry-card" aria-hidden="true">
        <div className="skeleton-line skeleton-mood"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text short"></div>
        <div className="skeleton-line skeleton-timestamp"></div>
    </div>
);

// --- Dashboard Component ---
const Dashboard = () => {
    // Auth state
    const [user, authLoading, authError] = useAuthState(auth);
    // Form state
    const [mood, setMood] = useState("");
    const [journal, setJournal] = useState("");
    // Data state
    const [entries, setEntries] = useState([]);
    const [loadingEntries, setLoadingEntries] = useState(true); // Separate loading for entries
    // UI state
    const [loadingSave, setLoadingSave] = useState(false);
    const [notification, setNotification] = useState(null); // { message: string, type: 'success' | 'error' }
    const notificationTimeoutRef = useRef(null);
    // Micro-Break state
    const [showMicroBreak, setShowMicroBreak] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);

    // --- Fetch Entries Effect (Real-time with onSnapshot) ---
    useEffect(() => {
        // Don't fetch if user is loading or not logged in
        if (authLoading || !user) {
             setLoadingEntries(false); // Stop loading if no user
             setEntries([]); // Clear entries if user logs out
            return;
        }

        setLoadingEntries(true); // Start loading when user is available
        const entriesCollectionRef = collection(db, "entries");
        // Query to get entries for the current user, ordered by timestamp descending (newest first for initial list render)
        const q = query(
            entriesCollectionRef,
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc") // Fetch newest first
        );

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedEntries = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                // Keep Firestore timestamp object for accurate sorting/processing later
                timestamp: doc.data().timestamp
            }));
            setEntries(fetchedEntries);
            setLoadingEntries(false); // Stop loading once data arrives
        }, (error) => { // Handle errors during snapshot listening
            console.error("Error fetching entries with onSnapshot:", error);
            setNotification({ message: "Could not fetch your entries. Please refresh.", type: "error" });
            setLoadingEntries(false);
        });

        // Cleanup function: Unsubscribe from listener when component unmounts or user changes
        return () => unsubscribe();

    }, [user, authLoading]); // Re-run effect when user or authLoading state changes


    // --- Handle Notification Timeout ---
    useEffect(() => {
        // Clear existing timeout if a new notification appears
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        // Set new timeout if there's a notification
        if (notification) {
            notificationTimeoutRef.current = setTimeout(() => {
                setNotification(null); // Clear notification after 4 seconds
            }, 4000);
        }
        // Cleanup timeout on unmount
        return () => clearTimeout(notificationTimeoutRef.current);
    }, [notification]);

    // --- Save Entry ---
    const handleSaveEntry = async () => {
        if (!user) {
            setNotification({ message: "You must be logged in to save entries.", type: "error" });
            return;
        }
        if (!mood && !journal.trim()) {
            setNotification({ message: "Please select a mood or write something.", type: "error" });
            return;
        }

        setLoadingSave(true);
        setNotification(null); // Clear previous notification

        try {
            // Add new document to 'entries' collection
            await addDoc(collection(db, "entries"), {
                userId: user.uid,
                // Use displayName from user object, fallback if unavailable
                userName: user.displayName || user.email?.split('@')[0] || "Anonymous User",
                mood: mood || "Not specified", // Use selected mood or default
                journal: journal.trim(), // Trim whitespace from journal entry
                timestamp: serverTimestamp(), // Use Firestore server timestamp
            });

            // Clear form after successful save
            setMood("");
            setJournal("");
            setNotification({ message: "Entry saved successfully!", type: "success" });

        } catch (error) {
            console.error("Error saving entry:", error);
            setNotification({ message: "Failed to save entry. Please try again.", type: "error" });
        } finally {
            setLoadingSave(false); // Stop save loading indicator
        }
    };

    // --- Delete Entry ---
    const handleDeleteEntry = async (id) => {
        // Optional: Confirmation dialog
        if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            return;
        }
        setNotification(null); // Clear previous notification

        try {
            // Get a reference to the specific document
            const entryDocRef = doc(db, "entries", id);
            // Delete the document
            await deleteDoc(entryDocRef);
            setNotification({ message: "Entry deleted.", type: "success" });
            // Real-time listener (onSnapshot) will automatically update the list UI

        } catch (error) {
            console.error("Error deleting entry:", error);
            setNotification({ message: "Could not delete entry. Please try again.", type: "error" });
        }
    };

    // --- Format Timestamp for Display List ---
    const formatTimestampForList = useCallback((firebaseTimestamp) => {
        // Check if timestamp exists and has the toDate method
        if (!firebaseTimestamp?.toDate) return 'Pending...'; // Show pending if timestamp not set yet
        try {
             const date = firebaseTimestamp.toDate();
             // Example format: Jan 5, 10:30 AM
             return date.toLocaleDateString(undefined, {
                 month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
             });
        } catch (e) {
             console.error("Error formatting timestamp:", e, firebaseTimestamp);
             return "Invalid date";
        }
    }, []); // No dependencies needed for this formatting function


     // --- Micro-Break Functions ---
    const startMicroBreak = useCallback(() => {
        setSelectedExercise(getRandomExercise()); // Get a random exercise from utils
        setShowMicroBreak(true); // Show the overlay
        document.body.style.overflow = 'hidden'; // Prevent background scroll when overlay is active
    }, []); // No dependencies needed

    const closeMicroBreak = useCallback(() => {
        setShowMicroBreak(false); // Hide the overlay
        document.body.style.overflow = ''; // Restore background scroll
    }, []);


    // --- Framer Motion Variants --- (Keep as defined before)
    const cardVariants = { /* ... */ };
    const sectionVariants = { /* ... */ };
    const entryVariants = { /* ... */ };
    const buttonVariants = { /* ... */ };
    const notificationVariants = { /* ... */ };

    // --- Render Logic ---

    // Show loader if authentication is still loading
    if (authLoading) {
        return <GlobalLoader message="Loading dashboard..." />;
    }
    // Handle auth errors (e.g., token expired during session)
    if (authError) {
         return <GlobalLoader message={`Authentication Error: ${authError.message}. Please refresh or re-login.`} />;
    }
    // Handle case where user is definitely not logged in (should be covered by ProtectedRoute, but belt-and-suspenders)
    if (!user) {
         return <GlobalLoader message="Please log in to view the dashboard." />;
    }


    // --- Render Component UI ---
    return (
        <> {/* Use Fragment to allow overlay to be outside main scroll flow */}
            <div className="dashboard-container">
                <motion.div
                    className="dashboard-card"
                    variants={cardVariants} initial="hidden" animate="visible" layout
                >
                    {/* Notification Banner */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div
                                className={`notification-banner ${notification.type}`}
                                variants={notificationVariants} initial="hidden" animate="visible" exit="exit"
                                role="alert" aria-live="assertive"
                            >
                                {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                <span>{notification.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Greeting */}
                    <h2 className="dashboard-greeting">
                        Welcome, <span className="user-name">{user.displayName || user.email?.split('@')[0] || "User"}!</span>
                    </h2>
                    <p className="dashboard-subtitle">How are you feeling today?</p>

                    {/* Micro-Break Trigger Button */}
                    <motion.button
                        className="aura-button secondary micro-break-trigger"
                        onClick={startMicroBreak}
                        variants={buttonVariants} whileHover="hover" whileTap="tap"
                    >
                        <FiZap /> <span>Mindful Moment</span>
                    </motion.button>

                    {/* Input Sections */}
                    <motion.div className="input-section" variants={sectionVariants} layout>
                        <div className="input-group">
                            <label htmlFor="mood-select">Select your mood</label>
                            <select
                                id="mood-select" value={mood} onChange={(e) => setMood(e.target.value)}
                                className="mood-select" disabled={loadingSave}
                            >
                                <option value="" disabled>-- How are you feeling? --</option>
                                <option value="Happy">Happy😊</option>
                                <option value="Content">Content🤔</option>
                                <option value="Okay">Okay🙂</option>
                                <option value="Grateful">Grateful😎</option>
                                <option value="Excited">Excited🤩</option>
                                <option value="Tired">Tired🫩</option>
                                <option value="Anxious">Anxious🫨</option>
                                <option value="Stressed">Stressed😓</option>
                                <option value="Sad">Sad😢</option>
                                {/* Add other moods as needed */}
                            </select>
                        </div>
                    </motion.div>
                    <motion.div className="input-section" variants={sectionVariants} layout>
                        <div className="input-group">
                            <label htmlFor="journal-entry">Reflect on your day (optional)</label>
                            <textarea
                                id="journal-entry" value={journal} onChange={(e) => setJournal(e.target.value)}
                                placeholder="Write down your thoughts, feelings, or anything on your mind..."
                                rows={4} aria-label="Journal Entry Text Area" disabled={loadingSave}
                            ></textarea>
                        </div>
                    </motion.div>

                    {/* Save Button */}
                    <motion.button
                        className="aura-button primary save-entry-button"
                        onClick={handleSaveEntry} variants={buttonVariants} whileHover="hover" whileTap="tap"
                        disabled={loadingSave || (!mood && !journal.trim())} // Disable if saving or nothing entered
                        aria-disabled={loadingSave || (!mood && !journal.trim())}
                    >
                        {loadingSave ? "Saving..." : "Log Entry"}
                    </motion.button>

                    {/* Mood Constellation Section */}
                    <motion.div className="insights-section" variants={sectionVariants} layout>
                        <h3 className="section-heading">Your Mood Constellation</h3>
                        {loadingEntries && entries.length === 0 ? ( // Show loader only if fetching initial data
                            <div className="loading-message small-loader" style={{height: '280px'}}>Loading mood history...</div>
                        ) : (
                            <MoodConstellation
                                // Pass entries sorted ASCENDING for the constellation timeline
                                entries={[...entries].sort((a, b) => a.timestamp?.toDate() - b.timestamp?.toDate())}
                                width={550} // Adjust width/height as needed for your layout
                                height={280}
                            />
                        )}
                    </motion.div>

                    {/* Recent Entries List Section */}
                    <motion.div className="entries-section" layout variants={sectionVariants}>
                        <h3 className="entries-heading" id="entries-label">Recent Reflections</h3>
                        <div className="entry-list-container" aria-labelledby="entries-label" aria-busy={loadingEntries}>
                            {loadingEntries && entries.length === 0 ? ( // Show skeleton only on initial load
                                <div className="skeleton-container" aria-hidden="true">
                                    {[1, 2, 3].map(i => <SkeletonEntryCard key={i} />)}
                                </div>
                            ) : entries.length > 0 ? (
                                <ul className="entry-list">
                                    {/* Render entries directly (they are fetched newest first) */}
                                    <AnimatePresence initial={false}>
                                        {entries.map((entry) => (
                                            <motion.li
                                                key={entry.id} className="entry-card"
                                                variants={entryVariants} initial="hidden" animate="visible" exit="exit"
                                                layout // Animate layout changes
                                            >
                                                <div className="entry-content">
                                                    <span className="entry-mood">{entry.mood}</span>
                                                    {entry.journal && <p className="entry-text">{entry.journal}</p>}
                                                    <span className="entry-timestamp">{formatTimestampForList(entry.timestamp)}</span>
                                                </div>
                                                <motion.button
                                                     className="delete-button" title="Delete entry"
                                                     whileHover={{ scale: 1.1, color: 'var(--color-error)' }} whileTap={{ scale: 0.9 }}
                                                     onClick={() => handleDeleteEntry(entry.id)}
                                                     aria-label={`Delete entry from ${formatTimestampForList(entry.timestamp)}`}
                                                >
                                                    <FaTrashAlt />
                                                </motion.button>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            ) : (
                                // Show message only if not loading and no entries exist
                                !loadingEntries && <p className="no-entries-message">Your recent reflections will appear here once you log them.</p>
                            )}
                        </div>
                    </motion.div>

                </motion.div> {/* End dashboard-card */}
            </div> {/* End dashboard-container */}

            {/* --- Render Micro-Break Overlay --- */}
            <MicroBreakOverlay
                isVisible={showMicroBreak}
                onClose={closeMicroBreak}
                exercise={selectedExercise}
            />
        </> // End Fragment
    );
};

export default Dashboard;