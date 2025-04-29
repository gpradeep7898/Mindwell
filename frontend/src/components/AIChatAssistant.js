// frontend/src/components/AIChatAssistant.js
// Final Version: Includes Firebase Auth ID Token in API requests.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import { FiSend, FiMessageSquare, FiLoader, FiAlertTriangle } from 'react-icons/fi'; // Icons

// --- Import your custom authentication hook ---
// Verify this path points to your actual AuthContext file
import { useAuth } from '../context/AuthContext';

// --- Import component-specific styles ---
import './AIChatAssistant.css';

const AIChatAssistant = () => {
    // --- State Variables ---
    // Stores the conversation history
    const [messages, setMessages] = useState([
        // Initial greeting from the AI
        { sender: 'ai', text: 'Hello! I am the MindWell Assistant. How can I support your well-being today? Feel free to ask questions or just chat.' }
    ]);
    // Stores the current value of the text input field
    const [inputValue, setInputValue] = useState('');
    // Tracks if the component is waiting for a response from the backend
    const [isLoading, setIsLoading] = useState(false);
    // Unused 'error' state removed based on previous refinement

    // --- Refs ---
    // Ref attached to the bottom of the message list for auto-scrolling
    const messagesEndRef = useRef(null);

    // --- Get Authentication State ---
    // Uses the custom hook to access the current user object from context.
    // 'user' will be the Firebase Auth user object if logged in, otherwise null.
    const { currentUser: user } = useAuth(); // Renamed currentUser to user for internal consistency

    // --- Debugging Log ---
    // Logs the user state whenever it changes. Helps verify context is working.
    useEffect(() => {
        console.log("AIChatAssistant - Current User from useAuth:", user);
    }, [user]);

    // --- Auto-Scrolling Logic ---
    // Function to scroll the chat window to the bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    // Effect that triggers scrolling whenever the messages array updates
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- Send Message Handler ---
    // useCallback memoizes the function to prevent unnecessary re-creations
    const handleSendMessage = useCallback(async (e) => {
        // Prevent default form submission if triggered by form's onSubmit
        if (e) e.preventDefault();

        const userMessageText = inputValue.trim(); // Get trimmed message text
        // Exit early if message is empty or already waiting for a response
        if (!userMessageText || isLoading) return;

        // --- Authentication Check ---
        // Verify user is logged in before proceeding
        if (!user) {
             console.error("AIChat Error: Attempted to send message while not authenticated.");
             // Add an error message to the UI and stop
             setMessages(prev => [...prev, {
                 sender: 'ai',
                 text: 'Error: Please log in to use the AI Assistant.',
                 isError: true
                }]);
             return; // Do not proceed with API call
        }

        // --- Optimistic UI Update ---
        // Add the user's message to the chat immediately for responsiveness
        const newUserMessage = { sender: 'user', text: userMessageText };
        setMessages(prevMessages => [...prevMessages, newUserMessage]);
        setInputValue(''); // Clear the text input field
        setIsLoading(true); // Set loading state to true (shows spinner, disables input)

        // --- API Call to Backend ---
        try {
            // --- Get Firebase ID Token ---
            // Fetch the latest token to authenticate the request to *your* backend
            const idToken = await user.getIdToken();

            // Determine the backend API endpoint URL
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; // Use .env variable or default
            const endpoint = `${apiUrl}/api/ai-chat`;

            // --- Make the POST request using Axios ---
            const response = await axios.post(
                endpoint, // Your backend URL
                { message: userMessageText }, // Data payload (user's message)
                { // Axios config object
                    headers: {
                        // Include the authentication token in the Authorization header
                        'Authorization': `Bearer ${idToken}`
                    }
                }
            );

            // Extract the AI's response text from your backend's response structure
            const aiResponseText = response.data?.response;

            // Validate the response
            if (aiResponseText && typeof aiResponseText === 'string') {
                // Create the AI message object
                const newAiMessage = { sender: 'ai', text: aiResponseText };
                // Add the valid AI response to the chat messages state
                setMessages(prevMessages => [...prevMessages, newAiMessage]);
            } else {
                // Handle if the backend response format is not as expected
                console.error("Received unexpected response format from backend:", response.data);
                throw new Error("Sorry, I received an incomplete or unusual response from the server.");
            }

        } catch (err) {
            // --- Error Handling ---
            console.error("Error sending message to AI backend:", err);
            let displayErrorMessage; // Variable to hold user-facing error message

            // Check for specific authentication errors (401 Unauthorized, 403 Forbidden)
            if (err.response?.status === 401 || err.response?.status === 403) {
                displayErrorMessage = `Authentication failed (${err.response.status}). Your session may be invalid or expired. Please try logging out and logging back in.`;
            } else {
                 // Handle other errors (e.g., 500 Internal Server Error from backend, network issues)
                // Prioritize specific error message from backend if available
                displayErrorMessage = err.response?.data?.error
                                     || err.message // Fallback to Axios/network error message
                                     || 'Sorry, an unexpected error occurred while connecting to the assistant.';
            }
            // Add the error message directly to the chat interface for the user to see
            setMessages(prevMessages => [...prevMessages, {
                sender: 'ai',
                text: `Error: ${displayErrorMessage}`,
                isError: true // Flag for specific error styling
            }]);
        } finally {
            // --- End Loading State ---
            // Ensure the loading indicator is turned off regardless of success or failure
            setIsLoading(false);
        }
    // Dependencies for useCallback: Ensure the function has access to the latest state/props it needs
    }, [inputValue, isLoading, user]); // Depends on input value, loading state, and user object

    // --- Framer Motion Animation Variants ---
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    };

    // --- Render JSX ---
    return (
        <div className="ai-chat-container">
           {/* Chat Header */}
            <div className="chat-header">
                 <FiMessageSquare aria-hidden="true" style={{ marginRight: '8px' }}/> {/* Added margin */}
                 MindWell AI Assistant
            </div>

            {/* Message Display Area */}
            <div className="chat-messages">
                {/* AnimatePresence helps manage animations when items are added/removed */}
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index} // Using index as key; consider more stable IDs in production
                            className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'} ${msg.isError ? 'error-message' : ''}`}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            layout // Animates layout changes smoothly (e.g., when new messages push others)
                        >
                           {/* Display error icon if message has isError flag */}
                           {msg.isError && <FiAlertTriangle style={{ marginRight: '0.4em', verticalAlign: 'middle', display: 'inline-block' }} aria-hidden="true"/>}
                           {/* Split message by newline characters and render each line as a paragraph */}
                           {/* Render non-breaking space for empty lines to maintain spacing */}
                           {msg.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading Indicator (shown while waiting for AI response) */}
                {isLoading && (
                    <motion.div
                        className="message ai-message loading-indicator"
                        variants={messageVariants} initial="hidden" animate="visible" layout >
                        <FiLoader className="spinner" aria-hidden="true"/> Thinking...
                    </motion.div>
                )}
                {/* Empty div at the end: target for auto-scrolling */}
                <div ref={messagesEndRef} />
             </div>

            {/* Input Form Area */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                 <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    // Display appropriate placeholder based on login status
                    placeholder={user ? "Ask about wellness or just chat..." : "Please log in to chat"}
                    aria-label="Chat input"
                    // Disable input field if loading response OR if user is not logged in
                    disabled={isLoading || !user}
                    // Allow sending message by pressing Enter key (but not Shift+Enter)
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleSendMessage(e); // Trigger send on Enter press
                        }
                    }}
                />
                <button
                    type="submit"
                    // Disable button if loading OR input is empty/whitespace OR user is not logged in
                    disabled={isLoading || !inputValue.trim() || !user}
                    aria-label="Send message"
                    title="Send message" // Tooltip for accessibility
                >
                    {/* Show spinner icon inside button when loading */}
                    {isLoading ? <FiLoader className="spinner-inline" /> : <FiSend />}
                 </button>
            </form>

            {/* Disclaimer Text */}
             <p className="chat-disclaimer">
                MindWell Assistant is an AI and cannot provide medical advice or emergency support. It's not a replacement for professional help. If you are in crisis, please contact emergency services.
             </p>
         </div>
     );
 };

export default AIChatAssistant;