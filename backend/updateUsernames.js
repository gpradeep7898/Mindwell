const admin = require("firebase-admin");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(require("./firebaseServiceAccount.json")),
});

const db = admin.firestore();

async function updateMissingUsernames() {
  const snapshot = await db.collection("anonymousLetters").get();

  snapshot.forEach(async (doc) => {
    const data = doc.data();
    if (!data.username) {
      await db.collection("anonymousLetters").doc(doc.id).update({
        username: "Anonymous", // 🔹 Add username to missing documents
      });
      console.log(`Updated document ${doc.id} with username: Anonymous`);
    }
  });

  console.log("✅ All missing usernames updated.");
}

updateMissingUsernames();
