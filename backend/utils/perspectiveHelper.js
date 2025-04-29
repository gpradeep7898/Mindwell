// backend/utils/perspectiveHelper.js
// Updated: Uses Google Gemini API for content moderation

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
require('dotenv').config();

// --- Gemini Client Initialization ---
let genAI;
let geminiModel;
let gemini_init_error = null;

const API_KEY = process.env.GOOGLE_API_KEY;
// Use the same model as your chat assistant or potentially a cheaper/faster one if suitable
// For consistency now, let's assume the same one defined in aiChatRoutes:
const MODEL_NAME = "gemini-1.5-pro-latest"; // Or "gemini-1.0-pro" if that's what chat uses

// Basic safety settings for the moderation check itself (optional, can be stricter)
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];


if (!API_KEY) {
    gemini_init_error = "GOOGLE_API_KEY is not set in .env";
    console.error("*****************************************************");
    console.error(`MODERATION HELPER ERROR: ${gemini_init_error}`);
    console.error("Moderation will be skipped or fail safe.");
    console.error("*****************************************************");
} else {
    try {
        genAI = new GoogleGenerativeAI(API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings }); // Apply safety settings here too
        console.log(`✅ Google AI Client Initialized for Moderation (${MODEL_NAME}).`);
    } catch (error) {
        gemini_init_error = error.message || "Failed to initialize Google AI client";
        console.error("❌ ERROR initializing Google AI client for Moderation:", error);
        geminiModel = null;
    }
}

/**
 * Analyzes text using the Google Gemini API with a moderation prompt.
 * @param {string} text The text content to analyze.
 * @returns {Promise<{flagged: boolean, details: object|null, error?: boolean, errorMessage?: string}>} Result object.
 */
async function analyzeText(text) {
    // Check if Gemini client is available
    if (gemini_init_error || !geminiModel) {
        console.error(`Gemini client not available for moderation. Error: ${gemini_init_error || 'Client is null'}`);
        // Fail safe: block content if the moderation service isn't working
        return { flagged: true, error: true, errorMessage: "Moderation service unavailable.", details: null };
    }

    // Handle empty input
    if (!text || typeof text !== 'string' || text.trim() === '') {
        console.log("[Moderation - Gemini] Received empty text, skipping analysis.");
        return { flagged: false, details: null }; // Not flagged
    }

    // --- Define the Moderation Prompt ---
    // This is crucial. Instruct the model clearly and ask for a simple, parsable output.
    const moderationPrompt = `You are a content moderator. Analyze the following text based on standard community guidelines focusing on toxicity, hate speech, harassment, threats, insults, severe negativity, and other harmful content.

Respond ONLY with the single word 'FLAGGED' if the text violates these guidelines or is otherwise inappropriate for a supportive community forum.
Respond ONLY with the single word 'OK' if the text is acceptable.

Do not provide explanations or any other text.

Text to analyze:
---
${text}
---`;

    try {
        console.log(`[Moderation - Gemini] Analyzing text starting with: "${text.substring(0, 70)}..."`);

        // --- Call the Gemini API ---
        // Use generateContent for direct text generation based on the prompt
        const result = await geminiModel.generateContent(moderationPrompt);
        const response = await result.response;
        const responseText = response.text()?.trim().toUpperCase(); // Get text, trim, and uppercase for reliable comparison

        console.log(`[Moderation - Gemini] Raw response text: "${response.text()}", Parsed: "${responseText}"`);

        // --- Process the Response ---
        let isFlagged = false;
        let details = { rawResponse: responseText }; // Store raw response for debugging

        if (responseText === 'FLAGGED') {
            isFlagged = true;
            console.warn(`[Moderation - Gemini] Content FLAGGED by model response.`);
        } else if (responseText === 'OK') {
            isFlagged = false;
            console.log("[Moderation - Gemini] Content deemed OK by model response.");
        } else {
            // If the model didn't respond exactly as expected
            console.warn(`[Moderation - Gemini] Unexpected response: "${responseText}". Defaulting to FLAGGED.`);
            // Fail safe: If unsure, assume it's flagged.
            isFlagged = true;
            details.warning = "Unexpected response format from moderation model.";
        }

        // Check for safety blocks from Gemini itself (though the prompt is unlikely to trigger this)
         if (response.promptFeedback?.blockReason) {
            console.warn(`[Moderation - Gemini] Moderation check itself was blocked by Gemini safety filters: ${response.promptFeedback.blockReason}`);
            isFlagged = true; // Treat safety blocks as flagged content
            details.safetyBlock = response.promptFeedback.blockReason;
            details.safetyRatings = response.candidates?.[0]?.safetyRatings;
         }


        return {
            flagged: isFlagged,
            details: details,
        };

    } catch (error) {
        // --- Handle API Call Errors ---
        console.error("Error calling Google Gemini API for Moderation:", error);
        let errorMessage = "Moderation check failed.";

        // Basic error checking (add more detail if needed based on Gemini errors)
        if (error.message?.includes("API key not valid")) {
             errorMessage = "Moderation service configuration error (Invalid Google API Key?).";
        } else if (error.message?.includes("Quota") || error.toString().includes('429')) {
             errorMessage = "Moderation service temporarily unavailable (Quota/Rate Limit).";
        } else if (error.message?.includes(" Billing ") || error.message?.includes(" billing ")) {
            errorMessage = "Moderation service unavailable (Billing issue?).";
        } else if (error.response?.status >= 500) {
            errorMessage = "Moderation service temporarily unavailable (Google Server Error).";
        } else {
             errorMessage = `Moderation check failed: ${error.message || 'Unknown error'}`;
        }

        // Fail safe: always flag if an error occurs
        return { flagged: true, error: true, errorMessage: errorMessage, details: { rawError: error } };
    }
}

// Export only the analyzeText function
module.exports = { analyzeText };