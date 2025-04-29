
const express = require("express");
const admin = require("firebase-admin"); // Used for Firestore Timestamps, FieldValues etc.
const { body, param, query, validationResult } = require('express-validator');
// Ensure the path to authMiddleware is correct relative to this routes folder
const authMiddleware = require('./authMiddleware');
// Ensure the path to perspectiveHelper (now using Gemini) is correct (likely needs '../')
const { analyzeText } = require('../utils/perspectiveHelper'); // This now calls the Gemini version

// --- Initialize Router ---
const router = express.Router();

// --- Helper Function for Input Validation Errors ---
// Middleware to check for validation errors and respond if any exist
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log validation errors for debugging
        console.warn(`Validation Errors (${req.method} ${req.originalUrl}):`, errors.array());
        // Respond with the first validation error found
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    // If no errors, proceed to the next middleware or route handler
    next();
};

// --- Validation Rules ---
// Rules for validating the body of a new letter post
const letterValidationRules = [
    body('content')
        .trim()
        .isLength({ min: 5, max: 2000 }).withMessage('Letter content must be between 5 and 2000 characters.')
        .escape(), // Basic sanitization against XSS
    body('title')
        .optional() // Title is optional
        .trim()
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters.')
        .escape(),
    body('mood')
        .optional() // Mood is optional
        .trim()
        .isLength({ max: 50 }).withMessage('Mood cannot exceed 50 characters.')
        .escape(),
];

// Rules for validating the body of a reply post
const replyValidationRules = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Reply must be between 1 and 500 characters.')
        .escape(),
];

// Rules for validating Firestore-like IDs passed as URL parameters (e.g., /:id)
const firestoreIdParamValidation = [
    param('id')
        .trim()
        .isAlphanumeric().withMessage('Invalid ID format provided.')
        .isLength({ min: 18, max: 28 }).withMessage('Invalid ID length.') // Common Firestore ID length
        .escape(),
];

// Rules for validating optional query parameters for fetching letters
const getLettersQueryValidation = [
    query('sort')
        .optional()
        .isIn(['latest', 'popular']).withMessage('Invalid sort option. Allowed values: "latest", "popular".')
        .escape(),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page number must be a positive integer.')
        .toInt(), // Convert validated string to integer
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limit must be an integer between 1 and 50.')
        .toInt(), // Convert validated string to integer
];


// --- Route Handlers ---

/**
 * @route   GET /api/anonymous-letters
 * @desc    Fetch anonymous letters with sorting and pagination
 * @access  Public
 */
router.get(
    "/",
    getLettersQueryValidation, // Apply query validation rules
    handleValidationErrors,   // Handle any validation errors
    async (req, res, next) => {
        // Initialize Firestore DB instance inside the handler
        let db;
        try {
            db = admin.firestore();
        } catch(e) {
            console.error("GET /letters - Firestore init error:", e);
            // Pass error to global handler using next()
            return next(new Error("Database service is unavailable."));
        }

        const lettersCollection = db.collection("anonymousLetters"); // Use your actual collection name

        try {
            // Get validated/sanitized query params or use defaults
            const sort = req.query.sort || 'latest';
            const page = req.query.page || 1;
            const limit = req.query.limit || 10;

            let firestoreQuery = lettersCollection; // Start with base collection reference

            // Apply sorting based on query parameter
            if (sort === "popular") {
                // Order by 'likes' descending, then by 'timestamp' descending as a tie-breaker
                firestoreQuery = firestoreQuery.orderBy("likes", "desc").orderBy("timestamp", "desc");
            } else { // Default to 'latest'
                firestoreQuery = firestoreQuery.orderBy("timestamp", "desc");
            }

            // Apply pagination logic
            const offset = (page - 1) * limit; // Calculate starting point
            const snapshot = await firestoreQuery.limit(limit).offset(offset).get();

            // Handle case where no documents are found
            if (snapshot.empty) {
                return res.status(200).json([]); // Return empty array, not an error
            }

            // Helper functions for formatting data consistently
            const formatTimestamp = (ts) => ts?.toDate ? ts.toDate().toISOString() : null;
            const formatUsername = (email) => email ? email.split('@')[0] : "Anonymous"; // Extract part before '@'

            // Map Firestore documents to response objects
            const letters = snapshot.docs.map((doc) => {
                const data = doc.data();
                // Ensure replies array exists and sort them newest first
                const sortedReplies = (Array.isArray(data.replies) ? data.replies : []).map(r => ({
                    content: r.content || '[Content missing]', // Default content
                    username: formatUsername(r.username),
                    timestamp: formatTimestamp(r.timestamp)
                })).sort((a, b) => (b.timestamp && a.timestamp) ? new Date(b.timestamp) - new Date(a.timestamp) : 0);

                // Construct the letter object sent to the client
                return {
                    id: doc.id,
                    title: data.title || "Untitled",
                    content: data.content,
                    mood: data.mood || "Neutral",
                    likes: data.likes || 0,
                    replyCount: sortedReplies.length, // Provide count explicitly
                    replies: sortedReplies, // Include the sorted replies array
                    timestamp: formatTimestamp(data.timestamp),
                    username: formatUsername(data.username), // Display formatted username
                    // CRITICAL: Do NOT send sensitive fields like authorUid or likedByUids
                };
             });

            res.status(200).json(letters); // Send the formatted letters array

        } catch (error) {
            console.error("Error fetching letters:", error);
            next(error); // Pass errors to the global error handler in server.js
        }
    }
);

