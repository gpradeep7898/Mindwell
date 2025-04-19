// backend/routes/anonymousLetters.js
const express = require("express");
const admin = require("firebase-admin");
const { body, param, query, validationResult } = require('express-validator');
// Make sure the path to authMiddleware is correct relative to this file
const authMiddleware = require('./authMiddleware');

// --- Initialize Router ---
const router = express.Router();

// --- Helper Function for Input Validation Errors ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`Validation Errors (${req.path}):`, errors.array());
        // Return the first error message
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Validation Rules ---
const letterValidationRules = [
    body('content')
        .trim()
        .isLength({ min: 5, max: 2000 }).withMessage('Letter must be between 5 and 2000 characters.')
        .escape(), // Basic XSS protection
];

const replyValidationRules = [
    body('content')
        .trim()
        .isLength({ min: 1, max: 500 }).withMessage('Reply must be between 1 and 500 characters.')
        .escape(), // Basic XSS protection
];

// Validate Firestore-like IDs in URL parameters
const firestoreIdParamValidation = [
    param('id')
        .trim()
        .isAlphanumeric().withMessage('Invalid letter ID format.') // Firestore IDs are alphanumeric
        .isLength({ min: 18, max: 28 }).withMessage('Invalid letter ID length.') // Typical Firestore ID length range
        .escape(),
];

// Validate query parameters for GET letters request
const getLettersQueryValidation = [
    query('sort')
        .optional()
        .isIn(['latest', 'popular']).withMessage('Invalid sort option. Use "latest" or "popular".')
        .escape(),
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
        .toInt(), // Convert to integer
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.')
        .toInt(), // Convert to integer
];

// --- Route Handlers ---

/**
 * @route   GET /api/anonymous-letters
 * @desc    Fetch anonymous letters with sorting and pagination
 * @access  Public
 */
