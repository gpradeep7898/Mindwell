// frontend/src/pages/Dashboard.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth, db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc,
    orderBy
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrashAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { FiZap } from "react-icons/fi";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Import Custom Components & Utils
import MoodLineGraph from '../components/MoodLineGraph';
import MicroBreakOverlay from '../components/MicroBreakOverlay';
import { getRandomExercise } from '../utils/microBreaks';
import GlobalLoader from "../components/GlobalLoader";

import "./Dashboard.css";
import './CalendarOverrides.css';

// --- Skeleton Loader for Entry Cards ---
const SkeletonEntryCard = () => (
    <div className="skeleton-entry-card" aria-hidden="true">
        <div className="skeleton-line skeleton-mood"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text short"></div>
        <div className="skeleton-line skeleton-timestamp"></div>
    </div>
);

// --- Helper Function to compare dates (ignoring time) ---
// *** DEFINE HELPER FUNCTION HERE (Outside Component Scope) ***
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    // Compare year, month, and day
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};
// --- END OF HELPER FUNCTION ---


// --- Dashboard Component ---
const Dashboard = () => {
    // --- State Variables ---
    const [user, authLoading, authError] = useAuthState(auth);
    const [mood, setMood] = useState("");
    const [journal, setJournal] = useState("");
    const [entries, setEntries] = useState([]); // All entries fetched from Firestore
    const [loadingEntries, setLoadingEntries] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [notification, setNotification] = useState(null);
    const notificationTimeoutRef = useRef(null);
    const [showMicroBreak, setShowMicroBreak] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [calendarValue, setCalendarValue] = useState(new Date()); // Controls the displayed month
    const [selectedDate, setSelectedDate] = useState(null); // Holds the date clicked on the calendar

    // --- Fetch Entries Effect ---
    useEffect(() => {
        if (authLoading || !user) {
             setLoadingEntries(false);
             setEntries([]); // Clear entries if user logs out or on initial load without user
            return;
        }
        setLoadingEntries(true);
        const entriesCollectionRef = collection(db, "entries");
        // Query to get entries for the current user, ordered by timestamp descending
        const q = query(
            entriesCollectionRef,
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc") // Get newest first for the list view
        );
        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedEntries = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp // Keep Firestore timestamp object
            }));
            setEntries(fetchedEntries);
            setLoadingEntries(false); // Stop loading once data (or empty snapshot) arrives
        }, (error) => { // Handle errors during snapshot listening
            console.error("Error fetching entries with onSnapshot:", error);
            setNotification({ message: "Could not fetch your entries. Please refresh.", type: "error" });
            setLoadingEntries(false);
        });
        // Cleanup function: Unsubscribe from listener on unmount or user change
        return () => unsubscribe();
    }, [user, authLoading]); // Re-run effect when user or authLoading state changes

    // --- Handle Notification Timeout ---
    useEffect(() => {
        if (notificationTimeoutRef.current) { clearTimeout(notificationTimeoutRef.current); }
        if (notification) {
            notificationTimeoutRef.current = setTimeout(() => { setNotification(null); }, 4000);
        }
        return () => clearTimeout(notificationTimeoutRef.current); // Cleanup timeout on unmount
    }, [notification]); // Re-run when notification changes

    // --- Save Entry ---
    const handleSaveEntry = async () => {
        if (!user) { setNotification({ message: "You must be logged in to save entries.", type: "error" }); return; }
        if (!mood && !journal.trim()) { setNotification({ message: "Please select a mood or write something.", type: "error" }); return; }
        setLoadingSave(true); setNotification(null);
        try {
            await addDoc(collection(db, "entries"), {
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || "Anonymous User",
                mood: mood || "Not specified",
                journal: journal.trim(),
                timestamp: serverTimestamp(), // Use Firestore server timestamp
            });
            setMood(""); setJournal(""); // Clear form
            setNotification({ message: "Entry saved successfully!", type: "success" });
        } catch (error) {
            console.error("Error saving entry:", error);
            setNotification({ message: "Failed to save entry. Please try again.", type: "error" });
        } finally { setLoadingSave(false); } // Stop save loading indicator
    };

    // --- Delete Entry ---
    const handleDeleteEntry = async (id) => {
       if (!window.confirm("Are you sure you want to delete this entry? This action cannot be undone.")) return;
        setNotification(null); // Clear previous notification
        try {
            const entryDocRef = doc(db, "entries", id);
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
        if (!firebaseTimestamp?.toDate) return 'Pending...'; // Handle cases where timestamp might be null initially
        try {
             const date = firebaseTimestamp.toDate();
             // Format: Jan 5, 10:30 AM
             return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
             console.error("Error formatting timestamp:", e, firebaseTimestamp);
             return "Invalid date";
        }
    }, []); // No dependencies needed for this formatting function

    // --- Micro-Break Functions ---
    const startMicroBreak = useCallback(() => { setSelectedExercise(getRandomExercise()); setShowMicroBreak(true); document.body.style.overflow = 'hidden'; }, []);
    const closeMicroBreak = useCallback(() => { setShowMicroBreak(false); document.body.style.overflow = ''; }, []);

    // --- Prepare set of dates with entries for Calendar Highlighting ---
    const entryDates = useMemo(() => {
        const dates = new Set(); // Use Set for efficient O(1) lookups
        entries.forEach(entry => {
            if (entry.timestamp?.toDate) {
                const date = entry.timestamp.toDate();
                const dateString = date.toISOString().split('T')[0]; // Store as YYYY-MM-DD
                dates.add(dateString);
            }
        });
        return dates;
    }, [entries]); // Recalculate only when entries change

    // --- Function to determine CSS classes for Calendar tiles ---
    const tileClassName = useCallback(({ date, view }) => {
        let classes = [];
        if (view === 'month') { // Only apply in month view
            const dateString = date.toISOString().split('T')[0];
            // Check if day has an entry
            if (entryDates.has(dateString)) {
                classes.push('has-entry');
            }
            // Check if day is the selected date (use isSameDay helper)
            if (selectedDate && isSameDay(date, selectedDate)) {
                classes.push('is-selected');
            }
        }
        // Return joined classes or null if none
        return classes.length > 0 ? classes.join(' ') : null;
    }, [entryDates, selectedDate]); // Depend on entryDates AND selectedDate

    // --- Handler for Clicking a Day on the Calendar ---
    const handleDayClick = useCallback((date) => {
        // If the clicked date is already selected, deselect it (use isSameDay helper)
        if (selectedDate && isSameDay(date, selectedDate)) {
            setSelectedDate(null); // Set back to null to show overall trend
        } else {
            // Otherwise, select the newly clicked date
            setSelectedDate(date);
            // Optional: Navigate calendar view to the clicked date's month
            // setCalendarValue(date);
        }
    }, [selectedDate]); // Depend on selectedDate to correctly toggle

    // --- Filter Entries for the Graph Based on Selected Date ---
    const graphEntries = useMemo(() => {
        if (!selectedDate) {
            // No date selected: show all entries sorted chronologically for the graph
            return [...entries].sort((a, b) => (a.timestamp?.toDate()?.getTime() || 0) - (b.timestamp?.toDate()?.getTime() || 0));
        } else {
            // Date selected: filter entries for that specific day (use isSameDay helper)
            return entries
                .filter(entry => entry.timestamp?.toDate && isSameDay(entry.timestamp.toDate(), selectedDate))
                .sort((a, b) => (a.timestamp?.toDate()?.getTime() || 0) - (b.timestamp?.toDate()?.getTime() || 0)); // Sort entries within the day
        }
    }, [entries, selectedDate]); // Recalculate when entries or selectedDate changes

    // --- Framer Motion Variants ---
    const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
    const sectionVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
    const entryVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20, transition: { duration: 0.2 } } };
    const buttonVariants = { hover: { scale: 1.05, transition: { type: "spring", stiffness: 300 } }, tap: { scale: 0.95 } };
    const notificationVariants = { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20, transition: { duration: 0.3 } } };

    // --- Render Logic: Loading/Error States ---
    if (authLoading) return <GlobalLoader message="Loading dashboard..." />;
    if (authError) return <GlobalLoader message={`Authentication Error: ${authError.message}. Please refresh or re-login.`} />;
    if (!user) return <GlobalLoader message="Please log in to view the dashboard." />;

    // --- Determine Graph Heading based on selection ---
    const graphHeading = selectedDate
        ? `Mood on ${selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` // Format selected date
        : "Your Overall Mood Trend"; // Default title

    // --- Render Component UI ---
    return (
        <> {/* Fragment for Overlay */}
            <div className="dashboard-container">
                <motion.div
                    className="dashboard-card"
                    variants={cardVariants} initial="hidden" animate="visible" layout
                >
                    {/* Notification Banner */}
                    <AnimatePresence>
                        {notification && (
                            <motion.div className={`notification-banner ${notification.type}`} variants={notificationVariants} initial="hidden" animate="visible" exit="exit" role="alert" aria-live="assertive">
                                {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                                <span>{notification.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Greeting */}
                    <h2 className="dashboard-greeting">Welcome, <span className="user-name">{user.displayName || user.email?.split('@')[0] || "User"}!</span></h2>
                    <p className="dashboard-subtitle">How are you feeling today?</p>

                    {/* Micro-Break Button */}
                    <motion.button className="aura-button secondary micro-break-trigger" onClick={startMicroBreak} variants={buttonVariants} whileHover="hover" whileTap="tap"><FiZap /> <span>Mindful Moment</span></motion.button>

                    {/* Input Sections */}
                    <motion.div className="input-section" variants={sectionVariants} layout>
                        <div className="input-group">
                            <label htmlFor="mood-select">Select your mood</label>
                            <select id="mood-select" value={mood} onChange={(e) => setMood(e.target.value)} className="mood-select" disabled={loadingSave}>
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
                                {/* Add other moods consistent with moodMapping.js */}
                            </select>
                        </div>
                    </motion.div>
                    <motion.div className="input-section" variants={sectionVariants} layout>
                        <div className="input-group">
                            <label htmlFor="journal-entry">Reflect on your day (optional)</label>
                            <textarea id="journal-entry" value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Write down your thoughts, feelings, or anything on your mind..." rows={4} aria-label="Journal Entry Text Area" disabled={loadingSave}></textarea>
                        </div>
                    </motion.div>

                    {/* Save Button */}
                    <motion.button className="aura-button primary save-entry-button" onClick={handleSaveEntry} variants={buttonVariants} whileHover="hover" whileTap="tap" disabled={loadingSave || (!mood && !journal.trim())} aria-disabled={loadingSave || (!mood && !journal.trim())}>{loadingSave ? "Saving..." : "Log Entry"}</motion.button>

                    {/* --- Insights Section (Vertical Layout) --- */}
                    <motion.div className="insights-section-vertical" variants={sectionVariants} layout>
                        {/* Mood Trend Graph */}
                        <div className="graph-container">
                             <h3 className="section-heading">{graphHeading}</h3>
                             {/* Show loading indicator if loading ALL entries AND no date is selected */}
                             {loadingEntries && graphEntries.length === 0 && !selectedDate ? (
                                 <div className="loading-message small-loader" style={{minHeight: '280px', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading mood history...</div>
                             ) : (
                                 // Render graph with either all or filtered entries
                                 <MoodLineGraph
                                     entries={graphEntries}
                                     width={600} // Adjust as needed
                                     height={280}
                                     // Add a key prop that changes: forces React to treat it as a new instance, ensuring D3 redraws correctly
                                     key={selectedDate ? selectedDate.toISOString() : 'all-entries'}
                                 />
                             )}
                             {/* Message if a day is selected but has no entries */}
                             {selectedDate && !loadingEntries && graphEntries.length === 0 && (
                                <p className="no-entries-for-day">No entries logged on this day.</p>
                             )}
                         </div>

                        {/* Entry Log Calendar */}
                        <div className="calendar-container">
                            <h3 className="section-heading">Entry Log Calendar</h3>
                            {/* Render Calendar only when user is loaded */}
                            {!authLoading && user && (
                                <Calendar
                                    onClickDay={handleDayClick} // Use the click handler
                                    value={calendarValue}      // Controls displayed month
                                    tileClassName={tileClassName} // Applies 'has-entry' and 'is-selected' classes
                                    maxDate={new Date()}        // Prevent future dates
                                    showNeighboringMonth={false} // Optional: Hide days from other months
                                    className="dashboard-calendar"
                                    aria-label="Calendar showing days with logged entries. Click a day to view its mood graph."
                                />
                            )}
                            {/* Placeholder while auth is loading */}
                            {authLoading && (
                                <div className="loading-message small-loader" style={{minHeight: '280px', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading calendar...</div>
                            )}
                         </div>
                    </motion.div>
                    {/* --- End Insights Section --- */}

                    {/* Recent Entries List Section */}
                    {/* Display this list regardless of calendar selection */}
                    <motion.div className="entries-section" layout variants={sectionVariants}>
                        <h3 className="entries-heading" id="entries-label">Recent Reflections</h3>
                        <div className="entry-list-container" aria-labelledby="entries-label" aria-busy={loadingEntries}>
                            {/* Show skeleton only on initial load of ALL entries */}
                            {loadingEntries && entries.length === 0 ? (
                                <div className="skeleton-container" aria-hidden="true">
                                    {[1, 2, 3].map(i => <SkeletonEntryCard key={i} />)}
                                </div>
                            ) : entries.length > 0 ? (
                                // Render the list of entries (fetched newest first)
                                <ul className="entry-list">
                                    <AnimatePresence initial={false}>
                                        {entries.map((entry) => (
                                            <motion.li key={entry.id} className="entry-card" variants={entryVariants} initial="hidden" animate="visible" exit="exit" layout>
                                                <div className="entry-content">
                                                    <span className="entry-mood">{entry.mood}</span>
                                                    {entry.journal && <p className="entry-text">{entry.journal}</p>}
                                                    <span className="entry-timestamp">{formatTimestampForList(entry.timestamp)}</span>
                                                </div>
                                                <motion.button className="delete-button" title="Delete entry" whileHover={{ scale: 1.1, color: 'var(--color-error)' }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteEntry(entry.id)} aria-label={`Delete entry from ${formatTimestampForList(entry.timestamp)}`}>
                                                    <FaTrashAlt />
                                                </motion.button>
                                            </motion.li>
                                        ))}
                                    </AnimatePresence>
                                </ul>
                            ) : (
                                // Show message only if not loading and no entries exist AT ALL
                                !loadingEntries && <p className="no-entries-message">Your recent reflections will appear here once you log them.</p>
                            )}
                        </div>
                    </motion.div>

                </motion.div> {/* End dashboard-card */}
            </div> {/* End dashboard-container */}

            {/* Micro-Break Overlay */}
            <MicroBreakOverlay
                isVisible={showMicroBreak}
                onClose={closeMicroBreak}
                exercise={selectedExercise}
            />
        </> // End Fragment
    );
};

export default Dashboard;