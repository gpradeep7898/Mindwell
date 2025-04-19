// frontend/src/utils/quickReliefProtocols.js

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
            { text: "Look around. Name 5 things you can see.", duration: 15000 },
            { text: "Listen closely. Name 4 sounds you can hear.", duration: 15000 },
            { text: "Notice physical sensations. Name 3 things you can feel (clothes, chair, air).", duration: 15000 },
            { text: "Identify 2 things you can smell (or imagine pleasant smells).", duration: 12000 },
            { text: "Identify 1 thing you can taste (or recall a pleasant taste).", duration: 10000 },
            { text: "Take another slow, deep breath. Notice the feeling easing.", duration: 10000 },
            { text: "You are safe. This feeling is temporary and it is passing.", duration: 8000 },
        ]
    },
    highAnxiety: {
        name: "Anxiety Breathing Space",
        description: "Use controlled breathing to gently calm your nervous system when highly anxious.",
        steps: [
            { text: "Find a comfortable position, sitting or lying down.", duration: 6000 },
            { text: "Place one hand on your chest, the other on your belly.", duration: 6000 },
            { text: "Breathe in slowly through your nose, feeling your belly rise.", duration: 7000 },
            { text: "Breathe out slowly through pursed lips, feeling your belly fall.", duration: 8000 },
            { text: "Focus completely on the gentle rise and fall.", duration: 10000 },
            { text: "If your mind wanders, gently guide it back to your breath.", duration: 10000 },
            { text: "Inhale calm... Exhale tension...", duration: 10000 },
            { text: "Continue breathing smoothly and gently.", duration: 15000 },
            { text: "Notice the slight slowing down within you.", duration: 8000 },
        ]
    },
    overwhelm: {
        name: "Moment of Pause",
        description: "Create a brief, intentional space to reset when feeling overwhelmed.",
         steps: [
            { text: "Pause. Stop what you are doing for just this moment.", duration: 5000 },
            { text: "Take three slow, deliberate breaths. Inhale deeply... Exhale fully...", duration: 15000 },
            { text: "Ask: 'What is the *one* single thing I need to focus on next?' (If anything)", duration: 12000 },
            { text: "If nothing is truly urgent, allow yourself this quiet space.", duration: 8000 },
            { text: "Gently stretch your neck or roll your shoulders if you like.", duration: 10000 },
            { text: "Acknowledge the feeling of overwhelm without judgment. It's okay.", duration: 7000 },
            { text: "Take one more grounding breath before you gently return.", duration: 8000 },
        ]
    }
    // Add more protocols here (e.g., for anger, sadness) following the same structure
};

// Helper function to safely get a specific protocol by name
export const getReliefProtocol = (protocolName) => {
    return reliefProtocols[protocolName] || null; // Return null if name doesn't exist
};