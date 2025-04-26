// frontend/src/components/AIChatAssistant.js
// Handles the AI Chat UI and logic.
// !! No changes needed here to switch backend from OpenAI to Gemini !!
// It interacts with the consistent /api/ai-chat endpoint.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMessageSquare, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import './AIChatAssistant.css'; // Ensure this CSS file exists and is styled

const AIChatAssistant = () => {
    // State for messages: Array of { sender: 'user' | 'ai', text: string, isError?: boolean }
    const [messages, setMessages] = useState([
        // Initial welcome message (can be adjusted)
        { sender: 'ai', text: 'Hello! I am the MindWell Assistant, powered by advanced AI. How can I help you with your well-being today?' }
    ]);
    // State for the text input field
    const [inputValue, setInputValue] = useState('');
    // State to track if the AI is currently responding
    const [isLoading, setIsLoading] = useState(false);
    // State to hold any general error messages from the API call (optional display)
    const [error, setError] = useState(null);

    // Ref to the bottom of the message list for auto-scrolling
    const messagesEndRef = useRef(null);

    // Function to scroll the message list to the bottom smoothly
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Effect to scroll down whenever the messages array changes
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Function to handle sending a message (triggered by form submission or Enter key)
    const handleSendMessage = useCallback(async (e) => {
        if (e) e.preventDefault(); // Prevent default form submission if event exists

        const userMessageText = inputValue.trim();
        // Don't proceed if the message is empty or currently loading
        if (!userMessageText || isLoading) return;

        // --- Frontend Update (Optimistic UI) ---
        const newUserMessage = { sender: 'user', text: userMessageText };
        setMessages(prevMessages => [...prevMessages, newUserMessage]); // Add user message
        setInputValue(''); // Clear the input field
        setIsLoading(true); // Show loading indicator
        setError(null); // Clear previous general errors

        // --- Backend API Call ---
        try {
            // Construct the backend API endpoint URL
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081'; // Use env variable or fallback
            const endpoint = `${apiUrl}/api/ai-chat`; // Consistent endpoint

            // Make the POST request to YOUR backend
            const response = await axios.post(endpoint, {
                message: userMessageText // Send the user's message
            });

            // Extract the AI's response text from YOUR backend's response
            const aiResponseText = response.data?.response;

            // Validate the response
            if (aiResponseText && typeof aiResponseText === 'string') {
                const newAiMessage = { sender: 'ai', text: aiResponseText };
                // Add the AI's message to the state
                setMessages(prevMessages => [...prevMessages, newAiMessage]);
            } else {
                // Handle cases where the response structure from *your* backend is unexpected
                console.error("Received unexpected response format from backend:", response.data);
                throw new Error("Sorry, I received an unusual response. Please try again.");
            }

        } catch (err) {
            // Handle errors during the API call to *your* backend
            console.error("Error sending message to AI backend:", err);
            // Determine the error message to display
            const errorMessage = err.response?.data?.error || // Prefer backend error message
                                 err.message || // Fallback to Axios error message
                                 'Sorry, I encountered an error connecting to the assistant. Please check your connection or try again later.';
            setError(errorMessage); // Set general error state (optional display)
            // Add a specific error message directly into the chat flow
            setMessages(prevMessages => [...prevMessages, {
                sender: 'ai', // Show error as if it's from the AI system
                text: `Error: ${errorMessage}`,
                isError: true // Flag for specific styling
            }]);
        } finally {
            // --- End Loading State ---
            setIsLoading(false); // Hide loading indicator regardless of success/failure
        }
    }, [inputValue, isLoading]); // Dependencies

    // Framer Motion variants for messages
    const messageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <div className="ai-chat-container">
            {/* Chat Header */}
            <div className="chat-header">
                <FiMessageSquare aria-hidden="true"/> MindWell AI Assistant
            </div>

            {/* Message Display Area */}
            <div className="chat-messages">
                <AnimatePresence initial={false}>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index} // Consider more stable keys if messages can be deleted/reordered
                            className={`message ${msg.sender === 'user' ? 'user-message' : 'ai-message'} ${msg.isError ? 'error-message' : ''}`}
                            variants={messageVariants}
                            initial="hidden"
                            animate="visible"
                            layout // Smooth layout animations
                        >
                           {/* Render text, handling errors and newlines */}
                           {msg.isError && <FiAlertTriangle style={{ marginRight: '0.3em', verticalAlign: 'bottom' }} aria-hidden="true"/>}
                           {msg.text.split('\n').map((line, i) => <p key={i}>{line || '\u00A0'}</p>)} {/* Render empty lines */}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isLoading && (
                    <motion.div
                        className="message ai-message loading-indicator"
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        layout
                    >
                        <FiLoader className="spinner" aria-hidden="true"/> Thinking...
                    </motion.div>
                )}

                {/* Empty div used as a target for auto-scrolling */}
                <div ref={messagesEndRef} />
            </div>

             {/* Optional: Display general fetch error outside the chat flow */}
             {/* {error && !isLoading && <div className="chat-error-banner">{error}</div>} */}

            {/* Input Form */}
            <form className="chat-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about wellness or just chat..."
                    aria-label="Chat input"
                    disabled={isLoading} // Disable input while AI is processing
                    onKeyPress={(e) => { // Allow sending with Enter key (but not Shift+Enter)
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleSendMessage(e);
                        }
                    }}
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()} // Disable if loading or input is empty/whitespace
                    aria-label="Send message"
                >
                    {/* Show loader icon in button when loading */}
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