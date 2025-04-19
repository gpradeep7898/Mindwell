const functions = require("firebase-functions");
const { postAnonymousLetter, getAnonymousLetters } = require("./letters");

// API Routes for Anonymous Letters
exports.postAnonymousLetter = postAnonymousLetter;
exports.getAnonymousLetters = getAnonymousLetters;
