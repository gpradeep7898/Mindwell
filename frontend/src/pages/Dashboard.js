import React, { useState, useEffect } from "react";
import { auth, db } from "../services/firebaseConfig";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion } from "framer-motion";
import { FaTrashAlt } from "react-icons/fa";
import "./Dashboard.css";

const Dashboard = () => {
    const [user] = useAuthState(auth);
    const [mood, setMood] = useState("");
    const [journal, setJournal] = useState("");
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, "entries"), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                setEntries(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleSaveEntry = async () => {
        if (!mood.trim() && !journal.trim()) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "entries"), {
                userId: user.uid,
                mood,
                journal,
                timestamp: serverTimestamp(),
            });
            setMood("");
            setJournal("");
        } catch (error) {
            console.error("Error saving entry:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEntry = async (id) => {
        try {
            await deleteDoc(doc(db, "entries", id));
        } catch (error) {
            console.error("Error deleting entry:", error);
        }
    };

    return (
        <div className="dashboard-container">
            <motion.div
                className="dashboard-card"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h2>
                    Welcome, <span className="username">{user?.displayName || "User"} 👋</span>
                </h2>

                <motion.div
                    className="mood-section"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    <h3>🌈 How are you feeling today?</h3>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                        <option value="">Select Mood</option>
                        <option value="Happy 😊">Happy 😊</option>
                        <option value="Okay 🙂">Okay 🙂</option>
                        <option value="Sad 😔">Sad 😔</option>
                        <option value="Stressed 😟">Stressed 😟</option>
                        <option value="Excited 🤩">Excited 🤩</option>
                    </select>
                </motion.div>

                <motion.div
                    className="journal-section"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                >
                    <h3>📝 Write Your Thoughts</h3>
                    <textarea
                        value={journal}
                        onChange={(e) => setJournal(e.target.value)}
                        placeholder="Share your thoughts here..."
                    ></textarea>
                </motion.div>

                <motion.button
                    className="save-btn"
                    onClick={handleSaveEntry}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "💾 Save Entry"}
                </motion.button>

                <motion.div
                    className="entries-section"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    <h3>📜 Recent Entries</h3>
                    {entries.length > 0 ? (
                        <ul>
                            {entries.map((entry) => (
                                <motion.li
                                    key={entry.id}
                                    className="entry-item"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="entry-content">
                                        <span>
                                            <strong>{entry.mood}</strong> - {entry.journal}
                                        </span>
                                        <motion.button
                                            className="delete-btn"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDeleteEntry(entry.id)}
                                        >
                                            <FaTrashAlt />
                                        </motion.button>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <p>No entries yet.</p>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
