// frontend/src/components/MicroBreakOverlay.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MicroBreakOverlay.css'; // Link to its CSS file

// --- Animation Variants ---
// Text fading in/out
const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: 'easeIn' } }
};

// Overlay background fade
const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } },
    exit: { opacity: 0, transition: { duration: 0.5 } }
};

// --- Component ---
// Props: isVisible (boolean), onClose (function), exercise (object with steps)
const MicroBreakOverlay = ({ isVisible, onClose, exercise }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const timerRef = useRef(null); // Ref to store setTimeout ID

    // Effect to control the step progression based on exercise durations
    useEffect(() => {
        // Helper function to clear any existing timer
        const clearTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        // Only run the timer logic if overlay is visible and a valid exercise is provided
        if (isVisible && exercise && exercise.steps && exercise.steps.length > 0) {
            // Reset to the first step when overlay becomes visible or exercise changes
            setCurrentStepIndex(0);

            // Function to advance to the next step after the current step's duration
            const advanceStep = (index) => {
                // Check if it's not the last step
                if (index < exercise.steps.length - 1) {
                    // Set a timer for the duration of the *current* step
                    timerRef.current = setTimeout(() => {
                        setCurrentStepIndex(prevIndex => prevIndex + 1); // Go to next step
                    }, exercise.steps[index].duration);
                } else {
                    // It's the last step, set timer to close the overlay after its duration
                    timerRef.current = setTimeout(() => {
                        onClose(); // Call the parent's close handler
                    }, exercise.steps[index].duration);
                }
            };

            // Start the timer sequence for the first step (index 0)
            advanceStep(0);

        } else {
            // If not visible or no valid exercise, clear timer and reset index
            clearTimer();
            setCurrentStepIndex(0); // Reset index
        }

        // Cleanup function: Clear timer on component unmount or before effect re-runs
        return clearTimer;

    }, [isVisible, exercise, onClose]); // Dependencies: Re-run effect if these change

    // Get the current step object based on the index
    const currentStep = (isVisible && exercise?.steps?.[currentStepIndex])
        ? exercise.steps[currentStepIndex]
        : null;

    return (
        // AnimatePresence handles the mounting/unmounting animation of the overlay
        <AnimatePresence>
            {/* Conditionally render the overlay only if it should be visible and we have a valid step */}
            {isVisible && currentStep && (
                <motion.div
                    className="micro-break-overlay" // Main overlay container class
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    // Optional: Allow closing by clicking the background
                    // onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}
                    role="dialog" // Accessibility role
                    aria-modal="true"
                    aria-label={`${exercise.name || 'Micro-break'} overlay`}
                >
                    {/* Use AnimatePresence again for the text transition animation */}
                    {/* mode="wait" ensures the exiting text finishes animating before the new one enters */}
                    <AnimatePresence mode="wait">
                         {/* Use step index as key to trigger animation on step change */}
                        <motion.p
                            key={currentStepIndex}
                            className="micro-break-text" // Class for the instruction text
                            variants={textVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {currentStep.text}
                        </motion.p>
                    </AnimatePresence>

                     {/* Optional: Add an explicit close button */}
                      <button
                        className="micro-break-close-btn"
                        onClick={onClose}
                        aria-label="Close micro-break"
                      >
                        × {/* Simple 'x' character */}
                      </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MicroBreakOverlay;