// frontend/src/pages/QuickRelief.js
// Displays the initial choices and launches the overlay. Imports protocol data.

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiWind, FiPauseCircle } from 'react-icons/fi'; // Icons for cards
import QuickReliefOverlay from '../components/QuickReliefOverlay';
// Import the data/functions from the utility file where images are now included
import { reliefProtocols, getReliefProtocol } from '../utils/quickReliefProtocols';
import './QuickRelief.css'; // Link page-specific styles

// --- Animation Variants ---
const pageVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
};


// --- Component ---
const QuickRelief = () => {
    // State to track which protocol name is selected (e.g., 'panic')
    const [selectedProtocolName, setSelectedProtocolName] = useState(null);
    // State to control the visibility of the overlay
    const [showOverlay, setShowOverlay] = useState(false);

    // Function to handle starting a protocol when a card is clicked
    const startProtocol = useCallback((protocolName) => {
        // Check if the protocol actually exists before setting state
        if (reliefProtocols[protocolName]) {
            setSelectedProtocolName(protocolName);
            setShowOverlay(true);
            document.body.style.overflow = 'hidden'; // Prevent background page scrolling
        } else {
            console.error(`Attempted to start non-existent protocol: ${protocolName}`);
        }
    }, []); // No dependencies needed as reliefProtocols is imported constant

    // Function to handle closing the overlay (passed to the overlay component)
    const closeOverlay = useCallback(() => {
        setShowOverlay(false);
        setSelectedProtocolName(null); // Clear selection
        document.body.style.overflow = ''; // Restore background page scrolling
    }, []);

    // Get the complete protocol object (including steps, music, background image)
    // based on the currently selected name. Returns null if no name is selected.
    const currentProtocol = selectedProtocolName ? getReliefProtocol(selectedProtocolName) : null;

    // --- Render Page Structure ---
    return (
        // Use React Fragment to group elements without adding extra div to DOM
        <>
            {/* Main page content container */}
            <motion.div
                className="quick-relief-page-container" // From QuickRelief.css
                variants={pageVariants} initial="hidden" animate="visible"
            >
                {/* Page Header */}
                <header className="page-header quick-relief-header">
                     <span className="header-icon"><FiShield/></span>
                    <h2 className="page-title">Quick Relief</h2>
                    <p className="page-subtitle">Choose a guided exercise for immediate support when feeling overwhelmed.</p>
                </header>

                {/* Grid for the selection cards */}
                <motion.div
                    className="protocol-selection-grid"
                    variants={sectionVariants} // Apply stagger animation to grid
                >
                    {/* Card for Panic */}
                    {/* Make sure 'panic' matches the key in reliefProtocols object */}
                    <motion.div
                        className="aura-card protocol-card" // Use shared card styles + specific styles
                        variants={cardVariants} // Apply card animation
                        onClick={() => startProtocol('panic')} // Trigger start function
                        whileHover={{ y: -5, boxShadow: "var(--card-shadow-hover)" }} // Hover effect
                        role="button" tabIndex={0} // Accessibility
                        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && startProtocol('panic')} // Keyboard accessibility
                    >
                         <FiZap size={30} className="protocol-icon panic-icon"/>
                        <h3>Feeling Panicked?</h3>
                        {/* Get description safely from imported data */}
                        <p>{reliefProtocols.panic?.description || "Grounding exercise for intense moments."}</p>
                        <span className="aura-button-imitation">Start Grounding</span>
                    </motion.div>

                     {/* Card for High Anxiety */}
                     {/* Make sure 'highAnxiety' matches the key in reliefProtocols object */}
                     <motion.div
                        className="aura-card protocol-card"
                        variants={cardVariants}
                        onClick={() => startProtocol('highAnxiety')}
                        whileHover={{ y: -5, boxShadow: "var(--card-shadow-hover)" }}
                        role="button" tabIndex={0}
                        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && startProtocol('highAnxiety')}
                    >
                         <FiWind size={30} className="protocol-icon anxiety-icon"/>
                         <h3>Very Anxious?</h3>
                        <p>{reliefProtocols.highAnxiety?.description || "Breathing exercise to calm the nervous system."}</p>
                         <span className="aura-button-imitation">Start Breathing Space</span>
                    </motion.div>

                     {/* Card for Overwhelm */}
                     {/* Make sure 'overwhelm' matches the key in reliefProtocols object */}
                     <motion.div
                        className="aura-card protocol-card"
                        variants={cardVariants}
                         onClick={() => startProtocol('overwhelm')}
                         whileHover={{ y: -5, boxShadow: "var(--card-shadow-hover)" }}
                         role="button" tabIndex={0}
                         onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && startProtocol('overwhelm')}
                    >
                         <FiPauseCircle size={30} className="protocol-icon overwhelm-icon"/>
                         <h3>Overwhelmed?</h3>
                        <p>{reliefProtocols.overwhelm?.description || "A short pause to reset and refocus."}</p>
                         <span className="aura-button-imitation">Take a Pause</span>
                    </motion.div>

                </motion.div>

                 {/* Disclaimer Text */}
                 <p className="disclaimer-text">
                    These exercises provide temporary relief and are not a substitute for professional mental health care.
                    If you are in crisis or need urgent help, please contact emergency services or a crisis hotline immediately.
                </p>

            </motion.div> {/* End page container */}

            {/* Render the Overlay Component conditionally */}
            {/* Pass the complete protocol object (which includes the background image) */}
            <QuickReliefOverlay
                isVisible={showOverlay}
                onClose={closeOverlay}
                protocol={currentProtocol} // Pass the object fetched using getReliefProtocol
            />
        </> // End Fragment
    );
};

export default QuickRelief;