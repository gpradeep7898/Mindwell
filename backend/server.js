// backend/server.js
// Final Corrected Version: GET /anonymous-letters is public, other letter actions & AI chat are protected.

const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const fs = require('fs');
require("dotenv").config(); // Load environment variables early

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- Step 1: Import Middleware & Route Handlers ---
const authMiddleware = require('./routes/authMiddleware'); // Correct path assuming it's in 'routes'
const letterRoutes = require("./routes/anonymousLetters");
const facilityRoutes = require("./routes/facilities");
// const chatbotRoutes = require("./routes/chatbot"); // Old route disabled
const wellnessFeedRoutes = require("./routes/wellnessFeed");
const aiChatRoutes = require('./routes/aiChatRoutes');
// --- End Imports ---

const app = express();

// --- Security Enhancements ---
app.use(helmet());

// --- CORS Configuration ---
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL_PROD ? [process.env.FRONTEND_URL_PROD] : [])
    : ["http://localhost:3000", "http://localhost:8082", "http://localhost:8003", "http://localhost:8081"];

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
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// --- Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// --- Body Parsers ---
app.use(express.json({ limit: '20kb' }));
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
        try { serviceAccount = JSON.parse(serviceAccountEnvVar); } catch (e) { console.error("ERROR: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON."); throw e; }
    } else if (fs.existsSync(serviceAccountPath)) {
        console.log("Init Firebase Admin SDK from local file (firebaseServiceAccount.json)...");
        serviceAccount = require(serviceAccountPath);
    } else { throw new Error("Firebase Admin SDK credentials not found."); }

    admin.initializeApp({ credential: admin.credential.cert(serviceAccount), });
    console.log("✅ Firebase Admin SDK Initialized Successfully.");
} catch (error) {
    console.error("❌ CRITICAL ERROR: Firebase Admin SDK Initialization Failed:", error.message || error);
    process.exit(1);
}


// --- Step 2: Mount ALL API Routes ---

// Public routes (do NOT apply authMiddleware here globally)
app.use("/api/facilities", facilityRoutes);
app.use("/api/wellness-feed", wellnessFeedRoutes);
app.use("/api/anonymous-letters", letterRoutes); // *** REMOVED authMiddleware - GET is now public ***
                                                 // Individual POST/DELETE within letterRoutes apply their own authMiddleware

// Protected routes (apply authMiddleware here)
app.use("/api/ai-chat", authMiddleware, aiChatRoutes); // AI Chat requires login

// Add other routes as needed, applying authMiddleware individually if protection is required
// Example: app.use("/api/mood-entries", authMiddleware, moodRoutes);

// --- End API Routes ---

// --- Simple Root Route ---
app.get("/", (req, res) => { res.status(200).json({ message: "Welcome to the MindWell API! Stay Positive, Stay Healthy." }); });

// --- Health Check Route ---
app.get("/healthz", (req, res) => { res.status(200).send("OK"); });

// --- Step 3: Centralized Error Handling ---
// 404 Handler (requests falling through)
app.use((req, res, next) => { res.status(404).json({ error: `Resource Not Found: ${req.method} ${req.originalUrl}` }); });

// Global Error Handler (catches next(err))
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("💥 UNHANDLED ERROR DETECTED:", err.stack || err);
    const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
    const message = (process.env.NODE_ENV !== 'production' || err.expose === true) ? err.message : "An unexpected internal server error occurred.";
    res.status(statusCode).json({ error: message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), });
});
// --- End Error Handling ---

// --- Start the Server ---
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`\n🚀 MindWell Server listening on port ${PORT}`);
    console.log(`      Mode: ${process.env.NODE_ENV || 'development'}`);
    if(Array.isArray(allowedOrigins) && allowedOrigins.length > 0) console.log(`      Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    else if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL_PROD) console.warn('      WARNING: Running in production mode, but FRONTEND_URL_PROD is not set in .env!');
    else console.log('      Allowed CORS origins: * (or none specified for production)');
    console.log(`      News API Key Loaded: ${process.env.NEWS_API_KEY ? 'Yes' : 'NO!'}`);
    console.log(`      Google AI API Key Loaded: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'NO!'}`);
    console.log(`      Firebase Credentials Source: ${process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? 'ENV Var' : (fs.existsSync(path.join(__dirname, "firebaseServiceAccount.json")) ? 'File' : 'NOT FOUND')}`);
});