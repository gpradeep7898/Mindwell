// backend/server.js
// Updated to check for Google Gemini API Key and mount the correct route

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const fs = require('fs');
require("dotenv").config(); // Load environment variables early

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- Step 1: Import relevant route handlers ---
const letterRoutes = require("./routes/anonymousLetters");
const facilityRoutes = require("./routes/facilities");
// const chatbotRoutes = require("./routes/chatbot"); // Disabled
const wellnessFeedRoutes = require("./routes/wellnessFeed");
const aiChatRoutes = require('./routes/aiChatRoutes'); // Ensure this points to the Gemini version now
// --- End Route Imports ---

const app = express();

// --- Security Enhancements ---
app.use(helmet()); // Sets various HTTP security headers

// --- CORS Configuration ---
// Determine allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL_PROD ? [process.env.FRONTEND_URL_PROD] : [])
    : ["http://localhost:3000", "http://localhost:8082", "http://localhost:8003", "http://localhost:8081"]; // Ensure your dev origins are listed

// Define CORS options
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET, POST, DELETE, PUT, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true
};

// Apply CORS middleware
app.use(cors(corsOptions));
// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));

// --- Rate Limiting ---
// Apply rate limiting to all API routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs (adjust as needed)
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter); // Apply limiter to all routes starting with /api/

// --- Body Parsers ---
// Parse JSON bodies (limit size to prevent large payloads)
app.use(express.json({ limit: '20kb' }));
// Parse URL-encoded bodies (limit size)
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// --- Request Logging Middleware ---
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`REQ: ${req.method} ${req.originalUrl} - STATUS ${res.statusCode} [${duration}ms]`);
    });
    next();
});

// --- Firebase Admin Initialization ---
try {
    let serviceAccount;
    const serviceAccountEnvVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");

    if (serviceAccountEnvVar) {
        console.log("Init Firebase Admin SDK from Environment Variable...");
        try {
            serviceAccount = JSON.parse(serviceAccountEnvVar);
        } catch (e) {
            console.error("ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON from environment variable.");
            throw e;
        }
    } else if (fs.existsSync(serviceAccountPath)) {
        console.log("Init Firebase Admin SDK from local file...");
        serviceAccount = require(serviceAccountPath);
    } else {
        throw new Error("Firebase Admin SDK credentials not found in environment variable (FIREBASE_SERVICE_ACCOUNT_JSON) or local file (firebaseServiceAccount.json).");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully.");

} catch (error) {
    console.error("❌ CRITICAL ERROR: Firebase Admin SDK Initialization Failed:", error.message || error);
    process.exit(1);
}


// --- Step 2: Mount ALL API Routes ---
// Define base path '/api' for all API endpoints
app.use("/api/anonymous-letters", letterRoutes);
app.use("/api/facilities", facilityRoutes);
// app.use("/api/chatbot", chatbotRoutes); // Disabled old route
app.use("/api/wellness-feed", wellnessFeedRoutes);
app.use("/api/ai-chat", aiChatRoutes); // Mount the AI chat route (now using Gemini)
// --- End API Routes ---

// --- Simple Root Route ---
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the MindWell API! Stay Positive, Stay Healthy." });
});

// --- Health Check Route ---
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// --- Step 3: Centralized Error Handling ---
// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: `Resource Not Found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("💥 UNHANDLED ERROR DETECTED:", err.stack || err);
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const message = (process.env.NODE_ENV !== 'production' || err.expose === true)
        ? err.message
        : "An unexpected internal server error occurred.";
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
// --- End Error Handling ---

// --- Start the Server ---
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`\n🚀 MindWell Server listening on port ${PORT}`);
    console.log(`      Mode: ${process.env.NODE_ENV || 'development'}`);
    if(Array.isArray(allowedOrigins) && allowedOrigins.length > 0) {
        console.log(`      Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    } else if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL_PROD) {
         console.warn('      WARNING: Running in production mode, but FRONTEND_URL_PROD is not set in .env!');
    } else {
        console.log('      Allowed CORS origins: * (or none specified for production)');
    }
    // Log status of critical API keys loaded from .env
    console.log(`      News API Key Loaded: ${process.env.NEWS_API_KEY ? 'Yes' : 'NO! Check .env for NEWS_API_KEY'}`);
    // *** UPDATED: Check for Google API Key ***
    console.log(`      Google AI API Key Loaded: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'NO! Check .env for GOOGLE_API_KEY'}`);
    console.log(`      Firebase Credentials Source: ${process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'ENV Var' : (fs.existsSync(path.join(__dirname, "firebaseServiceAccount.json")) ? 'File' : 'NOT FOUND')}`);
});