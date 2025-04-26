 // frontend/src/components/QuickReliefOverlay.js
// Updated Version: Fixes rendering error and implements auto-advancing steps

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay, FiPause, FiVolume2, FiVolumeX, FiCheckCircle } from 'react-icons/fi';
import './QuickReliefOverlay.css'; // Ensure this CSS file exists and is styled

// Main Overlay Component
const QuickReliefOverlay = ({ isVisible, onClose, protocol }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false); // Audio playing state
    const [isMuted, setIsMuted] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const audioRef = useRef(null); // Holds the <audio> element instance
    const stepTimeoutRef = useRef(null); // Holds the timeout ID for step advancement
    const closeTimeoutRef = useRef(null); // Holds the timeout ID for auto-closing

    // --- Safe Audio Playback ---
    const safePlayAudio = useCallback(() => {
        if (audioRef.current && audioRef.current.paused) { // Only play if paused
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Audio auto-play prevented:", error);
                setIsPlaying(false); // Reflect that it didn't play
            });
        } else if (audioRef.current && !audioRef.current.paused) {
             setIsPlaying(true); // Already playing
        }
    }, []);

    // --- Step Navigation & Completion Logic ---
    const handleNextStep = useCallback(() => {
        // Clear any existing step timeout *before* moving to the next step
        clearTimeout(stepTimeoutRef.current);

        if (protocol && currentStepIndex < protocol.steps.length - 1) {
            setCurrentStepIndex(prevIndex => prevIndex + 1);
        } else if (protocol && currentStepIndex >= protocol.steps.length - 1) {
            // Last step reached
            setShowCompletion(true);
            if (audioRef.current) {
                 audioRef.current.pause(); // Pause music on completion
                 setIsPlaying(false);
            }
            // Auto-close after a delay
            closeTimeoutRef.current = setTimeout(() => {
                handleClose(); // Use handleClose to ensure proper cleanup
            }, 3500); // Adjust delay as needed (e.g., 3.5 seconds)
        }
    }, [protocol, currentStepIndex]); // Removed onClose from deps, call handleClose instead

     // --- Close Handling (ensures cleanup) ---
     const handleClose = useCallback(() => {
        clearTimeout(stepTimeoutRef.current); // Clear step timer
        clearTimeout(closeTimeoutRef.current); // Clear auto-close timer
        if (audioRef.current) {
            audioRef.current.pause(); // Ensure audio stops
        }
        setIsPlaying(false);
        setShowCompletion(false); // Reset completion state
        setCurrentStepIndex(0); // Reset step index
        // Reset other states if needed before calling parent onClose
        onClose(); // Call the passed-in onClose function
    }, [onClose]);


    // --- Effect for Audio Setup & Initial State Reset ---
    useEffect(() => {
        // Reset states when the overlay becomes visible with a new protocol
        if (isVisible && protocol) {
            setCurrentStepIndex(0);
            setShowCompletion(false);
            clearTimeout(closeTimeoutRef.current); // Clear any lingering close timeout

            // Audio Setup
            if (protocol.musicFile) {
                if (!audioRef.current || audioRef.current.src !== protocol.musicFile) {
                     if (audioRef.current) audioRef.current.pause(); // Stop previous
                    audioRef.current = new Audio(protocol.musicFile);
                    audioRef.current.loop = true;
                    audioRef.current.muted = isMuted;
                    audioRef.current.volume = 0.6; // Adjust default volume
                }
                safePlayAudio(); // Attempt to play new/existing audio
            } else {
                // No music for this protocol, ensure cleanup
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null; // Remove audio element if none needed
                }
                setIsPlaying(false);
            }
        } else if (!isVisible) {
             // Cleanup when overlay hides
             if (audioRef.current) {
                 audioRef.current.pause();
             }
             setIsPlaying(false); // Ensure state is false when hidden
             clearTimeout(stepTimeoutRef.current);
             clearTimeout(closeTimeoutRef.current);
        }

        // Cleanup function for when the component unmounts completely
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                // Optionally nullify audioRef here if needed for garbage collection,
                // but pausing might be sufficient.
                // audioRef.current = null;
            }
            clearTimeout(stepTimeoutRef.current);
            clearTimeout(closeTimeoutRef.current);
        };
    }, [isVisible, protocol, isMuted, safePlayAudio]); // Rerun when these change

    // --- Effect for Auto-Advancing Steps ---
    useEffect(() => {
        // Clear previous timeout if effect re-runs before timeout completes
        clearTimeout(stepTimeoutRef.current);

        // Conditions to run the timer: visible, protocol exists, not completed yet
        if (isVisible && protocol && !showCompletion) {
            const currentStep = protocol.steps?.[currentStepIndex];
            const duration = currentStep?.duration;

            // Only set timeout if duration is valid (positive number)
            if (typeof duration === 'number' && duration > 0) {
                stepTimeoutRef.current = setTimeout(() => {
                    handleNextStep(); // Advance to next step or completion
                }, duration);
            } else {
                // Handle steps with no duration or invalid duration?
                // Maybe log a warning or require manual advance for those?
                // For now, it just won't auto-advance.
                console.warn(`Step ${currentStepIndex} has invalid or zero duration.`);
            }
        }

        // Cleanup: Clear timeout if dependencies change or component unmounts
        return () => {
            clearTimeout(stepTimeoutRef.current);
        };
    // This effect depends on the current step, protocol, visibility, and completion state
    }, [currentStepIndex, protocol, isVisible, showCompletion, handleNextStep]);


    // --- Audio Controls ---
    const togglePlayPause = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            safePlayAudio(); // Use safe play which updates state on success/fail
        }
        // We no longer pause the step timer when music pauses, let exercise continue.
    }, [isPlaying, safePlayAudio]);

    const toggleMute = useCallback(() => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (audioRef.current) {
            audioRef.current.muted = newMutedState;
        }
    }, [isMuted]);


    // --- Dynamic Styling & Content ---
    const overlayStyle = {
        background: protocol?.themeGradient || 'linear-gradient(to bottom, #f0f4f8, #ffffff)',
    };
    // Safely get current step text
    const currentStepText = protocol?.steps?.[currentStepIndex]?.text ?? ''; // Use nullish coalescing


    // --- Framer Motion Variants --- (Keep your existing variants)
    const overlayVariants = {
        hidden: { opacity: 0, scale: 1.05 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3, ease: "easeIn" } }
    };
    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
    };
     const completionVariants = {
      hidden: { opacity: 0, scale: 0.8 },
      visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 150, damping: 15 } },
    };

    return (
        <AnimatePresence>
            {isVisible && protocol && (
                <motion.div
                    className="quick-relief-overlay"
                    style={overlayStyle}
                    variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
                    aria-modal="true" role="dialog" aria-labelledby="quick-relief-title"
                >
                    {/* Close Button */}
                    <button onClick={handleClose} className="overlay-close-button" aria-label="Close relief exercise">
                        <FiX size={24} />
                    </button>

                    <motion.div className="overlay-content" variants={contentVariants}>

                        {/* --- Completion Message View --- */}
                        {showCompletion ? (
                             <motion.div
                                className="completion-message-container"
                                variants={completionVariants} initial="hidden" animate="visible"
                             >
                                <FiCheckCircle size={40} className="completion-icon" />
                                <p>{protocol.completionMessage || "Exercise Complete!"}</p>
                            </motion.div>
                        ) : (
                        /* --- Active Exercise View --- */
                        <>
                            <h2 id="quick-relief-title" className="overlay-title">{protocol.name}</h2>

                            {/* CORRECTED: Displaying step TEXT */}
                            <div className="steps-container">
                                <motion.p
                                    key={currentStepIndex} // Add key to force re-render animation on step change
                                    className="step-instruction"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {currentStepText}
                                </motion.p>
                                <span className="step-counter">
                                    Step {currentStepIndex + 1} of {protocol.steps.length}
                                </span>
                            </div>

                            {/* No longer need separate timer component or Next button */}

                            {/* Audio Controls */}
                            {protocol.musicFile && (
                                <div className="audio-controls">
                                    <button onClick={togglePlayPause} aria-label={isPlaying ? "Pause music" : "Play music"}>
                                        {isPlaying ? <FiPause /> : <FiPlay />}
                                    </button>
                                    <button onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
                                        {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                                    </button>
                                </div>
                            )}
                        </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickReliefOverlay;