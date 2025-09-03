// server/index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import db from './db.js';
import { generateImage } from './vertex.js';
import { Storage } from '@google-cloud/storage';

dotenv.config();

// --- Express app ---
const app = express();
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

// Tiny friendly boot logs
console.log('[boot] Project:', process.env.GOOGLE_CLOUD_PROJECT);
console.log('[boot] Location:', process.env.VERTEX_LOCATION || 'us-central1');
console.log('[boot] Cred mode:',
  process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'file' :
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'json' :
  process.env.GOOGLE_APPLICATION_CREDENTIALS_B64 ? 'b64' : 'none'
);

// --- Google Cloud Storage (flexible auth) ---
function buildStorage() {
  // 1) Secret File path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
  }
  // 2) JSON env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    let creds;
    try { creds = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON); }
    catch (e) { console.error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON:', e.message); process.exit(1); }
    return new Storage({ credentials: creds });
  }
  // 3) Base64 env var
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_B64) {
    try {
      const raw = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_B64, 'base64').toString('utf8');
      return new Storage({ credentials: JSON.parse(raw) });
    } catch (e) { console.error('Invalid GOOGLE_APPLICATION_CREDENTIALS_B64:', e.message); process.exit(1); }
  }
  console.warn('No explicit creds found; using Application Default Credentials.');
  return new Storage();
}

const storage = buildStorage();
const bucketName = process.env.GCS_BUCKET || 'moodgarden-images';
const bucket = storage.bucket(bucketName);
console.log('[boot] Bucket:', bucketName);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'moodgarden-v2' });
});

// ✅ Single /test-image route
app.get('/test-image', async (req, res) => {
  try {
    const imgBase64 = await generateImage("a bright sunflower digital art");
    if (!imgBase64) throw new Error("No image returned");

    // Save image locally (optional)
    fs.writeFileSync("output.png", Buffer.from(imgBase64, "base64"));
    console.log("✅ Image saved as output.png");

    res.json({ image: imgBase64 });
  } catch (err) {
    console.error("Error in /test-image:", err);
    res.status(500).json({ error: err.message });
  }
});

// Route to create entry and generate mood flower
// Mood-driven flower prompts
const moodPrompts = {
  Calm: "a soft tropical orchid with pale blue petals, serene and delicate",
  Excited: "a vibrant hibiscus bursting with red and orange petals, tropical and full of energy",
  Anxious: "a frangipani flower with drooping petals, soft pastel colors, reflective and moody",
  Grateful: "a radiant tropical sunflower with golden petals, glowing and uplifting",
  Sad: "a blue tropical morning glory flower, gentle and emotional",
  Angry: "a fiery red heliconia flower, sharp and bold",
  Happy: "a cheerful yellow plumeria flower, bright and sunny",
  Tired: "a soft pink lotus flower, calm and restful",
  Relaxed: "a soothing lavender flower, gentle and calming",
  Lonely: "a solitary white jasmine flower, delicate and introspective",
  Hopeful: "a bright tropical daffodil, yellow petals, symbolizing hope and renewal",
  Stressed: "a wilted tropical marigold, orange petals, tense and dramatic",
  Inspired: "a radiant tropical passionflower, intricate petals, creative and unique",
  Confident: "a bold tropical protea, strong pink petals, powerful and striking",
  Overwhelmed: "a cluster of tangled tropical bougainvillea, mixed colors, chaotic and busy",
  Peaceful: "a gentle tropical water lily, white petals, tranquil and harmonious",
  Nostalgic: "a faded tropical forget-me-not, soft blue petals, reminiscent and sentimental",
  Content: "a simple tropical daisy, white petals, pure and satisfied",
  Curious: "an exotic tropical bird of paradise, orange and blue petals, inquisitive and lively",
  Surprised: "a burst of tropical firecracker flower, red and yellow petals, unexpected and bright",
  Bored: "a plain tropical bromeliad, muted green petals, simple and unremarkable",
  Motivated: "a strong tropical gladiolus, upright red petals, determined and energetic",
  Scared: "a trembling tropical nightshade, deep purple petals, shadowy and mysterious",
  Frustrated: "a twisted tropical thistle, spiky blue petals, tense and restless",
  Playful: "a lively tropical zinnia, multi-colored petals, fun and whimsical",
  Affectionate: "a warm tropical camellia, soft pink petals, loving and gentle",
  Jealous: "a green tropical envy vine, tangled petals, longing and intense",
  Embarrassed: "a blushing tropical mimosa, shy pink petals, delicate and bashful",
  Determined: "a fierce tropical torch ginger, bold red petals, strong and unwavering",
  Relieved: "a gentle tropical snowdrop, white petals, light and comforting",
  Sympathetic: "a caring tropical bluebell, soft blue petals, gentle and understanding",
  Amused: "a quirky tropical snapdragon, playful yellow petals, cheerful and fun",
  Resentful: "a dark tropical nettle, sharp green petals, bitter and tense",
  Optimistic: "a bright tropical marigold, golden petals, hopeful and sunny",
  Proud: "a regal tropical iris, deep purple petals, majestic and confident",
  Vulnerable: "a fragile tropical bleeding heart, pink petals, open and sensitive",
  Courageous: "a bold tropical lion's tail, orange petals, brave and strong",
  Sentimental: "a sweet tropical forget-me-not, soft blue petals, emotional and tender",
  Worried: "a trembling tropical bluebell, pale blue petals, anxious and uncertain",
  Ecstatic: "an explosive tropical bougainvillea, vivid magenta petals, joyful and exuberant",
  Melancholic: "a drooping tropical violet, deep blue petals, wistful and somber",
  Indifferent: "a plain tropical fern, green fronds, neutral and unremarkable",
  Guilty: "a shadowed tropical nightshade, dark purple petals, secretive and remorseful",
  Enthusiastic: "a radiant tropical sunflower, bright yellow petals, energetic and passionate"
};
app.post('/entries', async (req, res) => {
  const { title, content, mood } = req.body;
  if (!title || !content || !mood) {
    return res.status(400).json({ error: 'Title, content, and mood are required.' });
  }

  const entryRef = db.collection('entries').doc();
  const timestamp = Date.now();

  await entryRef.set({
    title,
    content,
    mood,
    timestamp,
    status: 'processing'
  });

  // background image generation
  (async () => {
    try {
      const base64Image = await generateImage(
    moodPrompts[mood] || `A tropical flower in vibrant colors that represents the mood: ${mood}. Photorealistic, botanical photography, no people.`
      );
      // Save image to Google Cloud Storage
      const file = bucket.file(`flowers/${entryRef.id}.png`);
      await file.save(Buffer.from(base64Image, 'base64'), { contentType: 'image/png' });

      // Generate a signed URL (valid for 1 year)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
      });
      const publicUrl = url;

      await entryRef.update({
        flowerImageUrl: publicUrl,
        status: 'completed',
      });
    } catch (err) {
      console.error('Error generating image:', err);
      await entryRef.update({ status: 'failed' });
    }
  })();

  res.status(201).json({ id: entryRef.id, status: 'processing' });
});

