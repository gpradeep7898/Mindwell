// frontend/src/components/QuickReliefOverlay.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Reuse the same CSS or create a specific one if needed
import './MicroBreakOverlay.css';

// Reuse animation variants or define specific ones
const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }, // Slightly slower?
    exit: { opacity: 0, y: -10, transition: { duration: 0.4, ease: 'easeIn' } }
};

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.6 } }
};

// Component Props: isVisible (boolean), onClose (function), protocol (object with steps)
const QuickReliefOverlay = ({ isVisible, onClose, protocol }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const timerRef = useRef(null); // Ref to store setTimeout ID

    // Effect for step progression (identical logic to MicroBreakOverlay, just uses 'protocol')
    useEffect(() => {
        const clearTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        if (isVisible && protocol && protocol.steps && protocol.steps.length > 0) {
            setCurrentStepIndex(0);

            const advanceStep = (index) => {
                if (index < protocol.steps.length - 1) {
                    timerRef.current = setTimeout(() => {
                        setCurrentStepIndex(prevIndex => prevIndex + 1);
                    }, protocol.steps[index].duration); // Use duration from protocol step
                } else {
                    // Last step: close after duration
                    timerRef.current = setTimeout(() => {
                        onClose();
                    }, protocol.steps[index].duration);
                }
            };
            advanceStep(0);
        } else {
            clearTimer();
            setCurrentStepIndex(0);
        }
        return clearTimer;
    }, [isVisible, protocol, onClose]); // Depend on protocol object

    // Get the current step based on index
    const currentStep = (isVisible && protocol?.steps?.[currentStepIndex])
        ? protocol.steps[currentStepIndex]
        : null;

    return (
        <AnimatePresence>
            {isVisible && currentStep && (
                <motion.div
                    // Add a specific class for potential style overrides
                    className="micro-break-overlay quick-relief-overlay"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${protocol.name || 'Quick relief'} session`}
                >
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={currentStepIndex}
                             // Add a specific class for potential style overrides
                            className="micro-break-text quick-relief-text"
                            variants={textVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {currentStep.text}
                        </motion.p>
                    </AnimatePresence>

                    {/* Explicit close button is good for relief scenarios */}
                     <button
                        className="micro-break-close-btn" // Can reuse style
                        onClick={onClose}
                        aria-label="Close relief session"
                     >
                        ×
                     </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default QuickReliefOverlay;