const functions = require("firebase-functions");
const { db } = require("./firebaseConfig");

// 🔹 Function to Post an Anonymous Letter
exports.postAnonymousLetter = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ error: "Method Not Allowed" });
        }

        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: "Letter content is required" });
        }

        const newLetter = {
            content,
            timestamp: new Date().toISOString(),
        };

        await db.collection("anonymousLetters").add(newLetter);

        return res.status(201).json({ message: "Anonymous letter posted successfully" });
    } catch (error) {
        console.error("Error posting anonymous letter:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Function to Retrieve All Anonymous Letters
exports.getAnonymousLetters = functions.https.onRequest(async (req, res) => {
    try {
        const snapshot = await db.collection("anonymousLetters").orderBy("timestamp", "desc").get();

        const letters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.status(200).json({ letters });
    } catch (error) {
        console.error("Error retrieving letters:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
