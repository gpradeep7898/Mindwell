// frontend/src/pages/ChatBot.js
// Page component for the AI Assistant feature.
// Renders the AIChatAssistant component.
// !! No changes needed here to switch backend from OpenAI to Gemini !!

import React from 'react';
import AIChatAssistant from '../components/AIChatAssistant'; // Import the chat component
import './ChatBot.css'; // Import optional page-level styles

const ChatBot = () => {
    return (
        // Container for page-level layout (style in ChatBot.css)
        <div className="chatbot-page-container">

            {/* Optional Page Header (Customize or remove) */}
            <header className="page-header chatbot-header">
                {/* You can add an icon here too */}
                <h2 className="page-title">MindWell AI Assistant</h2>
                <p className="page-subtitle">
                    Chat about your well-being, explore coping strategies, or ask questions. Remember, I'm an AI and cannot provide medical advice.
                </p>
            </header>

            {/* Render the main AI Chat Assistant component */}
            {/* This handles the actual chat interface and logic */}
            <AIChatAssistant />

        </div>
    );
};

export default ChatBot;