router.get(
    "/",
    getLettersQueryValidation, // Validate query params first
    handleValidationErrors,   // Handle any validation errors
    async (req, res, next) => {
        const db = admin.firestore();
        const lettersCollection = db.collection("anonymousLetters");

        try {
            // Use validated and sanitized values or defaults
            const sort = req.query.sort || 'latest';
            const page = req.query.page || 1;
            const limit = req.query.limit || 10; // Default limit

            let query = lettersCollection;

            // Apply sorting
            if (sort === "popular") {
                // Order by likes first (desc), then timestamp (desc) as a tie-breaker
                query = query.orderBy("likes", "desc").orderBy("timestamp", "desc");
            } else { // Default to 'latest'
                query = query.orderBy("timestamp", "desc");
            }

            // Apply pagination
            const offset = (page - 1) * limit;
            const snapshot = await query.limit(limit).offset(offset).get();

            if (snapshot.empty) {
                return res.status(200).json([]); // Return empty array if no letters found
            }

            // Format letters for response
            const letters = snapshot.docs.map((doc) => {
                const data = doc.data();
                // Helper to safely format timestamps
                const formatTimestamp = (ts) => ts?.toDate ? ts.toDate().toISOString() : null; // Use ISO string for consistency
                const username = data.username ? data.username.split('@')[0] : "Anonymous"; // Extract username part

                return {
                    id: doc.id,
                    content: data.content,
                    likes: data.likes || 0,
                    replies: (data.replies || []).map(r => ({
                        content: r.content,
                        username: r.username ? r.username.split('@')[0] : "Anonymous",
                        timestamp: formatTimestamp(r.timestamp) // Ensure replies timestamp is also formatted
                    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)), // Sort replies newest first
                    timestamp: formatTimestamp(data.timestamp),
                    username: username,
                    // Do NOT send authorUid or likedByUids to the frontend unless absolutely necessary
                    // and even then, consider implications. For now, omit them.
                };
             });

            res.status(200).json(letters);

        } catch (error) {
            console.error("Error fetching letters:", error);
            next(error); // Pass error to global handler
        }
    }
);

/**
 * @route   POST /api/anonymous-letters
 * @desc    Submit a new anonymous letter
 * @access  Private (Requires Auth)
 */
router.post(
    "/",
    authMiddleware,           // Verify user token
    letterValidationRules,    // Validate request body
    handleValidationErrors,   // Handle validation errors
    async (req, res, next) => {
        const db = admin.firestore();
        const lettersCollection = db.collection("anonymousLetters");

        try {
            // Validated and sanitized content
            const { content } = req.body;
            // User info from authMiddleware
            const { uid, email } = req.user;

            if (!uid || !email) {
                 console.error("User UID or Email missing after auth middleware.");
                 // This shouldn't happen if authMiddleware is working, but good to check
                 return res.status(401).json({ error: "Unauthorized: User details incomplete." });
            }

            console.log(`Submitting letter for user: ${email} (UID: ${uid})`);

            // Prepare data for Firestore
            const newLetterData = {
                content,
                authorUid: uid,
                username: email, // Store full email for ownership checks, format on frontend
                likes: 0,
                replies: [],
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                likedByUids: [] // Initialize empty array to track likes
            };

            // Add the new letter to Firestore
            const newLetterRef = await lettersCollection.add(newLetterData);
            console.log(`Letter submitted successfully with ID: ${newLetterRef.id}`);

            // Return success response
            res.status(201).json({ message: "Letter posted successfully!", id: newLetterRef.id });

        } catch (error) {
            console.error("Error submitting letter:", error);
            next(error); // Pass error to global handler
        }
    }
);

/**
 * @route   POST /api/anonymous-letters/:id/like
 * @desc    Like or unlike a letter (toggle)
 * @access  Private (Requires Authentication)
 */
router.post(
    "/:id/like",
    authMiddleware,             // Check auth
    firestoreIdParamValidation, // Validate ID in URL
    handleValidationErrors,     // Handle validation errors
    async (req, res, next) => {
        const db = admin.firestore();
        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id; // Validated ID
        const { uid } = req.user;       // Verified UID of user acting

        if (!uid) {
             return res.status(401).json({ error: "Unauthorized: User UID missing." });
        }

        try {
            const letterRef = lettersCollection.doc(letterId);

            await db.runTransaction(async (transaction) => {
                const letterDoc = await transaction.get(letterRef);

                if (!letterDoc.exists) {
                    console.log(`Like/Unlike attempt failed: Letter ${letterId} not found.`);
                    // Throw a custom error object for the global handler
                    throw { statusCode: 404, message: "Letter not found" };
                }

                const letterData = letterDoc.data();
                const likedByUids = letterData.likedByUids || []; // Get likers array or default to empty
                let message = "";
                let newLikesCount = letterData.likes || 0;

                // --- Check if user already liked ---
                if (likedByUids.includes(uid)) {
                    // --- Unlike the letter ---
                    console.log(`User ${uid} unliking letter ${letterId}.`);
                    transaction.update(letterRef, {
                        likes: admin.firestore.FieldValue.increment(-1),
                        likedByUids: admin.firestore.FieldValue.arrayRemove(uid) // Remove UID from array
                    });
                    message = "Letter unliked successfully.";
                    newLikesCount--;
                } else {
                    // --- Like the letter ---
                    console.log(`User ${uid} liking letter ${letterId}.`);
                    transaction.update(letterRef, {
                        likes: admin.firestore.FieldValue.increment(1),
                        likedByUids: admin.firestore.FieldValue.arrayUnion(uid) // Add UID to array
                    });
                    message = "Letter liked successfully!";
                    newLikesCount++;
                }
                // Attach the final message to the transaction context if needed, or just send response later
                // Note: We can't directly send response from inside transaction
                // We'll store the message and send it after transaction commits
                return { message, likes: Math.max(0, newLikesCount) }; // Ensure likes don't go below 0
            });

            // If transaction completes without throwing
            // The return value of the transaction function is available here if needed
            // but we constructed the message inside
             res.status(200).json({ message: "Like status updated successfully." }); // Generic success is fine

        } catch (error) {
            console.error(`Error liking/unliking letter ${letterId} by user ${uid}:`, error);
            // Handle custom thrown error (like 404)
            if (error.statusCode) {
                 return res.status(error.statusCode).json({ error: error.message });
            }
             // Handle potential Firestore transaction errors
             if (error.code === 'ABORTED' || error.code === 'FAILED_PRECONDITION') {
                 return res.status(409).json({ error: 'Conflict: Could not update like status, please try again.' });
             }
            // Pass other unexpected errors to global handler
            next(error);
        }
    }
);


/**
 * @route   POST /api/anonymous-letters/:id/reply
 * @desc    Add a reply to a specific letter
 * @access  Private (Requires Auth)
 */
router.post(
    "/:id/reply",
    authMiddleware,             // Verify user
    firestoreIdParamValidation, // Validate letter ID
    replyValidationRules,       // Validate reply content
    handleValidationErrors,     // Handle validation errors
     async (req, res, next) => {
        const db = admin.firestore();
        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id;
        const { content } = req.body; // Validated and sanitized content
        const { uid, email } = req.user; // User info from middleware

        if (!uid || !email) {
             return res.status(401).json({ error: "Unauthorized: User details incomplete." });
        }

        try {
            const letterRef = lettersCollection.doc(letterId);

            // Use a transaction to ensure the letter still exists when we add the reply
            await db.runTransaction(async (transaction) => {
                 const letterDoc = await transaction.get(letterRef);
                 if (!letterDoc.exists) {
                     throw { statusCode: 404, message: "Letter not found" };
                 }

                 // Create the new reply object
                 const newReply = {
                     content,
                     authorUid: uid,
                     username: email, // Store full email
                     timestamp: admin.firestore.Timestamp.now() // Use Firestore Timestamp for consistency
                 };

                 // Atomically add the reply to the 'replies' array
                 transaction.update(letterRef, {
                     replies: admin.firestore.FieldValue.arrayUnion(newReply)
                 });
            });

            res.status(200).json({ message: "Reply added successfully!" });

        } catch (error) {
            console.error(`Error adding reply to letter ${letterId}:`, error);
            if (error.statusCode) { // Handle specific errors thrown from transaction
                return res.status(error.statusCode).json({ error: error.message });
            }
            next(error); // Pass other errors to global handler
        }
    }
);


/**
 * @route   DELETE /api/anonymous-letters/:id
 * @desc    Delete a specific letter
 * @access  Private (Requires Auth & Ownership)
 */
router.delete(
    "/:id",
    authMiddleware,             // Verify user
    firestoreIdParamValidation, // Validate letter ID
    handleValidationErrors,     // Handle validation errors
    async (req, res, next) => {
        const db = admin.firestore();
        const lettersCollection = db.collection("anonymousLetters");
        const letterId = req.params.id;
        const { uid } = req.user; // UID of the user attempting deletion

         if (!uid) {
             return res.status(401).json({ error: "Unauthorized: User UID missing." });
        }

        try {
            const letterRef = lettersCollection.doc(letterId);
            const letterDoc = await letterRef.get();

            // Check if letter exists
            if (!letterDoc.exists) {
                return res.status(404).json({ error: "Letter not found" });
            }

            const letterData = letterDoc.data();

            // Authorization Check: Ensure the user deleting is the author
            if (letterData.authorUid !== uid) {
                console.warn(`Forbidden DELETE attempt: User ${uid} tried to delete letter ${letterId} owned by ${letterData.authorUid}`);
                return res.status(403).json({ error: "Forbidden: You cannot delete this letter." });
            }

            // Delete the letter
            await letterRef.delete();
            console.log(`Letter ${letterId} deleted successfully by user ${uid}`);
            res.status(200).json({ message: "Letter deleted successfully." });

        } catch (error) {
            console.error(`Error deleting letter ${letterId}:`, error);
            next(error); // Pass error to global handler
        }
    }
);


// --- Export Router ---
module.exports = router;