// frontend/src/pages/QuickRelief.js
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
// Choose appropriate icons
import { FiZap, FiShield, FiWind, FiPauseCircle } from 'react-icons/fi';
// Import the overlay component and data utils
import QuickReliefOverlay from '../components/QuickReliefOverlay';
import { reliefProtocols, getReliefProtocol } from '../utils/quickReliefProtocols'; // Ensure path is correct
import './QuickRelief.css'; // Link specific styles

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
    const [selectedProtocolName, setSelectedProtocolName] = useState(null); // e.g., 'panic', 'highAnxiety'
    const [showOverlay, setShowOverlay] = useState(false);

    // Function to start a selected protocol
    const startProtocol = useCallback((protocolName) => {
        setSelectedProtocolName(protocolName);
        setShowOverlay(true);
         document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }, []); // No dependencies needed

    // Function to close the overlay
    const closeOverlay = useCallback(() => {
        setShowOverlay(false);
        setSelectedProtocolName(null); // Reset selection
        document.body.style.overflow = ''; // Restore scrolling
    }, []);

    // Get the currently selected protocol object
    const currentProtocol = selectedProtocolName ? getReliefProtocol(selectedProtocolName) : null;

    // --- Render ---
    return (
        <> {/* Use Fragment to allow overlay to sit outside main page flow */}
            <motion.div
                className="quick-relief-page-container"
                variants={pageVariants} initial="hidden" animate="visible"
            >
                {/* --- Header --- */}
                <header className="page-header quick-relief-header">
                     <span className="header-icon"><FiShield/></span>
                    <h2 className="page-title">Quick Relief</h2>
                    <p className="page-subtitle">Choose a guided exercise for immediate support when feeling overwhelmed.</p>
                </header>

                {/* --- Protocol Selection Grid --- */}
                <motion.div
                    className="protocol-selection-grid"
                    variants={sectionVariants} // Stagger animation for cards
                >
                    {/* Card for Panic */}
                    <motion.div
                        className="aura-card protocol-card"
                        variants={cardVariants}
                        onClick={() => startProtocol('panic')}
                        whileHover={{ y: -5, boxShadow: "var(--card-shadow-hover)" }} // Add hover effect
                        role="button"
                        tabIndex={0} // Make it focusable
                        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && startProtocol('panic')}
                    >
                         <FiZap size={30} className="protocol-icon panic-icon"/>
                        <h3>Feeling Panicked?</h3>
                        <p>{reliefProtocols.panic?.description || "Grounding exercise for intense moments."}</p>
                        <span className="aura-button-imitation">Start Grounding</span> {/* Looks like button */}
                    </motion.div>

                     {/* Card for High Anxiety */}
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

                    {/* Add more cards here if you define more protocols */}
                </motion.div>

                 {/* --- Disclaimer --- */}
                 <p className="disclaimer-text">
                    These exercises provide temporary relief and are not a substitute for professional mental health care.
                    If you are in crisis or need urgent help, please contact emergency services or a crisis hotline immediately.
                </p>

            </motion.div>

            {/* --- Render the Overlay Component --- */}
            <QuickReliefOverlay
                isVisible={showOverlay}
                onClose={closeOverlay}
                protocol={currentProtocol} // Pass the selected protocol object
            />
        </> // End Fragment
    );
};

export default QuickRelief;