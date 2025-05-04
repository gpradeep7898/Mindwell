// backend/server.js
// Final Corrected Version: Uses env var for storageBucket, includes userRoutes, rate limiter.

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const fs = require('fs');
require("dotenv").config(); // Load environment variables early

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- Step 1: Import Middleware & Route Handlers ---
console.log("--- DEBUG: Importing middleware & routes ---");
const authMiddleware = require('./routes/authMiddleware');
const letterRoutes = require("./routes/anonymousLetters");
const facilityRoutes = require("./routes/facilities");
const wellnessFeedRoutes = require("./routes/wellnessFeed");
const aiChatRoutes = require('./routes/aiChatRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes
console.log("--- DEBUG: Imports complete ---");
// --- End Imports ---

const app = express();
console.log("--- DEBUG: Express app initialized ---");

// --- Security Enhancements ---
app.use(helmet()); // Apply security headers
console.log("--- DEBUG: Helmet applied ---");

// --- CORS Configuration ---
// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL_PROD ? [process.env.FRONTEND_URL_PROD] : []) // Use configured prod URL from env
    : ["http://localhost:3000", "http://localhost:8081", "http://localhost:8082", "https://mindwell-frontend.onrender.com"]; // Allow multiple local ports + deployed frontend for dev flexibility

console.log(`--- DEBUG: Allowed CORS Origins based on NODE_ENV (${process.env.NODE_ENV}): ${allowedOrigins.join(', ')}`);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin OR from allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('This origin is not allowed by CORS policy.'));
        }
    },
    methods: "GET, POST, DELETE, PUT, OPTIONS", // Allowed HTTP methods
    allowedHeaders: "Content-Type, Authorization", // Allowed headers in requests
    credentials: true // Allow cookies/authorization headers
};
app.use(cors(corsOptions)); // Apply CORS middleware
app.options('*', cors(corsOptions)); // Enable pre-flight requests for all routes
console.log("--- DEBUG: CORS configured ---");

// --- Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 150, // Max requests per IP per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true, // Send standard RateLimit-* headers
    legacyHeaders: false, // Disable old X-RateLimit-* headers
});
app.use('/api/', apiLimiter); // Apply limiter to all /api/ routes
console.log("--- DEBUG: Rate limiter applied to /api/ ---");

// --- Body Parsers ---
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
console.log("--- DEBUG: Body parsers applied ---");

// --- Request Logging Middleware ---
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`REQ: ${req.method} ${req.originalUrl} - STATUS ${res.statusCode} [${duration}ms]`);
    });
    next();
});
console.log("--- DEBUG: Request logger applied ---");


// --- Firebase Admin Initialization ---
console.log("--- DEBUG: Initializing Firebase Admin SDK ---");
try {
    let serviceAccount;
    const serviceAccountEnvVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json"); // Local fallback path

    if (serviceAccountEnvVar) {
        console.log("--- DEBUG: Attempting Firebase Admin Init from Environment Variable (FIREBASE_SERVICE_ACCOUNT_JSON)...");
        try {
             serviceAccount = JSON.parse(serviceAccountEnvVar);
             console.log("--- DEBUG: Successfully parsed FIREBASE_SERVICE_ACCOUNT_JSON.");
        } catch (e) {
            console.error("ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable. Ensure it's valid JSON.");
            throw e; // Re-throw parsing error
        }
    } else if (fs.existsSync(serviceAccountPath)) {
        console.log("--- DEBUG: Init Firebase Admin SDK from local file (firebaseServiceAccount.json) - Local Dev Only ---");
        serviceAccount = require(serviceAccountPath);
    } else {
        // Critical error if no credentials found
        throw new Error("Firebase Admin SDK credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var for production or place firebaseServiceAccount.json in backend root for local dev.");
    }

    // --- >>> CORRECTED INITIALIZATION <<< ---
    // Get Storage Bucket from Environment Variable
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET; // Read from environment
    if (!storageBucket) {
      // If running in production and bucket isn't set, this is likely an error
      if (process.env.NODE_ENV === 'production') {
          console.warn("WARNING: FIREBASE_STORAGE_BUCKET environment variable is not set! Firebase Storage features will likely fail.");
      } else {
          console.log("--- DEBUG: FIREBASE_STORAGE_BUCKET environment variable not set (optional for local dev if not using storage).");
      }
       // You might want to throw an error here in production if storage is essential:
       // if (process.env.NODE_ENV === 'production') throw new Error("FIREBASE_STORAGE_BUCKET must be set in production environment!");
    }

    // Initialize Firebase Admin App
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Use the value from the environment variable
        storageBucket: storageBucket // <<< CORRECTED: Use variable
    });
    // --- >>> END CORRECTION <<< ---

    console.log(`✅ Firebase Admin SDK Initialized Successfully. Storage Bucket: ${storageBucket || 'Not Set'}.`);

} catch (error) {
    console.error("❌ CRITICAL ERROR: Firebase Admin SDK Initialization Failed:", error.message || error);
    process.exit(1); // Exit if Firebase Admin fails to initialize
}

