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
import userLocationIconUrl from "../assets/download.png"; // Your user location icon (rename?)

// Custom Leaflet Icons (adjust sizes/anchors as needed)
const userIcon = new L.Icon({
    iconUrl: userLocationIconUrl,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -40],
});

const facilityIcon = new L.Icon({
    iconUrl: hospitalIconUrl,
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

// --- Helper Component to Recenter Map ---
const RecenterMap = ({ lat, lng, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (lat != null && lng != null) {
            map.setView([lat, lng], zoom || map.getZoom());
        }
    }, [lat, lng, zoom, map]);
    return null;
};

// --- FindDoctor Component ---
const FindDoctor = () => {
    // --- State ---
    const [facilities, setFacilities] = useState([]); // <-- Initialize as empty array
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(12);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapRef = useRef();

    // --- API Configuration ---
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8081";
    const FACILITIES_API = `${API_URL}/api/facilities`;

    // --- Fetch Facilities from Backend ---
    const fetchFacilities = useCallback(async (lat, lng) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(FACILITIES_API, {
                params: { lat, lng }
            });
            // ---vvv--- Ensure response.data is treated as an array ---vvv---
            const receivedData = response.data;
            setFacilities(Array.isArray(receivedData) ? receivedData : []);
            // ---^^^---------------------------------------------------^^^---
            if (!Array.isArray(receivedData) || receivedData.length === 0) {
                console.log("No facilities found or invalid data received from backend.");
            }
        } catch (err) {
            console.error("Error fetching facilities from backend:", err);
            const errorMsg = err.response?.data?.error || err.message || "Failed to load nearby facilities.";
            setError(errorMsg);
            setFacilities([]); // <-- Reset to empty array on error
        } finally {
            setLoading(false);
        }
    }, [FACILITIES_API]);

    // --- Get User Location Effect ---
    useEffect(() => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const location = { lat: latitude, lng: longitude };
                console.log("Geolocation success:", location);
                setUserLocation(location);
                setMapCenter(location);
                fetchFacilities(latitude, longitude);
            },
            (geoError) => {
                 console.warn("Geolocation error:", geoError.message);
                const fallbackLat = 40.7128; // New York
                const fallbackLng = -74.0060;
                const fallbackLocation = { lat: fallbackLat, lng: fallbackLng };
                setError("Could not get your location. Showing results near New York.");
                setUserLocation(fallbackLocation);
                setMapCenter(fallbackLocation);
                fetchFacilities(fallbackLat, fallbackLng);
            },
            {
                enableHighAccuracy: false,
                timeout: 8000,
                maximumAge: 1000 * 60 * 5
             }
        );
    }, [fetchFacilities]);

    // --- Animation Variants ---
    const pageVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
    };
    const mapVariants = {
        hidden: { opacity: 0, scale: 0.98 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, delay: 0.2 } },
    };

    // --- Render Logic ---
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
                <span className="header-icon">🏥</span>
                <h2 className="page-title">Find Nearby Support Facilities</h2>
                <p className="page-subtitle">Locating hospitals and clinics near you.</p>
            </header>

            {/* Error Display */}
            <AnimatePresence>
                {error && !loading && (
                    <motion.div
                        className="error-message page-error"
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
                 {loading && <div className="loading-overlay map-loading"><span>Loading facilities...</span></div>}

                <MapContainer
                    key={`${mapCenter.lat}-${mapCenter.lng}`}
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={mapZoom}
                    style={{ height: "600px", width: "100%" }}
                    ref={mapRef}
                    className="leaflet-map-container"
                    whenCreated={ mapInstance => { mapRef.current = mapInstance } }
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {userLocation && <RecenterMap lat={userLocation.lat} lng={userLocation.lng} zoom={mapZoom} />}

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

                    {/* ---vvv--- Add Array.isArray Check ---vvv--- */}
                    {/* Facility Markers - Only map if 'facilities' is actually an array */}
                    {Array.isArray(facilities) && facilities.map((place) => (
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
                    {/* ---^^^--- End Array.isArray Check ---^^^--- */}
                </MapContainer>

                 {!loading && !error && facilities.length === 0 && (
                    <p className="no-results-message">No hospitals or clinics found in your immediate area.</p>
                )}
            </motion.div>

        </motion.div>
    );
};

export default FindDoctor;