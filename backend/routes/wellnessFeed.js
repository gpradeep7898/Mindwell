// backend/routes/wellnessFeed.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// Define the GET route for the wellness feed
router.get('/', async (req, res, next) => { // Added next for error handling
    const apiKey = process.env.NEWS_API_KEY; // Get API key from environment variables

    // --- Basic Validation ---
    if (!apiKey) {
        console.error("ERROR: NEWS_API_KEY is not set in environment variables.");
        // Use next() to pass the error to the centralized error handler
        return next(new Error("Server configuration error: News API key missing."));
        // Or send a specific response:
        // return res.status(500).json({ error: "Server configuration error preventing news feed." });
    }

    // --- Prepare News API Request ---
    const queryKeywords = '"mental health" OR wellness OR mindfulness OR wellbeing'; // Keywords to search for
    const sortBy = 'publishedAt'; // Get latest articles
    const language = 'en'; // English articles
    const pageSize = 15; // Number of articles to fetch (adjust as needed)

    const newsApiUrl = `https://newsapi.org/v2/everything`; // Using the 'everything' endpoint

    const params = {
        q: queryKeywords,
        apiKey: apiKey,
        language: language,
        sortBy: sortBy,
        pageSize: pageSize,
    };

    // --- Fetch from News API ---
    try {
        console.log(`Attempting to fetch news from NewsAPI with keywords: ${queryKeywords}`);
        const response = await axios.get(newsApiUrl, { params });

        // --- Handle Successful Response ---
        if (response.data && response.data.status === 'ok') {
            console.log(`Successfully fetched ${response.data.articles?.length || 0} articles from NewsAPI.`);
            // Send back the articles array (or the whole object if frontend expects that)
            res.status(200).json({ articles: response.data.articles || [] });
        } else {
            // Handle cases where NewsAPI status is 'error' or data structure is unexpected
            console.error("NewsAPI request succeeded but returned non-ok status or invalid data:", response.data);
            throw new Error(response.data?.message || "Received invalid data from NewsAPI.");
        }

    } catch (error) {
        // --- Handle Errors During Fetch ---
        console.error("Error fetching from NewsAPI:", error.message);
        // Log more details if available (like response from NewsAPI if the error was an HTTP error)
        if (error.response) {
            console.error('NewsAPI Error Response Status:', error.response.status);
            console.error('NewsAPI Error Response Data:', error.response.data);
        }
        // Pass a generic error to the client via the centralized handler
        next(new Error("Failed to fetch wellness feed. Please try again later."));
    }
});

module.exports = router; // Export the router