// --- Step 2: Mount ALL API Routes ---
console.log("--- DEBUG: Mounting API Routes ---");

// Public routes
console.log("--- DEBUG: Mounting /api/facilities ---");
app.use("/api/facilities", facilityRoutes);
console.log("--- DEBUG: Mounting /api/wellness-feed ---");
app.use("/api/wellness-feed", wellnessFeedRoutes);
console.log("--- DEBUG: Mounting /api/anonymous-letters ---");
app.use("/api/anonymous-letters", letterRoutes);

// Protected routes
console.log("--- DEBUG: Mounting /api/ai-chat ---");
app.use("/api/ai-chat", authMiddleware, aiChatRoutes);
console.log("--- DEBUG: Mounting /api/user ---"); // Corrected log placement
app.use('/api/user', authMiddleware, userRoutes); // Mount user routes WITH auth middleware

// --- End API Routes ---

// --- Simple Root Route ---
app.get("/", (req, res) => { res.status(200).json({ message: "Welcome to the MindWell API! Stay Positive, Stay Healthy." }); });

// --- Health Check Route ---
app.get("/healthz", (req, res) => { res.status(200).send("OK"); });
console.log("--- DEBUG: Root and Health routes mounted ---");

// --- Step 3: Centralized Error Handling ---
// 404 Handler
console.log("--- DEBUG: Mounting 404 handler ---");
app.use((req, res, next) => {
    console.log(`--- DEBUG: 404 triggered for ${req.method} ${req.originalUrl} ---`);
    res.status(404).json({ error: `Resource Not Found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
console.log("--- DEBUG: Mounting global error handler ---");
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("💥 UNHANDLED ERROR DETECTED:", err.stack || err);
    const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500; // Default to 500 Internal Server Error

    // Send generic message in production unless error is explicitly marked as safe to expose
    const message = (process.env.NODE_ENV !== 'production' || err.expose === true)
         ? err.message
         : "An unexpected internal server error occurred.";

    res.status(statusCode).json({
        error: message,
        // Optionally include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack_trace: err.stack }),
    });
});
// --- End Error Handling ---

// --- Start the Server ---
const PORT = process.env.PORT || 8081; // Use Render's port or fallback
app.listen(PORT, () => {
    console.log(`\n🚀 MindWell Server listening on port ${PORT}`);
    console.log(`      Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`      Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL_PROD) {
        console.warn('      WARNING: Running in production mode, but FRONTEND_URL_PROD is not set! CORS might block frontend.');
    }
    console.log(`      News API Key Loaded: ${process.env.NEWS_API_KEY ? 'Yes' : 'NO!'}`);
    console.log(`      Google AI API Key Loaded: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'NO!'}`); // Assuming this is Gemini Key name
    const firebaseCredSource = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'ENV Var' : (fs.existsSync(path.join(__dirname, "firebaseServiceAccount.json")) ? 'File (Local Only)' : 'NOT FOUND');
    console.log(`      Firebase Credentials Source: ${firebaseCredSource}`);
    if (firebaseCredSource === 'NOT FOUND') console.error('      ERROR: Firebase credentials could not be located! Set FIREBASE_SERVICE_ACCOUNT_JSON.');
    console.log(`      Firebase Storage Bucket Configured: ${process.env.FIREBASE_STORAGE_BUCKET || 'Not Set!'}`);
    if (!process.env.FIREBASE_STORAGE_BUCKET) console.warn('      WARNING: Firebase Storage Bucket not set in env! Uploads will fail.');

    console.log("--- DEBUG: Server startup sequence complete ---");
});