const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config();

// Define Firebase Service Account Path
const serviceAccountPath = path.join(__dirname, "firebaseServiceAccount.json");

// Load Firebase Service Account
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error("❌ Error loading Firebase service account:", error.message);
  process.exit(1);
}

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Emotion Mapping
const emotionKeywords = {
  sad: ["sad", "depressed", "lonely", "down", "unhappy"],
  anxious: ["anxious", "nervous", "stressed", "worried", "overwhelmed"],
  afraid: ["afraid", "scared", "terrified", "fearful"],
  disappointed: ["disappointed", "let down", "discouraged"],
  devastated: ["devastated", "heartbroken", "shattered"],
  embarrassed: ["embarrassed", "ashamed", "awkward"],
  ashamed: ["ashamed", "guilty", "regretful"],
  apprehensive: ["apprehensive", "uncertain", "hesitant"],
  angry: ["angry", "frustrated", "mad", "furious"],
  joyful: ["happy", "joyful", "excited", "thrilled", "ecstatic"],
  hopeful: ["hopeful", "optimistic", "positive"],
  content: ["content", "satisfied", "at peace"],
  impressed: ["impressed", "amazed", "astonished"],
  nostalgic: ["nostalgic", "missing", "memories"],
  grateful: ["grateful", "thankful", "appreciative"],
  proud: ["proud", "accomplished", "fulfilled"],
  prepared: ["prepared", "ready", "confident"],
  trusting: ["trusting", "reliable", "secure"],
  caring: ["caring", "kind", "compassionate"],
  furious: ["furious", "rage", "outraged"],
  disgusted: ["disgusted", "grossed out", "repulsed"],
  surprised: ["surprised", "shocked", "amazed"],
  faithful: ["faithful", "loyal", "devoted"],
  sentimental: ["sentimental", "emotional", "heartfelt"],
};

// ✅ Emotion-Based Responses
const responses = {
  sad: "I'm really sorry you're feeling this way. You're not alone, and things will get better. 💙",
  anxious: "I understand this can be stressful. Try taking deep breaths and focusing on one step at a time. 🌿",
  afraid: "It's okay to feel fear, but remember that you're stronger than you think. I'm here for you. 🛡️",
  disappointed: "It's okay to feel this way. You are strong, and better days are ahead. ✨",
  devastated: "That sounds really tough. I'm here for you, and you are not alone. 💕",
  embarrassed: "It’s okay, everyone has embarrassing moments. Don’t be too hard on yourself! 😊",
  ashamed: "We all make mistakes, but they don’t define you. You’re still worthy and amazing. 💪",
  apprehensive: "Feeling unsure is normal. Believe in yourself, and take things one step at a time. 🌟",
  angry: "I hear your frustration. Sometimes venting helps—want to talk more about it? 🗣️",
  joyful: "That’s fantastic! I'm so happy for you! Keep enjoying the moment. 😊",
  hopeful: "Hope keeps us going! Stay positive and believe in yourself. 🌟",
  content: "It’s wonderful to feel at peace. Cherish these moments. 🌿",
  impressed: "Wow, that’s amazing! It sounds like a great experience. 😃",
  nostalgic: "Memories can be powerful. It’s nice to reminisce about the good times. 💭",
  grateful: "It’s wonderful to appreciate the good things in life. Gratitude makes everything better! 🙏",
  proud: "That’s a great achievement! You should be proud of yourself. 👏",
  prepared: "You got this! Being prepared is the first step to success. 💪",
  trusting: "Trust is so important. It’s great that you have faith in something. 🤝",
  caring: "The world needs more kindness. Keep being the caring person you are. 💖",
  furious: "Anger can be overwhelming, but I’m here if you need to talk. 😠",
  disgusted: "That sounds unpleasant. Do you want to talk about it? 🤢",
  surprised: "That’s unexpected! How do you feel about it? 😲",
  faithful: "Faith is powerful. Keep believing in what gives you strength. 🙏",
  sentimental: "That sounds like a heartfelt moment. Thanks for sharing. ❤️",
  neutral: "I'm here to chat. Tell me more about what's on your mind! 😊",
};

// ✅ Chatbot API Route
app.post("/api/chatbot", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Detect Emotion
    let detectedEmotion = "neutral"; // Default emotion
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((word) => message.toLowerCase().includes(word))) {
        detectedEmotion = emotion;
        break;
      }
    }

    // Get Response Based on Emotion
    const botReply = responses[detectedEmotion];

    res.json({
      reply: botReply,
      emotion: detectedEmotion,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
});

// ✅ API to Submit Anonymous Letter
// ✅ API to Submit an Anonymous Letter
app.post("/api/anonymous-letters", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Letter content is required" });
      }
  
      const newLetterRef = await db.collection("anonymousLetters").add({
        content,
        likes: 0, // Initialize likes
        replies: [], // Store replies as an array
        timestamp: admin.firestore.Timestamp.now(),
      });
  
      res.status(201).json({ message: "Letter submitted successfully!", id: newLetterRef.id });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong", details: error.message });
    }
  });
  
  // ✅ API to Fetch Anonymous Letters (With Replies)
  app.get("/api/anonymous-letters", async (req, res) => {
    try {
      let { sort, page, limit } = req.query;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
  
      let query = db.collection("anonymousLetters");
  
      // Sorting (By likes or latest)
      if (sort === "popular") {
        query = query.orderBy("likes", "desc");
      } else {
        query = query.orderBy("timestamp", "desc");
      }
  
      const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
      const letters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  
      res.status(200).json(letters);
    } catch (error) {
      res.status(500).json({ error: "Something went wrong", details: error.message });
    }
  });
  
  // ✅ API to Like/Upvote an Anonymous Letter
  app.post("/api/anonymous-letters/:id/like", async (req, res) => {
    try {
      const letterId = req.params.id;
      const letterRef = db.collection("anonymousLetters").doc(letterId);
      const letterDoc = await letterRef.get();
  
      if (!letterDoc.exists) {
        return res.status(404).json({ error: "Letter not found" });
      }
  
      const currentLikes = letterDoc.data().likes || 0;
      await letterRef.update({ likes: currentLikes + 1 });
  
      res.status(200).json({ message: "Letter liked!", newLikes: currentLikes + 1 });
    } catch (error) {
      res.status(500).json({ error: "Something went wrong", details: error.message });
    }
  });
  
  // ✅ API to Add a Reply to an Anonymous Letter
  app.post("/api/anonymous-letters/:id/reply", async (req, res) => {
    const { content, username } = req.body;
    const letterId = req.params.id;

    if (!content || content.trim() === "") {  // ✅ Check for empty replies
        return res.status(400).json({ error: "Reply content is required" });
    }

    try {
        const letterRef = db.collection("anonymousLetters").doc(letterId);
        const letterSnapshot = await letterRef.get();

        if (!letterSnapshot.exists) {
            return res.status(404).json({ error: "Letter not found" });
        }

        await letterRef.update({
            replies: admin.firestore.FieldValue.arrayUnion({ 
                content, 
                username, 
                timestamp: new Date() 
            })
        });

        res.status(200).json({ message: "Reply added successfully!" });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ Root Route
app.get("/", (req, res) => {
  res.send("Welcome to the Mental Health App Backend!");
});

// Start the Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
