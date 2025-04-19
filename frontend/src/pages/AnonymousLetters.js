import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./AnonymousLetters.css";

const API_URL = "http://localhost:8080/api/anonymous-letters";

const AnonymousLetters = () => {
    const [letters, setLetters] = useState([]);
    const [content, setContent] = useState("");
    const [sort, setSort] = useState("latest");
    const [page, setPage] = useState(1);
    const [replyContent, setReplyContent] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // ✅ Fetch Logged-in User
    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user.email);
            } else {
                setCurrentUser(null);
            }
        });
    }, []);

    // ✅ Fetch Letters
    const fetchLetters = async () => {
        try {
            const response = await axios.get(API_URL, { params: { sort, page, limit: 5 } });
            setLetters(response.data);
        } catch (error) {
            console.error("Error fetching letters:", error);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, [sort, page]);

    // ✅ Submit Letter
    const submitLetter = async () => {
        if (!content.trim() || !currentUser) return;
        try {
            await axios.post(API_URL, { content, username: currentUser });
            setContent("");
            fetchLetters();
        } catch (error) {
            console.error("Error submitting letter:", error);
        }
    };

    // ✅ Submit Reply (FIXED)
    // ✅ Submit Reply (FIXED)
    const submitReply = async (id) => {
        const replyText = replyContent[id]?.trim();  // ✅ Ensure text is not empty
        if (!replyText) {
            alert("Reply content is required");
            return;
        }
    
        try {
            await axios.post(`${API_URL}/${id}/reply`, {
                content: replyText,  // ✅ Correct key name
                username: currentUser,  // ✅ Ensure username is sent
            });
    
            setReplyContent({ ...replyContent, [id]: "" });  // ✅ Clear input after sending
            fetchLetters();  // ✅ Refresh letters
        } catch (error) {
            console.error("Error submitting reply:", error.response?.data || error);
            alert(error.response?.data?.error || "Failed to post reply.");
        }
    };
    


    // ✅ Like a Letter
    const likeLetter = async (id) => {
        try {
            await axios.post(`${API_URL}/${id}/like`, { username: currentUser });
            fetchLetters();
        } catch (error) {
            console.error("Error liking letter:", error);
        }
    };

    // ✅ Delete Letter (Only Author Can Delete)
    const deleteLetter = async (id, username) => {
        if (currentUser !== username) {
            alert("You can only delete your own letter!");
            return;
        }
        try {
            await axios.delete(`${API_URL}/${id}`, { data: { username: currentUser } });
            alert("Letter deleted successfully!");
            fetchLetters();
        } catch (error) {
            console.error("Error deleting letter:", error);
            alert("Failed to delete letter.");
        }
    };

    return (
        <div className="letters-container">
            <h2>📩 Anonymous Letters</h2>

            {/* Letter Submission Form */}
            <div className="letter-form">
                <textarea 
                    placeholder="Write your anonymous message..." 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                />
                <button onClick={submitLetter} disabled={!currentUser}>Submit</button>
            </div>

            {/* Sorting Option */}
            <div className="sort-options">
                <label>Sort by:</label>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="latest">Latest</option>
                    <option value="popular">Most Liked</option>
                </select>
            </div>

            {/* Display Letters */}
            <div className="letters-list">
                {letters.map((letter) => (
                    <div key={letter.id} className="letter-card">
                        <p><strong>@{letter.username || "Anonymous"}</strong></p>
                        <p>{letter.content}</p>
                        <div className="letter-footer">
                            <span>{new Date(letter.timestamp._seconds * 1000).toLocaleString()}</span>
                            <button onClick={() => likeLetter(letter.id)}>❤️ {letter.likes || 0}</button>
                            {/* Show Delete Button Only for Author */}
                            {letter.username === currentUser && (
                                <button className="delete-btn" onClick={() => deleteLetter(letter.id, letter.username)}>
                                    ❌ Delete
                                </button>
                            )}
                        </div>

                        {/* Reply Section */}
                        <div className="reply-section">
                            <textarea 
                                placeholder="Write a reply..." 
                                value={replyContent[letter.id] || ""} 
                                onChange={(e) => setReplyContent({ ...replyContent, [letter.id]: e.target.value })} 
                            />
                            <button onClick={() => submitReply(letter.id)}>Reply</button>
                        </div>

                        {/* Display Replies */}
                        <div className="replies">
                            {letter.replies?.map((reply, index) => (
                                <p key={index} className="reply">
                                    <strong>@{reply.username}:</strong> {reply.content}
                                </p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnonymousLetters;
