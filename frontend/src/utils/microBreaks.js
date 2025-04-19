// frontend/src/utils/microBreaks.js

export const microBreakExercises = [
    {
        name: "Grounding: 3 Senses",
        steps: [
            { text: "Take one slow, gentle breath in...", duration: 4000 },
            { text: "...and out.", duration: 5000 },
            { text: "Notice 3 things you can see right now.", duration: 8000 },
            { text: "Notice 2 things you can hear.", duration: 8000 },
            { text: "Notice 1 thing you can feel (e.g., feet on floor, chair beneath you).", duration: 8000 },
            { text: "Another slow breath in...", duration: 4000 },
            { text: "...and out. Returning to your day.", duration: 5000 },
        ]
    },
    {
        name: "Mindful Breath",
        steps: [
            { text: "Gently close your eyes or soften your gaze.", duration: 5000 },
            { text: "Bring your awareness to your breath.", duration: 5000 },
            { text: "Notice the air moving in...", duration: 7000 },
            { text: "...and the air moving out.", duration: 7000 },
            { text: "Just observing, without changing anything.", duration: 8000 },
            { text: "Taking one more gentle breath.", duration: 6000 },
            { text: "Now, slowly bring your awareness back.", duration: 5000 },
        ]
    },
    {
        name: "Body Scan Moment",
        steps: [
            { text: "Find a comfortable posture.", duration: 4000 },
            { text: "Bring your attention to the feeling of your feet.", duration: 8000 },
            { text: "Notice any sensations in your legs.", duration: 8000 },
            { text: "Shift awareness to your hands. Are they tense or relaxed?", duration: 8000 },
            { text: "Notice your shoulders. Can you soften them slightly?", duration: 8000 },
            { text: "Take a gentle breath.", duration: 6000 },
        ]
    },
    {
        name: "Quick Stretch & Breathe",
        steps: [
            { text: "If comfortable, gently stretch your arms upwards.", duration: 6000 },
            { text: "Take a slow breath in as you reach.", duration: 5000 },
            { text: "Exhale slowly as you lower your arms.", duration: 6000 },
            { text: "Gently roll your shoulders back and down.", duration: 7000 },
            { text: "One more easy breath.", duration: 6000 },
        ]
    }
    // Add more exercises following the same structure
];

// Helper function to get a random exercise from the list
export const getRandomExercise = () => {
    if (!microBreakExercises || microBreakExercises.length === 0) {
        // Fallback or handle case where no exercises are defined
        return { name: "Simple Breath", steps: [{ text: "Take a slow breath in and out.", duration: 10000 }] };
    }
    const randomIndex = Math.floor(Math.random() * microBreakExercises.length);
    return microBreakExercises[randomIndex];
};