// backend/utils/chatbotHelper.js

// --- Emotion Keywords ---
// (Feel free to refine these keywords for better accuracy)
const emotionKeywords = {
    sad: ["sad", "depressed", "lonely", "down", "unhappy", "crying", "miserable", "heartbroken", "grief"],
    anxious: ["anxious", "nervous", "stressed", "worried", "overwhelmed", "panic", "tense", "scared", "uneasy"],
    afraid: ["afraid", "fear", "terrified", "frightened", "petrified"],
    disappointed: ["disappointed", "let down", "discouraged", "unsatisfied"],
    devastated: ["devastated", "shattered", "destroyed"],
    embarrassed: ["embarrassed", "ashamed", "awkward", "humiliated"],
    ashamed: ["ashamed", "guilty", "regretful", "remorse"],
    apprehensive: ["apprehensive", "uncertain", "hesitant", "doubtful"],
    angry: ["angry", "frustrated", "mad", "furious", "irritated", "annoyed", "pissed"],
    joyful: ["happy", "joyful", "excited", "thrilled", "ecstatic", "elated", "glad"],
    hopeful: ["hopeful", "optimistic", "positive", "looking forward"],
    content: ["content", "satisfied", "at peace", "calm", "relaxed", "okay"],
    impressed: ["impressed", "amazed", "astonished", "wowed"],
    nostalgic: ["nostalgic", "missing", "memories", "reminiscing"],
    grateful: ["grateful", "thankful", "appreciative", "blessed"],
    proud: ["proud", "accomplished", "fulfilled"],
    // Add more emotions and keywords as needed
    neutral: [] // Keep neutral as a fallback
};

// --- Emotion-Based Responses ---
// (Tailor these responses to fit the app's voice)
const responses = {
    sad: "I hear that you're feeling sad. It's okay to feel this way, please know you're not alone in it. 💙",
    anxious: "It sounds like anxiety might be present. Try taking a slow, deep breath, just focusing on the sensation of air entering and leaving your body. 🌿",
    afraid: "Feeling afraid can be really intense. Remember to be kind to yourself through this. Is there anything specific causing the fear?",
    disappointed: "It's completely understandable to feel disappointed when things don't go as hoped. Allow yourself to feel it. ✨",
    devastated: "That sounds incredibly difficult and painful. Please be gentle with yourself right now. I'm here to listen. 💕",
    embarrassed: "Feeling embarrassed is uncomfortable, but it happens to everyone. Try not to dwell on it too much. 😊",
    ashamed: "Feelings of shame can be heavy. Remember, mistakes don't define your worth. You deserve kindness, especially from yourself. 💪",
    apprehensive: "It's natural to feel apprehensive about the unknown. Take things one small step at a time. You can handle this. 🌟",
    angry: "It sounds like you're feeling angry, and that's a valid emotion. Sometimes expressing it helps – what's contributing to that feeling?",
    joyful: "That's wonderful to hear! It's great that you're feeling joyful. What's bringing you happiness right now? 😊",
    hopeful: "Holding onto hope is powerful. Keep that feeling close and believe in the possibilities ahead. 🌟",
    content: "It sounds like you're feeling content and at ease. That's a lovely state to be in. 🌿",
    impressed: "Wow, that sounds impressive! Tell me more about it if you'd like.",
    nostalgic: "Nostalgia can bring such a mix of feelings. What memory came to mind?",
    grateful: "That's wonderful. Focusing on gratitude can really shift perspective. What are you feeling thankful for? 🙏",
    proud: "You have every right to feel proud! Celebrate that accomplishment.",
    // Generic fallback
    neutral: "Thanks for sharing that with me. Is there anything else on your mind, or perhaps something specific you'd like to explore? 😊",
};

/**
 * Detects the most prominent emotion based on keywords in a message.
 * @param {string} message - The user's input message.
 * @returns {string} The detected emotion key (e.g., 'sad', 'anxious', 'neutral').
 */
const detectEmotion = (message) => {
    if (!message || typeof message !== 'string') {
        return "neutral";
    }
    const lowerCaseMessage = message.toLowerCase();
    // Optional: Prioritize potentially stronger emotions if multiple keywords match?
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        // Check if any keyword for this emotion is present in the message
        if (keywords.some((word) => lowerCaseMessage.includes(word))) {
            return emotion; // Return the first matched emotion
        }
    }
    return "neutral"; // Default if no keywords match
};

/**
 * Gets the appropriate bot reply based on the detected emotion.
 * @param {string} emotion - The detected emotion key.
 * @returns {string} The corresponding bot response.
 */
const getBotReply = (emotion) => {
    // Fallback to the neutral response if the detected emotion isn't in the responses object
    // or if emotion is null/undefined
    return responses[emotion] || responses["neutral"];
};

// Export the helper functions
module.exports = {
    detectEmotion,
    getBotReply,
};