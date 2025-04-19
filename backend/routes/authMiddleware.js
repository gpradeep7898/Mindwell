// backend/routes/authMiddleware.js
const admin = require("firebase-admin");

/**
 * Express Middleware to verify Firebase ID token present in the Authorization header.
 * If the token is valid, it attaches the decoded user information (uid, email, etc.)
 * to the `req.user` object and calls `next()`.
 * If the token is invalid or missing, it sends a 401 or 403 response.
 */
const authMiddleware = async (req, res, next) => {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check if the header exists and follows the Bearer scheme
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn("Auth Middleware: No Bearer token found in Authorization header.");
        // Use 401 for missing credentials
        return res.status(401).json({ error: "Unauthorized: No token provided." });
    }

    // 3. Extract the token
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
         console.warn("Auth Middleware: Bearer token is empty.");
        return res.status(401).json({ error: "Unauthorized: Malformed token." });
    }


    // 4. Verify the token using Firebase Admin SDK
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // 5. Token is valid, attach user info to the request object
        // Ensure user has essential fields, provide defaults if necessary
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || null, // Use null if email might be missing
            // Add other relevant fields if available and needed
            // name: decodedToken.name,
            // picture: decodedToken.picture,
        };

        // Log successful verification (optional, can be verbose)
        // console.log(`Auth Middleware: User Authenticated - UID: ${req.user.uid}, Email: ${req.user.email}`);

        // 6. Proceed to the next middleware or route handler
        next();

    } catch (error) {
        // 7. Handle verification errors
        console.error("Auth Middleware: Error verifying Firebase ID token:", error.code, error.message);

        let statusCode = 401; // Default to Unauthorized
        let message = "Unauthorized: Invalid token.";

        // Check specific Firebase Auth error codes
        if (error.code === 'auth/id-token-expired') {
            message = "Unauthorized: Token has expired.";
            // Consider sending a specific code or header if frontend needs to refresh token
        } else if (error.code === 'auth/argument-error') {
             message = "Unauthorized: Token verification failed (argument error).";
             statusCode = 400; // Bad Request might be more appropriate
        } else if (error.code === 'auth/user-disabled') {
            message = "Unauthorized: User account is disabled.";
            statusCode = 403; // Forbidden is more appropriate here
        } else if (error.code?.startsWith('auth/')) {
            // Catch other potential auth errors from Firebase
             message = `Unauthorized: ${error.message}`;
        }
         // Handle network errors or other unexpected issues during verification
         else if (error.message.includes('Failed to fetch public keys')) {
              message = 'Internal Server Error: Could not verify token due to network issue.';
              statusCode = 500;
         }

        return res.status(statusCode).json({ error: message });
    }
};

// Export the middleware function
module.exports = authMiddleware;