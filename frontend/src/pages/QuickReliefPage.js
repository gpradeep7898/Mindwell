// frontend/src/pages/QuickReliefPage.js
// This page directly renders the Quick Relief Overlay with a background

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate away on close

// --- Import the CSS Module ---
import styles from './QuickReliefPage.module.css';

// --- Import the Overlay Component ---
// Adjust path if your components folder structure is different
import QuickReliefOverlay from '../components/QuickReliefOverlay';

// --- Import ONE of the background images ---
// Choose which image you want as the default background
import soothingBackground1 from '../assets/soothing1.jpg';
// import soothingBackground2 from '../assets/soothing2.webp';
// import soothingBackground3 from '../assets/soothing3.jpg';

// --- Define or Import the Protocol Data ---
// Placeholder - replace with your actual data structure or import
const panicGroundingSequence = {
    name: "Panic Grounding Sequence",
    themeGradient: 'linear-gradient(to bottom, #accbe1, #f0f4f8)', // Example gradient for overlay (fallback if CSS fails)
    musicFile: '/audio/audio1.mp3', // Path relative to the PUBLIC folder
    completionMessage: "You've completed the grounding sequence. Take a deep breath.",
    steps: [
        { text: "Acknowledge the feeling without judgment. Say: 'I am feeling panic, and it will pass.'", duration: 8000 }, // 8 seconds
        { text: "Name 5 things you can see around you. Look closely at each item.", duration: 15000 }, // 15 seconds
        { text: "Name 4 things you can touch. Feel their texture.", duration: 12000 }, // 12 seconds
        { text: "Name 3 things you can hear right now. Listen carefully.", duration: 10000 }, // 10 seconds
        { text: "Name 2 things you can smell. If nothing is strong, imagine a favorite scent.", duration: 8000 }, // 8 seconds
        { text: "Name 1 thing you can taste. Perhaps take a sip of water.", duration: 8000 }, // 8 seconds
        { text: "Focus on your breath. Breathe in slowly for 4 counts.", duration: 5000 },
        { text: "Hold your breath gently for 4 counts.", duration: 5000 },
        { text: "Breathe out slowly for 6 counts.", duration: 7000 },
        { text: "Repeat the breath cycle: Inhale (4), Hold (4), Exhale (6).", duration: 17000 }, // Repeat 1x
        { text: "Notice your feet on the ground. Feel the support beneath you.", duration: 8000 },
        { text: "Wiggle your fingers and toes. Bring awareness back to your body.", duration: 8000 },
        { text: "You are present in this moment. The feeling is passing.", duration: 7000 },
    ]
};


function QuickReliefPage() {
    // The overlay should be visible as soon as this page loads
    const [isOverlayVisible, setIsOverlayVisible] = useState(true);
    const navigate = useNavigate();

    // Function to handle closing the overlay
    const handleCloseOverlay = () => {
        setIsOverlayVisible(false);
        // Navigate back to the previous page or a specific safe page (e.g., home)
        // Using navigate(-1) might be less predictable if the user landed here directly
        navigate('/home'); // Or navigate(-1) if appropriate
    };

    // --- Inline style to apply the imported background image ---
    const pageStyle = {
        backgroundImage: `url(${soothingBackground1})` // Use the imported image variable
        // If you wanted to cycle images based on state, you'd change the variable here
    };

    // Automatically set visibility to true when component mounts
    // (Redundant if default state is true, but ensures it shows on re-renders if state was somehow changed)
    useEffect(() => {
        setIsOverlayVisible(true);
    }, []);


    return (
        // Apply the container class and the inline background style
        <div className={styles.pageContainer} style={pageStyle}>
            {/*
                Render the QuickReliefOverlay component.
                It will appear centered due to its own fixed positioning
                and the background image from pageContainer will be behind it.
            */}
            <QuickReliefOverlay
                isVisible={isOverlayVisible}
                onClose={handleCloseOverlay}
                protocol={panicGroundingSequence} // Pass the sequence data
            />
        </div>
    );
}

export default QuickReliefPage;