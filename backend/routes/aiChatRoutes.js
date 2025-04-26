// backend/routes/aiChatRoutes.js
// Updated Route to handle interactions with the Google Gemini API

const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); // Import Google Generative AI library
const router = express.Router();

// --- Load environment variables (essential for API key) ---
require('dotenv').config();

// --- Configure Google Generative AI Client ---
let genAI;
let geminiModel;
let isGoogleAIConfigured = false;
const MODEL_NAME = "gemini-1.5-pro-latest"; // Use the appropriate Gemini model

if (!process.env.GOOGLE_API_KEY) {
    // Log a critical warning if the API key is missing
    console.error("*****************************************************");
    console.error("FATAL WARNING: GOOGLE_API_KEY is not set in .env file.");
    console.error("AI Chat functionality will be DISABLED until the key is added.");
    console.error("*****************************************************");
} else {
    try {
        genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: MODEL_NAME });
        isGoogleAIConfigured = true;
        console.log(`✅ Google Generative AI Client Initialized Successfully with model: ${MODEL_NAME}.`);
    } catch (error) {
        console.error("❌ ERROR: Failed to initialize Google Generative AI client:", error.message);
        // Keep isGoogleAIConfigured as false
    }
}

// --- Safety Settings (Customize as needed) ---
// Refer to Google AI documentation for details on these settings
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Define the POST route for chat messages ---
router.post('/', async (req, res) => {
    // 1. Check if Google AI was configured correctly
    if (!isGoogleAIConfigured || !geminiModel) {
        console.error("[AI Chat Route Error]: Google AI client not configured. Check API key.");
        return res.status(503).json({ error: 'AI service is temporarily unavailable or not configured.' });
    }

    // 2. Extract user message
    const { message } = req.body;

    // 3. Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
    }

    // 4. System Prompt/Instruction for Gemini
    // Gemini often works better with instructions at the start of the user prompt
    // or through multi-turn chat history. We'll prepend instructions here.
    // Note: Gemini doesn't have a dedicated "system" role like OpenAI in the basic API.
    const instructionPrompt = `You are "MindWell Assistant", a supportive, knowledgeable, and empathetic AI companion for the MindWell mental wellness platform. Your goal is to engage users in helpful conversations about mental well-being, offering encouragement, general information (like stress, anxiety, mindfulness), coping strategies (like breathing exercises, grounding), and resources within MindWell (mood tracking, journaling, etc.). Maintain a warm, positive, non-judgmental tone. Keep responses relatively concise and easy to understand.
    **IMPORTANT SAFETY RULES:**
    - You are NOT a therapist or medical professional. DO NOT give diagnoses or medical advice.
    - If a user discusses serious distress, self-harm, suicidal thoughts, or seems in crisis, you MUST clearly state your limitations as an AI and strongly recommend seeking immediate professional help (e.g., "I cannot provide emergency help, but please reach out to a crisis hotline like [example hotline number/name] or emergency services immediately.") Do not attempt crisis intervention.
    - Decline requests for inappropriate content or topics outside mental wellness.
    - Do not ask for personal information.

    Now, please respond helpfully and safely to the following user message:`;

    // Combine instruction and user message
    const fullPrompt = `${instructionPrompt}\n\nUser: ${message}`;

    try {
        console.log(`[AI Chat] Processing message for Gemini: "${message.substring(0, 50)}..."`);

        // 5. Call the Google Gemini API
        // For simple Q&A, generateContent is sufficient. For chat history, use startChat().
        const result = await geminiModel.generateContent(
             fullPrompt,
             // Pass safety settings if needed (optional but recommended)
             // safetySettings
        );

        // 6. Extract the response text
        const response = await result.response; // Get the response object
        const aiResponseText = response.text()?.trim(); // Get the text content

        // 7. Validate the response
        if (!aiResponseText) {
             // Check if it was blocked due to safety or other reasons
             const blockReason = response.promptFeedback?.blockReason;
             const safetyRatings = response.candidates?.[0]?.safetyRatings;
             console.error("[AI Chat Error]: Received empty or invalid content from Gemini API.");
             if (blockReason) {
                 console.error(`[AI Chat Error]: Gemini blocked prompt. Reason: ${blockReason}`);
                 throw new Error(`My response was blocked due to safety settings (${blockReason}). Please rephrase your message or contact support if you believe this is an error.`);
             }
             if (safetyRatings) {
                 console.error("[AI Chat Error]: Gemini safety ratings:", JSON.stringify(safetyRatings));
             }
             throw new Error("AI assistant did not return a valid response.");
        }

        console.log(`[AI Chat] Sending Gemini response: "${aiResponseText.substring(0, 70)}..."`);

        // 8. Send the successful response back to the frontend
        res.status(200).json({ response: aiResponseText });

    } catch (error) {
        // 9. Handle errors
        console.error("[AI Chat Route Error]: Error processing chat request with Gemini:", error);
        console.error("[AI Chat Gemini Error Details]:", error.message || error);

        const clientErrorMessage = error.message.includes("blocked due to safety settings")
           ? error.message // Send the specific block reason message
           : 'Sorry, I encountered an issue while processing your request. Please try again.';

        res.status(500).json({ error: clientErrorMessage });
    }
});

module.exports = router; 