/**
 * @route   POST /api/anonymous-letters
 * @desc    Submit a new anonymous letter (includes moderation using Gemini)
 * @access  Private (Requires Auth)
 */
router.post(
    "/",
    authMiddleware,           // 1. Verify user token
    letterValidationRules,    // 2. Validate request body structure/content
    handleValidationErrors,   // 3. Handle any validation errors
    async (req, res, next) => {
        // Initialize Firestore DB instance inside the handler
        let db; try { db = admin.firestore(); } catch(e) { return next(new Error("Database service unavailable.")); }

        const lettersCollection = db.collection("anonymousLetters");

        try {
            // Get validated request body data
            const { content, title, mood } = req.body;
            // Get authenticated user info from middleware
            const { uid, email } = req.user;

            // This check should technically be redundant if authMiddleware works, but safe to have
            if (!uid || !email) {
                 return res.status(401).json({ error: "Unauthorized: User details missing after authentication." });
            }

            // --- Moderation Step using Gemini ---
            console.log(`[Moderation - Gemini] Analyzing content for new letter by user ${uid}`);
            const analysisResult = await analyzeText(content); // Analyze the letter content

            // Check if the content was flagged by the Gemini moderation check
            if (analysisResult.flagged) {
                // --- UPDATED LOGGING ---
                let reason = analysisResult.errorMessage || 'Flagged by Gemini';
                if (analysisResult.details?.rawResponse) {
                    reason += ` (Response: ${analysisResult.details.rawResponse})`;
                     if (analysisResult.details?.warning) { reason += ` - ${analysisResult.details.warning}`; }
                     if (analysisResult.details?.safetyBlock) { reason += ` - Safety Block: ${analysisResult.details.safetyBlock}`; }
                }
                console.warn(`[Moderation - Gemini] BLOCKED new letter from ${uid}. Reason: ${reason}`);
                // --- End Updated Logging ---

                // Return a user-friendly error - DO NOT reveal specific reasons
                return res.status(400).json({
                     error: "Your submission could not be posted because it may violate community guidelines. Please review and edit your content to ensure it is respectful and supportive."
                    });
            }
            // Log if content passed moderation
            console.log(`[Moderation - Gemini] Content PASSED for new letter by user ${uid}.`);
            // --- End Moderation Step ---


            // --- Prepare data for Firestore ---
            console.log(`Submitting letter for user: ${email} (UID: ${uid})`);
            const newLetterData = {
                content, // Use validated/sanitized content
                title: title || "Untitled", // Use validated title or default
                mood: mood || "Neutral", // Use validated mood or default
                authorUid: uid, // Store the author's UID for ownership checks
                username: email, // Store the user's email (or preferred identifier)
                likes: 0, // Initialize likes count
                replies: [], // Initialize replies array
                timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
                likedByUids: [] // Initialize empty array to track who liked it
            };

            // --- Save to Firestore ---
            const newLetterRef = await lettersCollection.add(newLetterData);
            console.log(`Letter submitted successfully with ID: ${newLetterRef.id}`);

            // Respond with success status and the new letter's ID
            res.status(201).json({ message: "Letter posted successfully!", id: newLetterRef.id });

        } catch (error) {
            // Catch any errors during moderation or Firestore save
            console.error(`Error submitting letter for user ${req.user?.uid || 'UNKNOWN'}:`, error);
            next(error); // Pass to global error handler
        }
    }
);

