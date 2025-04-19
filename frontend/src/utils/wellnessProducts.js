// frontend/src/utils/wellnessProducts.js

// ---vvv--- Ensure these imports match your ACTUAL filenames in src/assets ---vvv---
import weightedBlanketImg from '../assets/Blanket.jpg';
import sunriseClockImg from '../assets/sunRiseAlarm.jpg';
import journalSetImg from '../assets/Journal.jpg';
import diffuserKitImg from '../assets/Diffuser.jpg';
import sadLampImg from '../assets/LightTherapy.jpg';
import sensoryStripsImg from '../assets/CalmStrips.webp';
import mindfulnessCardsImg from '../assets/MindfulnessCards.jpg';
import teaCollectionImg from '../assets/TranquilTea.webp';
import meditationCushionImg from '../assets/Cushion.jpeg';
// Import your placeholder image
import placeholderImg from '../assets/download.png'; // Or your chosen placeholder (e.g., placeholder.png)
// ---^^^--- END IMAGE IMPORTS ---^^^---


const wellnessProducts = [
  {
    id: "prod_001",
    name: "The Anchor Weighted Blanket",
    description: "Experience a calming embrace with this premium weighted blanket. Designed to provide gentle, distributed pressure, it helps soothe the nervous system and promote relaxation.",
    benefit: "Stress Relief, Anxiety Reduction, Sleep Improvement",
    type: "Physical",
    priceUSD: "99.99", // <-- REPLACE with actual price string
    imageUrl: weightedBlanketImg,
    productUrl: "https://your-store.com/products/anchor-weighted-blanket" // <-- REPLACE with actual store URL
  },
  {
    id: "prod_002",
    name: "Dawn Simulation Alarm Clock",
    description: "Wake up naturally and gently with light that gradually mimics the sunrise. Helps regulate your sleep cycle and can improve mood.",
    benefit: "Sleep Regulation, Mood Support, Gentle Wake-Up",
    type: "Physical",
    priceUSD: "49.95", // <-- REPLACE with actual price string
    imageUrl: sunriseClockImg,
    productUrl: "https://your-store.com/products/dawn-simulation-alarm-clock" // <-- REPLACE with actual store URL
  },
  {
    id: "prod_003",
    name: "Mindful Reflection Journal & Pen Set",
    description: "A beautifully designed journal with guided prompts to encourage daily reflection, gratitude, and emotional awareness.",
    benefit: "Mindfulness, Mood Tracking, Self-Awareness, Gratitude",
    type: "Physical",
    priceUSD: "28.50", // <-- REPLACE with actual price string
    imageUrl: journalSetImg,
    productUrl: "https://your-store.com/products/mindful-reflection-journal-set" // <-- REPLACE with actual store URL
  },
  {
    id: "prod_004",
    name: "CalmScapes Aromatherapy Starter Kit",
    description: "Create a tranquil atmosphere with this elegant diffuser and a curated set of three pure essential oils.",
    benefit: "Stress Relief, Relaxation, Sleep Preparation",
    type: "Physical",
    priceUSD: "55.00", // <-- REPLACE
    imageUrl: diffuserKitImg,
    productUrl: "https://your-store.com/products/calmscapes-kit" // <-- REPLACE
  },
  {
    id: "prod_005",
    name: "Portable Light Therapy Lamp (SAD Lamp)",
    description: "Boost your mood and energy with this compact, UV-free light therapy lamp providing bright light exposure.",
    benefit: "Mood Support, Energy Boost, SAD Relief, Circadian Rhythm",
    type: "Physical",
    priceUSD: "39.99", // <-- REPLACE
    imageUrl: sadLampImg,
    productUrl: "https://your-store.com/products/sad-lamp" // <-- REPLACE
  },
  {
    id: "prod_006",
    name: "Sensory Grounding Strips (Texture Pack)",
    description: "A discreet pack of textured adhesive strips designed for tactile grounding during moments of anxiety or sensory overload.",
    benefit: "Anxiety Reduction, Grounding, Sensory Regulation, Focus Aid",
    type: "Physical",
    priceUSD: "14.95", // <-- REPLACE
    imageUrl: sensoryStripsImg,
    productUrl: "https://your-store.com/products/sensory-strips" // <-- REPLACE
  },
  {
    id: "prod_007",
    name: "'Present Moment' Mindfulness Card Deck",
    description: "A deck of beautifully illustrated cards, each featuring a simple mindfulness exercise or reflection prompt.",
    benefit: "Mindfulness Practice, Stress Reduction, Self-Awareness",
    type: "Physical",
    priceUSD: "19.99", // <-- REPLACE
    imageUrl: mindfulnessCardsImg,
    productUrl: "https://your-store.com/products/mindfulness-cards" // <-- REPLACE
  },
  {
    id: "prod_008",
    name: "Tranquil Teas Wellness Collection",
    description: "A curated selection of high-quality, caffeine-free herbal teas known for their calming properties.",
    benefit: "Relaxation, Sleep Preparation, Stress Relief Ritual",
    type: "Physical (Consumable)",
    priceUSD: "24.50", // <-- REPLACE
    imageUrl: teaCollectionImg,
    productUrl: "https://your-store.com/products/tranquil-teas" // <-- REPLACE
  },
  {
    id: "prod_009",
    name: "Supportive Sitting Meditation Cushion (Zafu)",
    description: "Enhance your meditation practice with this firm yet comfortable cushion. Promotes proper posture and comfort.",
    benefit: "Mindfulness Support, Meditation Comfort, Posture Aid",
    type: "Physical",
    priceUSD: "42.00", // <-- REPLACE
    imageUrl: meditationCushionImg,
    productUrl: "https://your-store.com/products/zafu-cushion" // <-- REPLACE
  }
];

// Export the placeholder image as a named export for use in components
export const placeholderImage = placeholderImg;

// Export the product array as the default export
export default wellnessProducts;