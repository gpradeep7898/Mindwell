// backend/server.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const fs = require('fs'); // Import 'fs' module for file system checks
require("dotenv").config(); // Load environment variables early

const helmet = require("helmet"); // Sets various security HTTP headers
const rateLimit = require("express-rate-limit"); // Basic rate limiting

// --- Step 1: Import ALL route handlers ---
const letterRoutes = require("./routes/anonymousLetters");
const facilityRoutes = require("./routes/facilities");
const chatbotRoutes = require("./routes/chatbot"); // Import chatbot routes
// --- End Route Imports ---

// --- Initialize Express App ---
const app = express();

// --- Security Enhancements ---
app.use(helmet()); // Apply helmet security headers

// --- CORS Configuration ---
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL_PROD] // Set this in production .env/Render Env Vars
    // Add ALL ports your frontend might run on locally, AND the backend's own port
    : ["http://localhost:3000", "http://localhost:8082", "http://localhost:3003", "http://localhost:8081"];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin or from allowed list
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

app.use(cors(corsOptions));
// Handle CORS preflight requests globally
app.options('*', cors(corsOptions));

// --- Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
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

// --- Firebase Admin Initialization (Revised Logic) ---
try {
    let serviceAccount;
    const serviceAccountEnvVar = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");

    // ---vvv--- PRIORITIZE Environment Variable if it exists ---vvv---
    if (serviceAccountEnvVar) {
        console.log("Attempting to initialize Firebase Admin SDK from environment variable...");
        try {
            serviceAccount = JSON.parse(serviceAccountEnvVar);
            console.log("Successfully parsed service account from environment variable.");
        } catch (e) {
            console.error("ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
            console.error("Ensure the environment variable contains valid JSON.");
            throw e; // Re-throw the parsing error to be caught below
        }
    // ---vvv--- Fallback to File ONLY if Env Var is NOT set AND file exists ---vvv---
    } else if (fs.existsSync(serviceAccountPath)) {
        console.log("Attempting to initialize Firebase Admin SDK from file (Environment variable not found)...");
        serviceAccount = require(serviceAccountPath); // Load from file
        console.log("Successfully loaded service account from file.");
    // ---vvv--- Error if NEITHER is available ---vvv---
    } else {
        throw new Error(
            "Firebase Admin SDK credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable or place firebaseServiceAccount.json file in the backend directory."
        );
    }
    // ---^^^--- End Credential Loading Logic ---^^^---

    // Initialize Firebase Admin
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // databaseURL: "https://your-project-id.firebaseio.com" // Optional
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully.");

} catch (error) {
    console.error("❌ CRITICAL ERROR: Failed to initialize Firebase Admin SDK:");
    console.error(error.message || error); // Log the specific error message
    console.error("Check Render environment variables (FIREBASE_SERVICE_ACCOUNT_JSON) and local file paths/permissions.");
    process.exit(1); // Exit if Firebase Admin fails
}


// --- Step 2: Mount ALL API Routes ---
// These MUST come before the 404 handler
app.use("/api/anonymous-letters", letterRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/chatbot", chatbotRoutes); // Mount chatbot routes
// --- End API Routes ---

// --- Simple Root Route ---
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the MindWell API!" });
});

// Optional: Simple Health Check Route (if using /healthz in Render settings)
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

// --- Step 3: Centralized Error Handling (AFTER all valid routes) ---

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
// --- End Error Handling ---


// --- Start the Server ---
const PORT = process.env.PORT || 8081; // Render sets PORT env var (e.g., 10000)
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`      Mode: ${process.env.NODE_ENV || 'development'}`);
    // Only log allowedOrigins if it's an array (it might be undefined in prod if FRONTEND_URL_PROD isn't set yet)
    if(Array.isArray(allowedOrigins)) {
        console.log(`      Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    }
});