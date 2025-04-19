import React, { useState } from "react";
import axios from "axios";
import "./ChatBot.css";

const ChatBot = () => {
    const [userInput, setUserInput] = useState("");
    const [messages, setMessages] = useState([]);

    const API_URL = "http://localhost:8080/api/chatbot"; // ✅ Correct // Update if backend is deployed

    const handleSendMessage = async () => {
        if (!userInput.trim()) return;

        const userMessage = { sender: "user", text: userInput };
        setMessages((prevMessages) => [...prevMessages, userMessage]);

        try {
            const response = await axios.post(API_URL, { message: userInput });

            const botMessage = {
                sender: "bot",
                text: response.data.reply,
                emotion: response.data.emotion,
            };

            botMessage.text = generateEmotionResponse(botMessage.emotion, botMessage.text);
            setMessages((prevMessages) => [...prevMessages, botMessage]);
        } catch (error) {
            console.error("Error communicating with chatbot:", error);
            const errorMessage = { sender: "bot", text: "I'm having trouble responding. Try again later. 💙" };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }

        setUserInput("");
    };

    const generateEmotionResponse = (emotion, responseText) => {
        const responses = {
            sad: "I'm really sorry you're feeling this way. You're not alone, and things will get better. 💙",
            lonely: "Feeling lonely can be tough, but remember that you matter. Reach out to someone or do something you enjoy. 💖",
            disappointed: "It's okay to feel this way. You are strong, and better days are ahead. ✨",
            anxious: "I understand this can be stressful. Try to take deep breaths and focus on one step at a time. 🌿",
            afraid: "Fear is a natural feeling, but you are stronger than you think. Take it step by step. 🛡️",
            devastated: "That sounds really tough. I'm here for you, and you are not alone. 💕",
            embarrassed: "It’s okay, everyone has embarrassing moments. Don’t be too hard on yourself! 😊",
            ashamed: "We all make mistakes, but they don’t define you. You’re still worthy and amazing. 💪",
            apprehensive: "Feeling unsure is okay. Believe in yourself, and take things one step at a time. 🌟",
            angry: "I hear your frustration. Sometimes venting helps—want to talk more about it? 🗣️",
            joyful: "That’s fantastic! I'm so happy for you! Keep enjoying the moment. 😊",
            hopeful: "Hope keeps us going! Stay positive and believe in yourself. 🌟",
            excited: "That’s awesome! Tell me more about what’s making you excited! 🎉",
            grateful: "It’s wonderful to appreciate the good things in life. Gratitude makes everything better! 🙏",
            nostalgic: "Memories can be powerful. It’s nice to reminisce about the good times. 💭",
        };
        return responses[emotion] || responseText;
    };

    return (
        <div className="chatbot-container">
            <h2>💬 AI ChatBot</h2>
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                        <p>{msg.text}</p>
                    </div>
                ))}
            </div>
            <div className="chat-input">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button onClick={handleSendMessage}>Send</button>
            </div>
        </div>
    );
};

export default ChatBot;
