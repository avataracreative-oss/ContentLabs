require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow frontend to call backend
app.use(express.json({ limit: '50mb' })); // Allow large payloads for images

// Initialize Gemini (Server Side - Secure)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize Google OAuth Client
// You must set GOOGLE_CLIENT_ID in your .env file
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- MONGODB CONNECTION ---
// Replace MONGODB_URI in .env with your real connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contentlabs';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional if using only Google
  googleId: { type: String },
  name: { type: String },
  picture: { type: String },
  plan: { type: String, default: 'free' },
  credits: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  data: Object, // Store JSON blob of project state
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);

// --- MIDDLEWARE: AUTHENTICATION ---
// Simple mock middleware. In production, use JWT (JsonWebToken)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // In real app: verify token here
  next();
};

// --- ROUTES: AUTH ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({
    token: 'mock-jwt-token-12345',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      plan: user.plan
    }
  });
});

// REAL GOOGLE LOGIN ENDPOINT
app.post('/api/auth/google', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    // In React Google Auth hook, we get an Access Token.
    // We can use this to fetch the UserInfo from Google APIs.
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const payload = await userInfoResponse.json();
    
    if (!payload.email) {
        throw new Error("Failed to verify Google Token");
    }

    // Find or Create User
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
        user = await User.create({
            email: payload.email,
            name: payload.name,
            googleId: payload.sub,
            picture: payload.picture,
            plan: 'free',
            credits: 10
        });
    } else if (!user.googleId) {
        // Link existing email account to Google
        user.googleId = payload.sub;
        user.picture = payload.picture;
        await user.save();
    }

    res.json({
        token: 'mock-session-token-' + user._id, // Replace with Real JWT
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            plan: user.plan
        }
    });

  } catch (error) {
    console.error("Google Auth Error", error);
    res.status(401).json({ error: 'Google Authentication Failed' });
  }
});


// --- ROUTES: GEMINI WRAPPERS ---

// 1. Analyze Product
app.post('/api/generate/analyze', requireAuth, async (req, res) => {
  try {
    const { url, lang } = req.body;
    const langInstruction = lang === 'id' ? "Bahasa Indonesia" : "English";
    
    const prompt = `
      Analyze the following product URL: ${url}
      Provide output in ${langInstruction}.
      Format output strictly as:
      Name: [Name]
      Description: [Description]
      Visual Features: [Features]
      Target Audience: [Audience]
      Selling Points:
      - [Point 1]
    `;

    // Call Gemini from Backend
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    res.json({ text: response.text, grounding: response.candidates?.[0]?.groundingMetadata });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate Image
app.post('/api/generate/image', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "9:16", imageSize: "1K" },
      },
    });

    // Extract image logic
    let imageData = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageData = {
          rawBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
        break;
      }
    }

    if (!imageData) throw new Error("No image generated");
    res.json(imageData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Generate Script
app.post('/api/generate/script', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate TTS
app.post('/api/generate/audio', requireAuth, async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } },
        },
      },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audioBase64: audioData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Generate Video (Veo)
// Note: Veo polling usually takes time, so backend might need a job queue (BullMQ/Redis)
// For simplicity, we keep the long-polling connection open here (not recommended for production)
app.post('/api/generate/video', requireAuth, async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: { imageBytes: imageBase64, mimeType: mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });

    // Simple poll loop on server
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    // Backend fetches the final video bytes to proxy it to frontend (avoids exposing API Key in URL)
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBuffer = await videoRes.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');

    res.json({ videoBase64, mimeType: 'video/mp4' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`ContentLabs Backend running on port ${PORT}`);
});