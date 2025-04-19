const admin = require("firebase-admin");
const functions = require("firebase-functions");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Firestore Database
const db = admin.firestore();

module.exports = { admin, db };
