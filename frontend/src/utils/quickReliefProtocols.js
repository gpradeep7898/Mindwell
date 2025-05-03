// frontend/src/utils/quickReliefProtocols.js
// Defines the data for each relief exercise, including background images.

// --- Import Background Images ---
// Adjust paths if your assets folder is located differently relative to this utils folder
import panicBackground from '../assets/soothing1.jpeg';
import anxiousBackground from '../assets/soothing2.webp';
import overwhelmBackground from '../assets/soothing3.jpg';
// Consider importing a default background if needed for future protocols
// import defaultBackground from '../assets/default-calm.jpg';

// --- Define Protocol Data ---
export const reliefProtocols = {
    // Key 'panic' MUST match the string used in QuickRelief.js onClick
    panic: {
        id: 'panic',
        name: "Panic Grounding Sequence",
        description: "Grounding exercise using your senses to anchor you during intense panic.",
        themeGradient: 'linear-gradient(to bottom, #f8d7da, #f5e6e8)', // Optional: Fallback gradient for overlay card
        musicFile: '/audio/audio1.mp3', // Path relative to PUBLIC folder
        backgroundImage: panicBackground, // <<< Image imported and assigned here
        completionMessage: "You've completed the grounding sequence. Take a deep breath.",
        steps: [
             { text: "Acknowledge the feeling without judgment. Say: 'I am feeling panic, and it will pass.'", duration: 8000 },
             { text: "Name 5 things you can SEE around you. Look closely at each item.", duration: 15000 },
             { text: "Name 4 things you can TOUCH. Feel their texture.", duration: 12000 },
             { text: "Name 3 things you can HEAR right now. Listen carefully.", duration: 10000 },
             { text: "Name 2 things you can SMELL. If nothing strong, imagine a favorite scent.", duration: 8000 },
             { text: "Name 1 thing you can TASTE. Perhaps take a sip of water.", duration: 8000 },
             { text: "Focus on your breath. Feel your feet on the ground.", duration: 10000 },
        ]
    },
    // Key 'highAnxiety' MUST match the string used in QuickRelief.js onClick
    highAnxiety: {
        id: 'highAnxiety',
        name: "Breathing Space",
        description: "Use controlled breathing to gently calm your nervous system when highly anxious.",
        themeGradient: 'linear-gradient(to bottom, #cce5ff, #e6f0ff)',
        musicFile: '/audio/audio2.mp3', // Path relative to PUBLIC folder
        backgroundImage: anxiousBackground, // <<< Image imported and assigned here
        completionMessage: "You've created space with your breath. Carry this calm forward.",
        steps: [
            { text: "Notice your current feeling and thoughts without judgment.", duration: 8000 },
            { text: "Bring your awareness fully to your breath. Feel the rise and fall.", duration: 10000 },
            { text: "Breathe IN slowly through your nose, counting to 4.", duration: 5000 },
            { text: "Breathe OUT slowly through your mouth or nose, counting to 6.", duration: 7000 },
            { text: "Continue this rhythm: Inhale 4, Exhale 6.", duration: 12000 },
            { text: "Expand your awareness gently to your whole body sitting here.", duration: 10000 },
            { text: "When ready, gently open your eyes, carrying this awareness.", duration: 8000 },
        ]
    },
    // Key 'overwhelm' MUST match the string used in QuickRelief.js onClick
    overwhelm: {
        id: 'overwhelm',
        name: "Take a Pause",
        description: "Create a brief, intentional space to step back and reset when feeling overwhelmed.",
        themeGradient: 'linear-gradient(to bottom, #d4edda, #eaf6ec)',
        musicFile: '/audio/audio3.mp3', // Path relative to PUBLIC folder
        backgroundImage: overwhelmBackground, // <<< Image imported and assigned here
        completionMessage: "You took a moment to pause and reset. Well done.",
        steps: [
             { text: "Stop what you are doing for a moment.", duration: 5000 },
             { text: "Find a comfortable sitting or standing position.", duration: 7000 },
             { text: "If comfortable, close your eyes gently or lower your gaze.", duration: 5000 },
             { text: "Take three slow, deep breaths, noticing the air.", duration: 15000 },
             { text: "Ask yourself gently: 'What is truly needed right now?'", duration: 10000 },
             { text: "Acknowledge the feeling of overwhelm, letting it be there for a moment.", duration: 8000 },
             { text: "Intentionally relax your shoulders, jaw, and the space between your eyebrows.", duration: 10000 },
             { text: "When ready, slowly return your attention to your surroundings.", duration: 7000 },
        ]
    }
    // Add more protocols here following the same structure
};

// --- Function to get a specific protocol object by its key ---
export const getReliefProtocol = (protocolName) => {
    // Returns the object (including backgroundImage) or null if the key doesn't exist
    return reliefProtocols[protocolName] || null;
};