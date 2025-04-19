// backend/server.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config(); // Load environment variables early

const helmet = require("helmet"); // Sets various security HTTP headers
const rateLimit = require("express-rate-limit"); // Basic rate limiting

// ---vvv--- Step 1: Import ALL route handlers ---vvv---
const letterRoutes = require("./routes/anonymousLetters");
const facilityRoutes = require("./routes/facilities");
const chatbotRoutes = require("./routes/chatbot"); // Import chatbot routes
// ---^^^--- End Route Imports ---^^^---

// --- Initialize Express App ---
const app = express();

// --- Security Enhancements ---
app.use(helmet()); // Apply helmet security headers

// --- CORS Configuration ---
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL_PROD] // Make sure this is set in production .env
    // Add ALL ports your frontend might run on, AND the backend's own port for dev flexibility
    : ["http://localhost:3000", "http://localhost:8082", "http://localhost:3003", "http://localhost:8081"];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests) or from allowed list
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET, POST, DELETE, PUT, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true // Keep if frontend might need cookies later, otherwise optional
};

app.use(cors(corsOptions));
// Handle CORS preflight requests (OPTIONS method) globally
app.options('*', cors(corsOptions));

// --- Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter); // Apply rate limiting to all /api/ routes

// --- Body Parsers ---
app.use(express.json({ limit: '20kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '20kb' }));

// --- Request Logging Middleware ---
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`REQ: ${req.method} ${req.originalUrl} - ${res.statusCode} [${duration}ms]`);
    });
    next();
});

// --- Firebase Admin Initialization ---
try {
    const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");
    // Ensure the file exists before requiring
    if (!require('fs').existsSync(serviceAccountPath)) {
        throw new Error(`firebaseServiceAccount.json not found at ${serviceAccountPath}`);
    }
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com" // Optional
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully.");

} catch (error) {
    console.error("❌ CRITICAL ERROR: Failed to initialize Firebase Admin SDK:");
    console.error(error.message);
    console.error("Ensure 'firebaseServiceAccount.json' exists, is valid JSON, and accessible.");
    process.exit(1); // Exit if Firebase Admin fails
}

// ---vvv--- Step 2: Mount ALL API Routes ---vvv---
// These MUST come before the 404 handler
app.use("/api/anonymous-letters", letterRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/chatbot", chatbotRoutes); // Mount chatbot routes
// ---^^^--- End API Routes ---^^^---

// --- Simple Root Route ---
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the MindWell API!" });
});

// ---vvv--- Step 3: Centralized Error Handling (AFTER all valid routes) ---vvv---

// 404 Not Found Handler
app.use((req, res, next) => {
    // This middleware runs only if no route above matched
    res.status(404).json({ error: `Not Found: Cannot ${req.method} ${req.originalUrl}` });
});

// Global Error Handler (must have 4 arguments)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("💥 UNHANDLED ERROR:", err.stack || err); // Log the full error stack

    // Use status code from the error if it exists, otherwise default to 500
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        error: message,
        // Optionally add more error details in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
// ---^^^--- End Error Handling ---^^^---


// --- Start the Server ---
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`      Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`      Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});