// frontend/src/pages/Chatbot.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi"; // Send icon
import GlobalLoader from "../components/GlobalLoader"; // Use if needed for initial load
import "./ChatBot.css"; // Link to specific styles

const ChatBot = () => {
    const [userInput, setUserInput] = useState("");
    const [messages, setMessages] = useState([
        // Initial greeting message from the bot
        { id: 'initial-0', sender: "bot", text: "Hello! I'm here to listen and offer support. How are you feeling today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false); // State for bot "thinking" indicator
    const [error, setError] = useState(null); // State for API errors
    const messagesEndRef = useRef(null); // Ref to scroll chat to bottom
    const inputRef = useRef(null); // Ref for the input field to focus

    // Use environment variable for the backend API URL
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";
    const CHATBOT_API = `${API_URL}/api/chatbot`; // Specific endpoint

    // Function to scroll the chat window to the bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Effect to scroll down whenever new messages are added
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Effect to focus input when component mounts
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Function to handle sending a user message
    const handleSendMessage = async () => {
        const trimmedInput = userInput.trim();
        // Prevent sending empty messages or while the bot is processing
        if (!trimmedInput || isLoading) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Create a unique ID for the user message for React keys
        const userMessageId = `user-${Date.now()}-${Math.random()}`;
        const userMessage = { id: userMessageId, sender: "user", text: trimmedInput, time: timestamp };

        // Add user message immediately to the list
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setUserInput(""); // Clear input field
        setIsLoading(true); // Show bot typing indicator
        setError(null); // Clear previous errors

        try {
            // Send the message to the backend API
            const response = await axios.post(CHATBOT_API, { message: trimmedInput });

            const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Create a unique ID for the bot message
            const botMessageId = `bot-${Date.now()}-${Math.random()}`;
            const botMessage = {
                id: botMessageId,
                sender: "bot",
                text: response.data.reply || "I'm here to listen.", // Use reply from backend
                time: botTimestamp,
                emotion: response.data.emotion // Store emotion if needed for styling/logic
            };

            // Add bot's reply to the message list
            setMessages((prevMessages) => [...prevMessages, botMessage]);

        } catch (err) {
            console.error("Error communicating with chatbot API:", err);
            setError("Sorry, I couldn't connect right now. Please try again later."); // User-friendly error
            // Optionally add an error message to the chat
            const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const errorMessageId = `error-${Date.now()}-${Math.random()}`;
            const errorMessage = {
                id: errorMessageId,
                sender: "bot",
                text: "I seem to be having trouble connecting. Please try again in a moment.",
                time: errorTimestamp,
                isError: true // Flag for potential styling
            };
             setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
           setIsLoading(false); // Hide typing indicator regardless of success/failure
           // Refocus input field after bot responds
           inputRef.current?.focus();
        }
    };


    // --- Animation Variants ---
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
    };
     const pageVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
    };
     const inputAreaVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.2 } }
     };


    return (
        <motion.div
            className="chatbot-page-container"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
             <header className="page-header chat-header">
                 <span className="header-icon">💬</span>
                <h2 className="page-title">MindWell AI Assistant</h2>
                <p className="page-subtitle">A safe space to chat, reflect, and find support.</p>
            </header>

            <div className="chat-area-wrapper">
                {/* Chat Messages Area */}
                <div className="chat-messages-area" aria-live="polite">
                    {/* Animate presence for adding/removing messages */}
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id} // Use unique ID as key
                                className={`message-container ${msg.sender}-message-container`}
                                variants={messageVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden" // Can define exit animation if needed
                                layout // Animate layout changes smoothly
                            >
                                <div className={`message-bubble ${msg.sender}-bubble ${msg.isError ? 'error-bubble' : ''}`}>
                                    <p className="message-text">{msg.text}</p>
                                    {msg.time && <span className="message-time">{msg.time}</span>}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                     {/* Typing Indicator */}
                    {isLoading && (
                        <motion.div
                            className="message-container bot-message-container typing-indicator-container"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                             layout
                             aria-label="AI Assistant is typing"
                        >
                            <div className="message-bubble bot-bubble typing-indicator">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </motion.div>
                    )}
                    {/* Empty div at the end to ensure scrolling works */}
                    <div ref={messagesEndRef} style={{ height: '1px' }} />
                </div>

                 {/* Display API Error Message */}
                 {error && (
                     <div className="chat-error-message" role="alert">
                        {error}
                     </div>
                 )}


                {/* Chat Input Area */}
                <motion.div
                    className="chat-input-area"
                    variants={inputAreaVariants}
                    initial="hidden"
                    animate="visible"
                 >
                    <input
                        ref={inputRef} // Assign ref to input
                        type="text"
                        placeholder="Type your message here..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        // Send message on Enter key press
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={isLoading} // Disable input while bot is loading
                        aria-label="Chat message input"
                    />
                    <motion.button
                        onClick={handleSendMessage}
                        disabled={isLoading || !userInput.trim()} // Disable if loading or input empty
                        className="send-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Send message"
                    >
                        <FiSend /> {/* Send Icon */}
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ChatBot;