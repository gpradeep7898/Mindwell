// frontend/src/pages/ChatBot.js
// Page component for the AI Assistant feature.
// Renders the AIChatAssistant component which handles the chat interface and logic.

import React from 'react';
import AIChatAssistant from '../components/AIChatAssistant'; // Import the main chat component
import './ChatBot.css'; // Optional: Import styles for page-level layout

/**
 * ChatBot Page
 * This component renders the main AI Assistant chat interface.
 * It imports and displays the AIChatAssistant component.
 */
const ChatBot = () => {
    return (
        // Container div for overall page layout and styling (defined in ChatBot.css)
        <div className="chatbot-page-container">

            {/* Optional: Page Header */}
            {/* You can customize or remove this header section */}
            <header className="page-header chatbot-header">
                <h2 className="page-title">MindWell AI Assistant</h2>
                <p className="page-subtitle">
                    Engage in supportive conversations about your well-being.
                    Remember, I'm an AI assistant and cannot provide medical advice or crisis support.
                </p>
            </header>

            {/* Render the AI Chat Assistant Component */}
            {/* All chat functionality is encapsulated within this component */}
            <div className="chat-component-wrapper"> {/* Optional wrapper for positioning */}
                <AIChatAssistant />
            </div>

        </div>
    );
};

export default ChatBot;