/**
 * @route   POST /api/anonymous-letters/:id/like
 * @desc    Like or unlike a letter (toggle mechanism)
 * @access  Private (Requires Authentication)
 */
router.post(
    "/:id/like",
    authMiddleware,             // 1. Check authentication
    firestoreIdParamValidation, // 2. Validate the letter ID from the URL
    handleValidationErrors,     // 3. Handle any validation errors
    async (req, res, next) => {
        // Initialize Firestore DB instance inside the handler
        let db; try { db = admin.firestore(); } catch(e) { return next(new Error("Database service unavailable.")); }

        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id; // Validated letter ID
        const { uid } = req.user;       // Verified UID of the user performing the action

        // Should be redundant due to authMiddleware, but safe check
        if (!uid) return res.status(401).json({ error: "Unauthorized: User UID missing." });

        try {
            const letterRef = lettersCollection.doc(letterId);

            // Use a Firestore transaction for atomic read/write of like status
            const result = await db.runTransaction(async (transaction) => {
                const letterDoc = await transaction.get(letterRef);
                // If the letter doesn't exist, throw an error to abort transaction
                if (!letterDoc.exists) {
                    throw { statusCode: 404, message: "Letter not found" };
                }

                const letterData = letterDoc.data();
                // Get the array of users who liked it, default to empty array if missing
                const likedByUids = letterData.likedByUids || [];
                let message = ""; // Success message
                let newLikesCount = letterData.likes || 0; // Current likes count

                // --- Toggle Logic ---
                if (likedByUids.includes(uid)) {
                    // --- User already liked -> Unlike ---
                    console.log(`User ${uid} unliking letter ${letterId}.`);
                    // Atomically decrement 'likes' and remove UID from 'likedByUids'
                    transaction.update(letterRef, {
                        likes: admin.firestore.FieldValue.increment(-1),
                        likedByUids: admin.firestore.FieldValue.arrayRemove(uid)
                    });
                    message = "Letter unliked successfully.";
                    newLikesCount = Math.max(0, newLikesCount - 1); // Ensure count doesn't go below 0
                } else {
                    // --- User has not liked -> Like ---
                    console.log(`User ${uid} liking letter ${letterId}.`);
                    // Atomically increment 'likes' and add UID to 'likedByUids'
                    transaction.update(letterRef, {
                        likes: admin.firestore.FieldValue.increment(1),
                        likedByUids: admin.firestore.FieldValue.arrayUnion(uid)
                    });
                    message = "Letter liked successfully!";
                    newLikesCount += 1;
                }
                // Return data from the transaction (will be available in 'result' variable)
                return { message, likes: newLikesCount };
            });

            // If transaction completes successfully, send the result
            res.status(200).json({ message: result.message, likes: result.likes });

        } catch (error) {
            // Handle errors from the transaction or other issues
            console.error(`Error liking/unliking letter ${letterId} by user ${uid}:`, error);
            // Handle specific errors thrown within the transaction (e.g., 404)
            if (error.statusCode) {
                 return res.status(error.statusCode).json({ error: error.message });
            }
             // Handle potential Firestore transaction conflicts
             if (error.code === 'ABORTED' || error.code === 'FAILED_PRECONDITION' || error.code === 'UNAVAILABLE') {
                 return res.status(409).json({ error: 'Conflict: Could not update like status due to concurrent modification, please try again.' });
             }
            // Pass other unexpected errors to the global handler
            next(error);
        }
    }
);


/**
 * @route   POST /api/anonymous-letters/:id/reply
 * @desc    Add a reply to a specific letter (includes moderation using Gemini)
 * @access  Private (Requires Auth)
 */
