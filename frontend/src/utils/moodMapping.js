// frontend/src/utils/moodMapping.js

// Define a numerical scale (adjust values as needed for your desired visual spacing)
export const moodToValue = {
    // Positive High Energy
    Excited: 5.0,
    Joyful: 4.7,
    Happy: 4.5,
    // Positive Calm
    Grateful: 4.0,
    Content: 3.7,
    Proud: 3.5, // Added
    // Neutral / Mid
    Okay: 3.0,
    Hopeful: 2.8, // Added
    // Negative Lower Energy / Calm
    Nostalgic: 2.5, // Added
    Tired: 2.3,
    Disappointed: 2.0,
    Sad: 1.8,
    // Negative Higher Energy / Agitation
    Apprehensive: 1.5,
    Anxious: 1.2,
    Stressed: 1.0,
    Embarrassed: 0.8, // Added
    Ashamed: 0.7, // Added
    Afraid: 0.5,
    Angry: 0.3, // Added
    Devastated: 0.1, // Added
    // Fallback
    'Not specified': 2.7 // Place somewhere neutral if mood isn't specified
  };

  // Define colors based on your Aura Palette (Use CSS variables if defined globally)
  export const moodToColor = {
    // Positive High Energy
    Excited: 'var(--color-accent-1, #FFB6A7)', // Peach/Orange Tones
    Joyful: '#FFD700', // Gold/Yellow
    Happy: 'var(--color-primary-light, #bcead5)', // Light Mint/Green
    // Positive Calm
    Grateful: '#FFC8A7', // Soft Peach
    Content: 'var(--color-primary, #A0D2DB)', // Aura Blue
    Proud: '#87CEEB', // Sky Blue
     // Neutral / Mid
    Okay: 'var(--color-text-lighter, #a0a4bf)', // Neutral Grey
    Hopeful: '#98FB98', // Pale Green
    // Negative Lower Energy / Calm
    Nostalgic: '#D8BFD8', // Thistle/Light Purple
    Tired: '#BAB9DF', // Light Lavender Grey
    Disappointed: '#A9A7CE', // Medium Lavender Grey
    Sad: '#9FA5D0', // Deeper Lavender Blue/Grey
    // Negative Higher Energy / Agitation
    Apprehensive: 'var(--color-secondary, #E6E6FA)', // Very Light Lavender
    Anxious: '#C4C0E1', // Greyish Lavender
    Stressed: '#B2B0D7', // Slightly Darker Greyish Lavender
    Embarrassed: '#FFC0CB', // Pink
    Ashamed: '#FFA07A', // Light Salmon
    Afraid: '#8E94C0', // Darker Blue/Grey
    Angry: '#F08080', // Light Coral / Reddish
    Devastated: 'var(--color-text-light, #7a7e9a)', // Dark Grey
    // Fallback
    'Not specified': '#CCCCCC' // Simple Grey
  };

  // Define radius (e.g., slightly larger if there's a journal entry)
  export const moodToRadius = (moodEntry) => {
      // Basic check: if journal text exists and isn't just whitespace
      return moodEntry?.journal && moodEntry.journal.trim() !== '' ? 5.5 : 4;
  };