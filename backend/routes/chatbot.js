// backend/routes/chatbot.js
const express = require("express");
const { body, validationResult } = require('express-validator');
// Make sure the path to chatbotHelper is correct relative to this file
const { detectEmotion, getBotReply } = require("../utils/chatbotHelper");

// --- Initialize Router ---
const router = express.Router();

// --- Helper Function for Input Validation Errors ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("Chatbot Validation Errors:", errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Validation Rules ---
const chatbotValidationRules = [
    body('message')
        .trim()
        .notEmpty().withMessage('Message cannot be empty.')
        .isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters.')
        // Avoid escaping here usually, as chatbot responses might need formatting later
        // Consider more sophisticated sanitization if complex input is expected
];

/**
 * @route   POST /api/chatbot
 * @desc    Process user message, detect emotion, and return a bot reply.
 * @access  Public (No auth needed for simple chatbot)
 */
router.post(
    "/",
    chatbotValidationRules, // Apply validation
    handleValidationErrors, // Handle validation errors
    (req, res, next) => { // No 'async' needed for this simple version
        try {
            // Validation passed, get the message from the request body
            const { message } = req.body;

            // Use helper functions from chatbotHelper
            const detectedEmotion = detectEmotion(message);
            const botReply = getBotReply(detectedEmotion);

            console.log(`🤖 Chatbot: Received: "${message}", Detected: ${detectedEmotion}`);

            // Send the response back to the client
            res.status(200).json({
                reply: botReply,
                emotion: detectedEmotion, // Send detected emotion back
            });

        } catch (error) {
            console.error("Error in chatbot route handler:", error);
            next(error); // Pass unexpected errors to the global error handler
        }
    }
);

// --- Export Router ---
module.exports = router;