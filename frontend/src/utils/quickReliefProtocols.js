export const reliefProtocols = {
    panic: {
        name: "Panic Grounding Sequence",
        description: "Focus on your senses to anchor yourself in the present moment during intense panic.",
        steps: [
            { text: "Acknowledge the feeling without judgment. Say: 'I am feeling panic, and it will pass.'", duration: 8000 },
            { text: "Plant your feet firmly on the ground. Feel the support beneath you.", duration: 10000 },
            { text: "Take a slow breath in through your nose (count 4)...", duration: 6000 },
            { text: "...hold gently (count 2)...", duration: 4000 },
            { text: "...then breathe out slowly through your mouth (count 6).", duration: 8000 },
            { text: "Repeat the breath: In (4)... Hold (2)... Out (6)...", duration: 12000 },
            { text: "Look around. Name 5 things you can SEE.", duration: 15000 },
            { text: "Listen closely. Name 4 sounds you can HEAR.", duration: 15000 },
            { text: "Notice physical sensations. Name 3 things you can FEEL (clothes, chair, air).", duration: 15000 },
            { text: "Identify 2 things you can SMELL (or imagine pleasant smells).", duration: 12000 },
            { text: "Identify 1 thing you can TASTE (or recall a pleasant taste).", duration: 10000 },
            { text: "Take another slow, deep breath. Notice the feeling easing.", duration: 10000 },
            { text: "You are safe. This feeling is temporary and it is passing.", duration: 8000 },
        ],
        // --- Added Enhancements ---
        musicFile: '/audio/audio1.mp3', // Path relative to /public
        themeGradient: 'linear-gradient(to bottom, #BBD2E1, #F0EBE8)', // Adjusted softer blue/beige
        completionMessage: "You've anchored yourself in the present. Well done."
    },
    highAnxiety: {
        name: "Anxiety Breathing Space",
        description: "Use controlled breathing to gently calm your nervous system when highly anxious.",
        steps: [
            { text: "Find a comfortable position, sitting or lying down.", duration: 6000 },
            { text: "Place one hand on your chest, the other on your belly.", duration: 6000 },
            { text: "Breathe in slowly through your nose, feeling your belly rise gently.", duration: 7000 },
            { text: "Breathe out slowly through pursed lips, as if blowing out a candle softly.", duration: 8000 },
            { text: "Focus completely on the gentle rhythm of your breath.", duration: 10000 },
            { text: "If your mind wanders, kindly bring your attention back to the breath.", duration: 10000 },
            { text: "Feel the calm deepening with each exhale.", duration: 10000 },
            { text: "Continue this smooth, gentle breathing.", duration: 15000 },
            { text: "Notice the feeling of quiet settling within you.", duration: 8000 },
        ],
         // --- Added Enhancements ---
        musicFile: '/audio/audio2.mp3', // Path relative to /public
        themeGradient: 'linear-gradient(to bottom, #C1E1C1, #F5FDF5)', // Soft green gradient
        completionMessage: "Your nervous system is calmer. Carry this peace."
    },
    overwhelm: {
        name: "Moment of Pause & Reset",
        description: "Create a brief, intentional space to step back and reset when feeling overwhelmed.",
         steps: [
            { text: "Pause. Stop what you are doing for just this moment.", duration: 5000 },
            { text: "Take three slow, deliberate breaths. Inhale calm... Exhale chaos...", duration: 15000 },
            { text: "Ask yourself kindly: 'What is ONE small, manageable step I can take next?'", duration: 12000 },
            { text: "If no step is needed right now, simply rest in this pause.", duration: 8000 },
            { text: "Gently roll your shoulders or stretch your neck if it feels good.", duration: 10000 },
            { text: "Acknowledge the feeling without judgment. 'It's okay to feel overwhelmed.'", duration: 7000 },
            { text: "Take one more deep, centering breath before you continue.", duration: 8000 },
        ],
         // --- Added Enhancements ---
        musicFile: '/audio/audio3.mp3', // Path relative to /public
        themeGradient: 'linear-gradient(to bottom, #D8BFD8, #FDF8FD)', // Soft lavender gradient
        completionMessage: "You created space. You can proceed more calmly now."
    }
    // Add more protocols here following the same structure
};

/**
 * Helper function to safely get a specific protocol object by name.
 * @param {string} protocolName - The key of the protocol (e.g., 'panic', 'highAnxiety').
 * @returns {object | null} The protocol object or null if not found.
 */
export const getReliefProtocol = (protocolName) => {
    // Check if the protocol exists before returning
    return reliefProtocols.hasOwnProperty(protocolName) ? reliefProtocols[protocolName] : null;
};