// backend/routes/facilities.js
const express = require("express");
const axios = require('axios'); // To make requests to the Overpass API
const { query, validationResult } = require('express-validator');

// --- Initialize Router ---
const router = express.Router();

// --- Helper Function for Input Validation Errors ---
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn("Facilities Route Validation Errors:", errors.array());
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

// --- Validation Rules for Query Parameters ---
const facilitiesQueryValidationRules = [
    query('lat')
        .exists({ checkFalsy: true }).withMessage('Latitude (lat) query parameter is required.') // checkFalsy ensures 0 is invalid too if needed
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value.')
        .toFloat(), // Convert to float
    query('lng')
        .exists({ checkFalsy: true }).withMessage('Longitude (lng) query parameter is required.')
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value.')
        .toFloat(), // Convert to float
    // Optional: Validate radius if you allow it as a parameter
    // query('radius').optional().isInt({ min: 1000, max: 50000 }).withMessage('Radius must be between 1km and 50km.').toInt()
];


/**
 * @route   GET /api/facilities
 * @desc    Fetch nearby hospitals and clinics using Overpass API
 * @access  Public (Can add authMiddleware if needed later)
 */
router.get(
    "/",
    facilitiesQueryValidationRules, // Apply validation rules
    handleValidationErrors,        // Handle any validation errors
    async (req, res, next) => {
        // Validation passed, get lat/lng from query string (already converted to float)
        const { lat, lng } = req.query;

        // Use a fixed radius or get from query if you added validation for it
        const radiusMeters = 16093; // Approx 10 miles

        // Construct Overpass API query for hospitals AND clinics (nodes, ways, relations) with names
        // [timeout:30] sets a 30-second timeout
        // out center; gets center coords for ways/relations
        const overpassQuery = `
            [out:json][timeout:30];
            (
              node["amenity"~"^(hospital|clinic)$"]["name"](around:${radiusMeters},${lat},${lng});
              way["amenity"~"^(hospital|clinic)$"]["name"](around:${radiusMeters},${lat},${lng});
              relation["amenity"~"^(hospital|clinic)$"]["name"](around:${radiusMeters},${lat},${lng});
            );
            out center;
        `;
        // Alternative focusing only on nodes (potentially faster, less comprehensive):
        // const overpassQuery = `[out:json][timeout:25]; node["amenity"~"^(hospital|clinic)$"]["name"](around:${radiusMeters},${lat},${lng}); out body;`;

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        console.log(`Fetching facilities near (${lat}, ${lng}) from Overpass API...`);

        try {
            const response = await axios.get(overpassUrl, {
                headers: {
                    // Set a user-agent for politeness and identification
                    'User-Agent': 'MindWellApp/1.0 (Contact: your.email@example.com)' // Replace with actual contact info
                }
            });

            if (!response.data || !response.data.elements) {
                console.warn("Overpass API returned no elements or invalid data.");
                return res.status(200).json([]); // Return empty array if no results
            }

            // Format the results
            const facilities = response.data.elements.map(element => {
                // For ways/relations, Overpass returns 'center' coordinates if using 'out center;'
                // For nodes, it uses 'lat'/'lon'
                const coordinates = element.center || { lat: element.lat, lon: element.lon };

                // Only include if coordinates are valid
                if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lon !== 'number') {
                    return null; // Skip elements without valid coordinates
                }

                const tags = element.tags || {};

                // Basic address construction attempt
                const streetAddress = `${tags["addr:housenumber"] || ""} ${tags["addr:street"] || ""}`.trim();
                const fullAddress = [streetAddress, tags["addr:city"], tags["addr:postcode"]]
                                   .filter(Boolean).join(', ').trim() || null; // Combine parts

                return {
                    id: element.id,
                    name: tags.name || "Unnamed Facility",
                    type: tags.amenity || "facility", // hospital or clinic
                    lat: coordinates.lat,
                    lon: coordinates.lon,
                    address: fullAddress, // Send combined address
                    phone: tags.phone || tags["contact:phone"] || null,
                    website: tags.website || tags["contact:website"] || null,
                };
            }).filter(f => f !== null); // Filter out any null entries (skipped due to missing coords)

            // Optional: Simple deduplication based on coordinates (Overpass can sometimes return duplicates)
            const uniqueFacilities = Array.from(new Map(facilities.map(f => [`${f.lat},${f.lon}`, f])).values());


            console.log(`Found ${uniqueFacilities.length} facilities.`);
            res.status(200).json(uniqueFacilities);

        } catch (error) {
            console.error("Error fetching facilities from Overpass API:", error.response?.data || error.message || error);
            // Pass a more specific error to the global handler if possible
            if (error.response?.status === 429) {
                next({ statusCode: 429, message: "Overpass API rate limit exceeded. Please try again later."});
            } else if (error.response?.status === 400) {
                 next({ statusCode: 400, message: "Overpass API query error. Check query syntax or parameters."});
            } else if (error.response?.status === 504) {
                 next({ statusCode: 504, message: "Overpass API timeout. The server is busy or the query is too complex."});
            } else {
                next(error); // Pass generic errors to global handler
            }
        }
    }
);

module.exports = router;