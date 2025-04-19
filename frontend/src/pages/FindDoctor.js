// frontend/src/pages/FindDoctor.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
import axios from "axios";
import L from "leaflet"; // Import Leaflet library
import { motion, AnimatePresence } from "framer-motion";
import GlobalLoader from "../components/GlobalLoader"; // Import loader

import "./FindDoctor.css"; // Link specific styles

// --- Define Custom Icons ---
// Ensure paths are correct relative to the src directory
import hospitalIconUrl from "../assets/hospitals_icon.png"; // Your hospital/clinic icon
import userLocationIconUrl from "../assets/download.png"; // Your user location icon (maybe rename download.png?)

// Custom Leaflet Icons (adjust sizes/anchors as needed)
const userIcon = new L.Icon({
    iconUrl: userLocationIconUrl,
    iconSize: [38, 38],
    iconAnchor: [19, 38], // Point of the icon which corresponds to marker's location (bottom center)
    popupAnchor: [0, -40], // Point from which the popup should open relative to the iconAnchor
});

const facilityIcon = new L.Icon({ // Renamed for clarity
    iconUrl: hospitalIconUrl,
    iconSize: [35, 35],
    iconAnchor: [17, 35], // Bottom center
    popupAnchor: [0, -35],
});


// --- Helper Component to Recenter Map ---
// Ensures map recenters if user location changes without full reload
const RecenterMap = ({ lat, lng, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (lat != null && lng != null) { // Check for null/undefined explicitly
            map.setView([lat, lng], zoom || map.getZoom()); // Use specified zoom or current zoom
        }
    }, [lat, lng, zoom, map]);
    return null;
};


// --- FindDoctor Component ---
const FindDoctor = () => {
    const [facilities, setFacilities] = useState([]);
    const [userLocation, setUserLocation] = useState(null); // { lat: number, lng: number }
    const [mapCenter, setMapCenter] = useState(null); // Center for MapContainer init
    const [mapZoom, setMapZoom] = useState(12); // Initial zoom level
    const [loading, setLoading] = useState(true); // Combined loading state
    const [error, setError] = useState(null); // Error messages
    const mapRef = useRef(); // Ref for map instance (optional)

    // Backend API URL from environment variable
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";
    const FACILITIES_API = `${API_URL}/api/facilities`;

    // --- Fetch Facilities from Backend ---
    const fetchFacilities = useCallback(async (lat, lng) => {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
            // Call *your* backend endpoint, passing lat/lng
            const response = await axios.get(FACILITIES_API, {
                params: { lat, lng } // Send as query parameters
            });
            setFacilities(response.data || []); // Set facilities or empty array
            if (response.data.length === 0) {
                 console.log("No facilities found in the area via backend.");
                 // Optionally set a soft notification instead of an error
            }
        } catch (err) {
            console.error("Error fetching facilities from backend:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to load nearby facilities.";
            setError(errorMsg);
            setFacilities([]); // Clear data on error
        } finally {
            setLoading(false);
        }
    }, [FACILITIES_API]); // Dependency: API endpoint URL


    // --- Get User Location Effect ---
    useEffect(() => {
        setLoading(true); // Start loading
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const location = { lat: latitude, lng: longitude };
                console.log("Geolocation success:", location);
                setUserLocation(location);
                setMapCenter(location); // Set initial map center
                fetchFacilities(latitude, longitude); // Fetch data based on location
            },
            (geoError) => {
                 console.warn("Geolocation error:", geoError.message);
                 // Fallback logic
                const fallbackLat = 40.7128; // Example: New York
                const fallbackLng = -74.0060;
                const fallbackLocation = { lat: fallbackLat, lng: fallbackLng };
                setError("Could not get your location. Showing results near New York."); // Inform user
                setUserLocation(fallbackLocation); // Set user location for marker
                setMapCenter(fallbackLocation); // Set map center to fallback
                fetchFacilities(fallbackLat, fallbackLng); // Fetch data for fallback location
            },
            {
                enableHighAccuracy: false, // Can try true, but might take longer/fail more often
                timeout: 8000, // Max time to wait for location
                maximumAge: 1000 * 60 * 5 // Allow using cached location up to 5 mins old
             }
        );
    }, [fetchFacilities]); // Re-run only if fetchFacilities function identity changes (rare with useCallback)


    // --- Animation Variants ---
     const pageVariants = { /* ... */ }; // Keep as defined before
     const mapVariants = { /* ... */ }; // Keep as defined before


    // --- Render Logic ---

    // Display loader while waiting for initial location/data
    if (!mapCenter) {
        return <GlobalLoader message="Getting location and finding facilities..." />;
    }

    return (
        <motion.div
            className="find-doctor-container"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            <header className="page-header find-doctor-header">
                <span className="header-icon">🏥</span> {/* Or FiMapPin icon */}
                <h2 className="page-title">Find Nearby Support Facilities</h2>
                <p className="page-subtitle">Locating hospitals and clinics near you.</p>
            </header>

            {/* Display Error Messages */}
            <AnimatePresence>
                {error && !loading && ( // Show error only if not currently loading
                    <motion.div
                        className="error-message page-error" // Use consistent error styling
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        role="alert"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

             {/* Map Area */}
            <motion.div
                className="map-wrapper"
                variants={mapVariants}
                initial="hidden"
                animate="visible"
            >
                 {/* Loading indicator specifically for data fetching (after location is known) */}
                 {loading && <div className="loading-overlay map-loading"><span>Loading facilities...</span></div>}

                <MapContainer
                    key={`${mapCenter.lat}-${mapCenter.lng}`} // Force re-render if center changes significantly (e.g., fallback)
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={mapZoom}
                    style={{ height: "600px", width: "100%" }} // Adjust height as needed
                    ref={mapRef}
                    className="leaflet-map-container" // Add class for potential styling
                    whenCreated={ mapInstance => { mapRef.current = mapInstance } } // Store map instance if needed
                >
                    {/* Use a standard Tile Layer */}
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Recenter component ensures map view updates if userLocation state changes */}
                    {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} zoom={mapZoom} />}

                    {/* User Location Marker (only if location was successfully obtained) */}
                    {userLocation && (
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                            <Popup>
                                <div className="popup-content user-popup">
                                    <strong>You are here</strong>
                                    <p>(Location approximate)</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Facility Markers */}
                    {facilities.map((place) => (
                        <Marker key={place.id} position={[place.lat, place.lon]} icon={facilityIcon}>
                            <Popup>
                                <div className="popup-content facility-popup">
                                    <strong className="popup-title">{place.name}</strong>
                                    {place.address && <p className="popup-address">{place.address}</p>}
                                    {place.phone && (
                                        <p className="popup-phone">
                                            <a href={`tel:${place.phone}`}>{place.phone}</a>
                                        </p>
                                    )}
                                    {place.website && (
                                        <p className="popup-website">
                                            {/* Ensure URL starts with http/https */}
                                            <a
                                                href={!/^https?:\/\//i.test(place.website) ? `http://${place.website}` : place.website}
                                                target="_blank" rel="noopener noreferrer"
                                            >
                                                Visit Website
                                            </a>
                                        </p>
                                    )}
                                     <span className="popup-facility-type">{place.type}</span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                 {/* Message if no facilities are found (and not loading/error) */}
                 {!loading && !error && facilities.length === 0 && (
                    <p className="no-results-message">No hospitals or clinics found in your immediate area.</p>
                )}
            </motion.div>

        </motion.div>
    );
};

export default FindDoctor;