router.post(
    "/:id/reply",
    authMiddleware,             // 1. Verify user token
    firestoreIdParamValidation, // 2. Validate letter ID from URL
    replyValidationRules,       // 3. Validate reply content from body
    handleValidationErrors,     // 4. Handle any validation errors
     async (req, res, next) => {
        // Initialize Firestore DB instance inside the handler
        let db; try { db = admin.firestore(); } catch(e) { return next(new Error("Database service unavailable.")); }

        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id; // Validated letter ID
        const { content } = req.body; // Validated and sanitized reply content
        const { uid, email } = req.user; // Authenticated user info

        // Redundant check, but safe
        if (!uid || !email) return res.status(401).json({ error: "Unauthorized: User details incomplete." });

        try {
            // --- Moderation Step for Reply using Gemini ---
            console.log(`[Moderation - Gemini] Analyzing reply content for letter ${letterId} by user ${uid}`);
            const analysisResult = await analyzeText(content); // Analyze reply content

            // Check if flagged
            if (analysisResult.flagged) {
                 // --- UPDATED LOGGING ---
                 let reason = analysisResult.errorMessage || 'Flagged by Gemini';
                 if (analysisResult.details?.rawResponse) {
                     reason += ` (Response: ${analysisResult.details.rawResponse})`;
                      if (analysisResult.details?.warning) { reason += ` - ${analysisResult.details.warning}`; }
                      if (analysisResult.details?.safetyBlock) { reason += ` - Safety Block: ${analysisResult.details.safetyBlock}`; }
                 }
                 console.warn(`[Moderation - Gemini] BLOCKED reply submission on letter ${letterId} from user ${uid}. Reason: ${reason}`);
                 // --- End Updated Logging ---

                 return res.status(400).json({
                      error: "Your reply could not be posted because it may violate community guidelines. Please review and edit your content to ensure it is respectful and supportive."
                 });
            }
            // Log success if passed
            console.log(`[Moderation - Gemini] Reply content PASSED for user ${uid} on letter ${letterId}.`);
            // --- End Moderation Step ---


            const letterRef = lettersCollection.doc(letterId);

            // Use a transaction to ensure the letter exists when adding the reply
            await db.runTransaction(async (transaction) => {
                 const letterDoc = await transaction.get(letterRef);
                 // If letter was deleted before reply was added
                 if (!letterDoc.exists) {
                     throw { statusCode: 404, message: "Cannot reply: Letter not found" };
                 }

                 // Create the new reply object to be stored
                 const newReply = {
                     content, // Use the validated and moderated content
                     authorUid: uid, // Store UID of the replier
                     username: email, // Store email (or identifier) of replier
                     timestamp: admin.firestore.Timestamp.now() // Use server timestamp
                 };

                 // Atomically add the new reply to the 'replies' array field
                 transaction.update(letterRef, {
                     replies: admin.firestore.FieldValue.arrayUnion(newReply)
                     // Optional: Increment a reply counter field if you have one
                     // replyCount: admin.firestore.FieldValue.increment(1)
                 });
            });

            console.log(`Reply added successfully to letter ${letterId} by user ${uid}`);
            // Send success response
            res.status(200).json({ message: "Reply added successfully!" });

        } catch (error) {
            console.error(`Error adding reply to letter ${letterId} by user ${uid}:`, error);
            // Handle specific errors like 404 from transaction
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            // Handle potential transaction errors
             if (error.code === 'ABORTED' || error.code === 'FAILED_PRECONDITION' || error.code === 'UNAVAILABLE') {
                 return res.status(409).json({ error: 'Conflict: Could not add reply due to concurrent modification, please try again.' });
             }
            // Pass other errors to global handler
            next(error);
        }
    }
);


router.delete(
    "/:id",
    authMiddleware,             // 1. Verify user token
    firestoreIdParamValidation, // 2. Validate letter ID
    handleValidationErrors,     // 3. Handle validation errors
    async (req, res, next) => {
        // Initialize Firestore DB instance inside the handler
        let db; try { db = admin.firestore(); } catch(e) { return next(new Error("Database service unavailable.")); }

        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id; // Validated ID
        const { uid } = req.user; // UID of user attempting deletion

        // Redundant check
        if (!uid) return res.status(401).json({ error: "Unauthorized: User UID missing." });

        try {
            const letterRef = lettersCollection.doc(letterId);
            const letterDoc = await letterRef.get();

            // Check if the letter actually exists
            if (!letterDoc.exists) {
                return res.status(404).json({ error: "Letter not found" });
            }

            const letterData = letterDoc.data();

            // --- Authorization Check ---
            // Ensure the UID from the token matches the authorUid stored on the letter
            if (letterData.authorUid !== uid) {
                console.warn(`Forbidden DELETE attempt: User ${uid} tried to delete letter ${letterId} owned by ${letterData.authorUid}`);
                // Return 403 Forbidden if user is not the author
                return res.status(403).json({ error: "Forbidden: You are not authorized to delete this letter." });
            }

            // --- Perform Deletion ---
            await letterRef.delete();
            console.log(`Letter ${letterId} deleted successfully by author ${uid}`);

            // Send success response
            res.status(200).json({ message: "Letter deleted successfully." });

        } catch (error) {
            console.error(`Error deleting letter ${letterId} by user ${uid}:`, error);
            next(error); // Pass error to global handler
        }
    }
);

module.exports = router; 