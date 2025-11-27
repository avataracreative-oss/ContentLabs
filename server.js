require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Enable CORS for ALL origins (easiest for dev/preview environments)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS']
})); 
app.use(express.json({ limit: '50mb' })); // Allow large payloads for images

// Initialize Gemini (Server Side - Secure)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- MONGODB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/contentlabs';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
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
  data: Object, 
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);

// --- MIDDLEWARE: AUTHENTICATION ---
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // For the "Guest" access in the demo, we allow the mock token
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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

app.post('/api/auth/google', async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
    const payload = await userInfoResponse.json();
    
    if (!payload.email) {
        throw new Error("Failed to verify Google Token");
    }

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
        user.googleId = payload.sub;
        user.picture = payload.picture;
        await user.save();
    }

    res.json({
        token: 'mock-session-token-' + user._id,
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
    console.log("Analyzing URL:", req.body.url);
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

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    res.json({ text: response.text, grounding: response.candidates?.[0]?.groundingMetadata });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze product" });
  }
});

// 2. Generate Image
app.post('/api/generate/image', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Generating Image...");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "9:16", imageSize: "1K" },
      },
    });

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
    console.error("Image Gen Error:", error);
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
app.post('/api/generate/video', requireAuth, async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;
    console.log("Generating Veo Video...");

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: { imageBytes: imageBase64, mimeType: mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    });

    while (!operation.done) {
      await new Promise(r => setTimeout(r, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBuffer = await videoRes.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');

    res.json({ videoBase64, mimeType: 'video/mp4' });
  } catch (error) {
    console.error("Veo Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ContentLabs Backend running on port ${PORT}`);
});