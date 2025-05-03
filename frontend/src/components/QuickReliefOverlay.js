// frontend/src/components/QuickReliefOverlay.js
// Corrected Version: Uses backgroundImage prop for styling

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay, FiPause, FiVolume2, FiVolumeX, FiCheckCircle } from 'react-icons/fi';
import './QuickReliefOverlay.css'; // Ensure this CSS file exists and is styled

// Main Overlay Component
const QuickReliefOverlay = ({ isVisible, onClose, protocol }) => {
    // --- State Hooks (Keep as is) ---
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const audioRef = useRef(null);
    const stepTimeoutRef = useRef(null);
    const closeTimeoutRef = useRef(null);

    // --- Callback Hooks (Keep as is) ---
    const safePlayAudio = useCallback(() => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(error => {
                console.warn("Audio auto-play prevented:", error);
                setIsPlaying(false);
            });
        } else if (audioRef.current && !audioRef.current.paused) {
             setIsPlaying(true);
        }
    }, []);

    const handleNextStep = useCallback(() => {
        clearTimeout(stepTimeoutRef.current);
        if (protocol && currentStepIndex < protocol.steps.length - 1) {
            setCurrentStepIndex(prevIndex => prevIndex + 1);
        } else if (protocol && currentStepIndex >= protocol.steps.length - 1) {
            setShowCompletion(true);
            if (audioRef.current) {
                 audioRef.current.pause();
                 setIsPlaying(false);
            }
            closeTimeoutRef.current = setTimeout(() => {
                handleClose();
            }, 3500);
        }
    // Add handleClose dependency if its logic ever needs currentStepIndex/protocol
    }, [protocol, currentStepIndex]);

     const handleClose = useCallback(() => {
        clearTimeout(stepTimeoutRef.current);
        clearTimeout(closeTimeoutRef.current);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setShowCompletion(false);
        setCurrentStepIndex(0);
        onClose();
    }, [onClose]);

    const togglePlayPause = useCallback(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            safePlayAudio();
        }
    }, [isPlaying, safePlayAudio]);

    const toggleMute = useCallback(() => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (audioRef.current) {
            audioRef.current.muted = newMutedState;
        }
    }, [isMuted]);


    // --- Effect Hooks (Keep as is) ---
    useEffect(() => {
        if (isVisible && protocol) {
            setCurrentStepIndex(0);
            setShowCompletion(false);
            clearTimeout(closeTimeoutRef.current);
            if (protocol.musicFile) {
                if (!audioRef.current || !audioRef.current.src.endsWith(protocol.musicFile)) {
                     if (audioRef.current) audioRef.current.pause();
                    audioRef.current = new Audio(protocol.musicFile);
                    audioRef.current.loop = true;
                    audioRef.current.muted = isMuted;
                    audioRef.current.volume = 0.6;
                }
                safePlayAudio();
            } else {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                setIsPlaying(false);
            }
        } else if (!isVisible) {
             if (audioRef.current) {
                 audioRef.current.pause();
             }
             setIsPlaying(false);
             clearTimeout(stepTimeoutRef.current);
             clearTimeout(closeTimeoutRef.current);
        }
        return () => {
             if (audioRef.current) {
                audioRef.current.pause();
             }
            clearTimeout(stepTimeoutRef.current);
            clearTimeout(closeTimeoutRef.current);
        };
    }, [isVisible, protocol, isMuted, safePlayAudio, handleClose]); // Added handleClose

    useEffect(() => {
        clearTimeout(stepTimeoutRef.current);
        if (isVisible && protocol && !showCompletion) {
            const currentStep = protocol.steps?.[currentStepIndex];
            const duration = currentStep?.duration;
            if (typeof duration === 'number' && duration > 0) {
                stepTimeoutRef.current = setTimeout(() => {
                    handleNextStep();
                }, duration);
            } else {
                console.warn(`Step ${currentStepIndex} has invalid or zero duration.`);
            }
        }
        return () => {
            clearTimeout(stepTimeoutRef.current);
        };
    }, [currentStepIndex, protocol, isVisible, showCompletion, handleNextStep]);


    // --- Dynamic Styling & Content ---
    // <<< THIS IS THE CORRECTED CODE >>>
    const overlayStyle = {
        // Set background image dynamically using the path passed in the protocol object
        backgroundImage: protocol?.backgroundImage ? `url(${protocol.backgroundImage})` : 'none', // Use image path or fallback
        // You could add a semi-transparent gradient OVER the image like this:
        // backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${protocol?.backgroundImage})`,
    };
    // <<< END CORRECTED CODE >>>

    const currentStepText = protocol?.steps?.[currentStepIndex]?.text ?? '';


    // --- Framer Motion Variants (Keep as is) ---
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
                    className="quick-relief-overlay" // CSS class defines size/position/repeat etc.
                    style={overlayStyle}              // Inline style applies the specific image URL
                    variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
                    aria-modal="true" role="dialog" aria-labelledby="quick-relief-title"
                >
                    {/* Close Button */}
                    <button onClick={handleClose} className="overlay-close-button" aria-label="Close relief exercise">
                        <FiX size={24} />
                    </button>

                    {/* Content Box (Has its own background in CSS) */}
                    <motion.div className="overlay-content" variants={contentVariants}>

                        {/* --- Completion Message View (Keep as is) --- */}
                        {showCompletion ? (
                             <motion.div
                                className="completion-message-container"
                                variants={completionVariants} initial="hidden" animate="visible"
                             >
                                <FiCheckCircle size={40} className="completion-icon" />
                                <p>{protocol.completionMessage || "Exercise Complete!"}</p>
                            </motion.div>
                        ) : (
                        /* --- Active Exercise View (Keep as is) --- */
                        <>
                            <h2 id="quick-relief-title" className="overlay-title">{protocol.name}</h2>
                            <div className="steps-container">
                                <motion.p
                                    key={currentStepIndex}
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