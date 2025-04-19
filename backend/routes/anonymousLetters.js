const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

const db = admin.firestore();

// ✅ Submit an Anonymous Letter (With Logged-in User)
router.post("/", async (req, res, next) => {
    try {
        const { content, username } = req.body;
        if (!content || !username) {
            return res.status(400).json({ error: "Content and username are required" });
        }

        await db.collection("anonymousLetters").add({
            content,
            username, // 🔹 Store username
            likes: 0, // 🔹 Default likes count
            replies: [], // 🔹 Store replies as an array
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ message: "Letter submitted successfully!" });
    } catch (error) {
        next(error);
    }
});

// ✅ Fetch Anonymous Letters (With Sorting & Pagination)
router.get("/", async (req, res, next) => {
    try {
        let { sort, page, limit } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 5;

        let query = db.collection("anonymousLetters");

        if (sort === "popular") {
            query = query.orderBy("likes", "desc");
        } else {
            query = query.orderBy("timestamp", "desc");
        }

        const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
        const letters = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json(letters);
    } catch (error) {
        next(error);
    }
});

// ✅ Like an Anonymous Letter
router.post("/:id/like", async (req, res, next) => {
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
        next(error);
    }
});

// ✅ Reply to an Anonymous Letter
router.post("/:id/reply", async (req, res, next) => {
    try {
        const letterId = req.params.id;
        const { replyContent, username } = req.body;

        if (!replyContent || !username) {
            return res.status(400).json({ error: "Reply content and username are required" });
        }

        const letterRef = db.collection("anonymousLetters").doc(letterId);
        const letterDoc = await letterRef.get();

        if (!letterDoc.exists) {
            return res.status(404).json({ error: "Letter not found" });
        }

        const replies = letterDoc.data().replies || [];
        replies.push({
            content: replyContent,
            username,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        await letterRef.update({ replies });

        res.status(201).json({ message: "Reply added successfully!" });
    } catch (error) {
        next(error);
    }
});

// ✅ Delete an Anonymous Letter (Only Author Can Delete)
router.delete("/:id", async (req, res, next) => {
    try {
        const letterId = req.params.id;
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        const letterRef = db.collection("anonymousLetters").doc(letterId);
        const letterDoc = await letterRef.get();

        if (!letterDoc.exists) {
            return res.status(404).json({ error: "Letter not found" });
        }

        if (letterDoc.data().username !== username) {
            return res.status(403).json({ error: "You can only delete your own letter!" });
        }

        await letterRef.delete();
        res.status(200).json({ message: "Letter deleted successfully!" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