// Get all entries
app.get('/entries', async (req, res) => {
  const snapshot = await db.collection('entries').get();
  const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(entries);
});

// Get flower status for a single entry
app.get('/entries/:id/flower-status', async (req, res) => {
  const doc = await db.collection('entries').doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: 'Not found' });
  res.json(doc.data());
});

// Delete an entry
// Update an entry
app.put('/entries/:id', async (req, res) => {
  const { title, content, mood } = req.body;

  try {
    const entryRef = db.collection('entries').doc(req.params.id);
    const doc = await entryRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const oldData = doc.data();
    const updates = { title, content, mood };

    // Check if mood changed
    if (mood && mood !== oldData.mood) {
      console.log(`🌸 Mood changed from "${oldData.mood}" → "${mood}", regenerating flower...`);

      // Set to processing immediately
      await entryRef.update({ status: 'processing', mood });

      (async () => {
        try {
          const base64Image = await generateImage(
            `A tropical flower in vibrant colors that represents the mood: ${mood}. Photorealistic, botanical photography, no people.`
          );
          const file = bucket.file(`flowers/${req.params.id}.png`);

          // Overwrite the old flower image
          await file.save(Buffer.from(base64Image, 'base64'), { contentType: 'image/png' });

          // Generate a signed URL (valid for 1 year)
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
          });
          const publicUrl = url;

          await entryRef.update({
            flowerImageUrl: publicUrl,
            status: 'completed',
          });

          console.log(`✅ New flower generated and saved for entry ${req.params.id}`);
        } catch (err) {
          console.error('❌ Error regenerating flower:', err);
          await entryRef.update({ status: 'failed' });
        }
      })();
    } else {
      // If mood not changed, just update text fields
      await entryRef.update(updates);
    }

    res.json({ success: true, message: 'Entry updated successfully' });
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// Delete an entry
app.delete('/entries/:id', async (req, res) => {
  try {
    const entryRef = db.collection('entries').doc(req.params.id);
    const doc = await entryRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Delete Firestore document
    await entryRef.delete();

    // Delete flower image from bucket (if exists)
    const file = bucket.file(`flowers/${req.params.id}.png`);
    try {
      await file.delete();
      console.log(`🌸 Deleted flower image for ${req.params.id}`);
    } catch (err) {
      console.warn(`⚠️ No image to delete for ${req.params.id}`);
    }

    res.json({ success: true, message: 'Entry deleted successfully' });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Serve React build (must be before app.listen)
const clientDistPath = path.resolve(__dirname, "../client/dist");
console.log("[boot] Serving client from:", clientDistPath);

app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
