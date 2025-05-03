// backend/routes/userRoutes.js
const express = require('express');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
// NOTE: Assuming authMiddleware is applied in server.js app.use('/api/user', authMiddleware, ...)
// If not, you MUST uncomment it here for routes that need protection.
// const authMiddleware = require('./authMiddleware');

// --- Configuration for Profile Picture Upload (Optional) ---
const multer = require('multer');
// Configure multer for memory storage (adjust limits as needed)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => { // Basic image type filter
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type: Only images are allowed.'), false);
        }
    },
});
// --- End Upload Config ---

const router = express.Router();
console.log("--- DEBUG: userRoutes.js file loaded and router created ---"); // <<< ADD LOG AT TOP

// Helper Middleware for Input Validation Errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn(`--- DEBUG: Validation Errors in userRoutes (${req.method} ${req.originalUrl}):`, errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Route to Update Display Name ---
const updateProfileRules = [
    body('displayName')
        .trim()
        .notEmpty().withMessage('Display name cannot be empty.')
        .isLength({ min: 3, max: 50 }).withMessage('Display name must be 3-50 characters.')
        .escape(), // Prevent basic XSS
];

console.log("--- DEBUG: Defining PUT /profile route ---"); // <<< ADD LOG
// This route path is RELATIVE to '/api/user' as mounted in server.js
router.put(
    '/profile',
    // authMiddleware, // Assuming applied in server.js
    updateProfileRules,
    handleValidationErrors,
    async (req, res, next) => {
        // This log is crucial to see if the request reaches the handler
        console.log(`--- DEBUG: Reached PUT /api/user/profile handler for user ${req.user?.uid} ---`);
        if (!req.user || !req.user.uid) {
             console.error("--- DEBUG: User details (req.user.uid) missing in PUT /profile handler! Check authMiddleware application.");
             // Send appropriate error if authMiddleware didn't run correctly
             return res.status(401).json({ error: "Authentication details missing."});
        }
        const { uid } = req.user;
        const { displayName } = req.body;

        try {
            console.log(`--- DEBUG: Attempting Firebase Auth update for UID: ${uid} with name: ${displayName}`);
            // Update Firebase Authentication record
            const updatedUserRecord = await admin.auth().updateUser(uid, {
                displayName: displayName
            });
            console.log(`--- DEBUG: Firebase Auth update successful for UID: ${uid}`);

            // Optional: Firestore update logic here...

            console.log(`User ${uid} updated displayName to: ${displayName}`);
            // Respond with success
            res.status(200).json({
                message: 'Profile updated successfully.',
                user: { displayName: updatedUserRecord.displayName }
            });

        } catch (error) {
            console.error(`--- DEBUG: Error inside PUT /api/user/profile handler for UID: ${uid} ---`, error);
            // Log specific Firebase errors if helpful
            if (error.code) console.error(`--- DEBUG: Firebase Error Code: ${error.code}`);
            // Pass error to global handler
            next(error);
        }
    }
);


// --- Route for Profile Picture Upload ---
console.log("--- DEBUG: Defining POST /profile-picture route ---"); // <<< ADD LOG
router.post(
    '/profile-picture',
    // authMiddleware, // Assuming applied in server.js
    upload.single('profilePic'), // Multer middleware for file handling
    (err, req, res, next) => { // Specific Multer error handler
        if (err instanceof multer.MulterError) {
             console.warn(`--- DEBUG: Multer error for user ${req.user?.uid}:`, err.code);
             if (err.code === 'LIMIT_FILE_SIZE') {
                 return res.status(400).json({ error: 'File is too large. Maximum size is 5MB.' });
             }
            return res.status(400).json({ error: `File upload error: ${err.message}` });
        } else if (err) {
            console.warn(`--- DEBUG: Non-Multer upload error for user ${req.user?.uid}:`, err.message);
            return res.status(400).json({ error: err.message || 'Invalid file.' });
        }
        next(); // Proceed if no Multer error
    },
    async (req, res, next) => {
        // This log confirms reaching the handler after Multer
        console.log(`--- DEBUG: Reached POST /api/user/profile-picture handler for user ${req.user?.uid} ---`);
         if (!req.user || !req.user.uid) {
             console.error("--- DEBUG: User details (req.user.uid) missing in POST /profile-picture handler! Check authMiddleware application.");
             return res.status(401).json({ error: "Authentication details missing."});
         }
        const { uid } = req.user;

        if (!req.file) {
            console.log("--- DEBUG: No file found in req.file for profile picture upload ---");
            return res.status(400).json({ error: 'No profile picture file uploaded.' });
        }

        try {
            console.log(`--- DEBUG: Setting up Firebase Storage upload for user ${uid}, filename: ${req.file.originalname}`);
            const bucket = admin.storage().bucket();
            const timestamp = Date.now();
            const fileName = `profile-pictures/${uid}/${timestamp}-${req.file.originalname.replace(/\s+/g, '_')}`;
            const fileUpload = bucket.file(fileName);
            const stream = fileUpload.createWriteStream({ metadata: { contentType: req.file.mimetype }, resumable: false });

            stream.on('error', (err) => {
                 console.error(`--- DEBUG: Stream error during profile picture upload for ${uid}:`, err);
                 next(new Error('Failed to process image upload stream.'));
            });

            stream.on('finish', async () => {
                console.log(`--- DEBUG: File upload stream finished for ${uid}, filename: ${fileName}`);
                try {
                    await fileUpload.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                    console.log(`--- DEBUG: File made public, URL: ${publicUrl}. Updating Firebase Auth for UID: ${uid}`);

                    const updatedUserRecord = await admin.auth().updateUser(uid, { photoURL: publicUrl });
                    console.log(`--- DEBUG: Firebase Auth photoURL update successful for UID: ${uid}`);

                    // Optional: Firestore update...

                    console.log(`User ${uid} updated photoURL to: ${publicUrl}`);
                    res.status(200).json({
                        message: 'Profile picture updated successfully.',
                        user: { photoURL: updatedUserRecord.photoURL }
                    });

                } catch (finalizeError) {
                    console.error(`--- DEBUG: Error finalizing profile picture update for ${uid} ---`, finalizeError);
                    next(new Error('Failed to update profile with new picture URL.'));
                }
            });

            stream.end(req.file.buffer);

        } catch (error) {
             console.error(`--- DEBUG: Error setting up profile picture upload for user ${uid} ---`, error);
             next(error);
        }
    }
);


// --- Password Change Reminder ---
// IMPORTANT: See frontend component for implementation using Client SDK

console.log("--- DEBUG: Exporting userRoutes router ---"); // <<< ADD LOG AT BOTTOM
module.exports = router;