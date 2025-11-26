
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { ProductData, GeneratedModel, Language } from "../types";
import { backendApi } from "./apiClient";

// --- CONFIGURATION ---
// Set this to TRUE to use the Node.js Backend (server.js)
// Set this to FALSE to use Client-Side Direct API (Development/Preview)
const USE_BACKEND = true; 

// Option A: API Key is managed by the environment/backend (SaaS Model)
const getAiClient = () => {
  if (USE_BACKEND) throw new Error("Should not access Gemini Client directly in Backend Mode");
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Retry helper for handling Quota/Rate Limit errors
async function retry<T>(fn: () => Promise<T>, retries = 5, delay = 5000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || JSON.stringify(error);
    const isQuotaError = error.status === 429 || error.code === 429 || 
                         errorMsg.includes('429') ||
                         errorMsg.includes('quota') ||
                         errorMsg.includes('RESOURCE_EXHAUSTED');
    
    if (isQuotaError && retries > 0) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Utility: Get Audio Duration from Base64
 */
export const getAudioDuration = async (base64Audio: string): Promise<number> => {
  try {
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const samples = bytes.length / 2; // 16-bit = 2 bytes per sample
    const duration = samples / 24000; // 24kHz
    
    audioContext.close();
    return duration;
  } catch (e) {
    console.error("Error calculating duration", e);
    return 10; // Default fallback
  }
};

/**
 * Step 1: Analyze Product using Search Grounding
 */
export const analyzeProductUrl = async (url: string, lang: Language): Promise<ProductData> => {
  // BACKEND PATH
  if (USE_BACKEND) {
    const response = await backendApi.analyzeProduct(url, lang);
    const text = response.text || "";
    // Parsing logic duplicates here for now, ideally moved to backend or shared utility
    const getValue = (key: string) => {
        const regex = new RegExp(`${key}:\\s*(.*)`);
        const match = text.match(regex);
        return match ? match[1].trim() : "Not found";
    };
    const name = getValue("Name");
    const description = text.match(/Description:\s*([\s\S]*?)(?=Visual Features:)/)?.[1].trim() || "No description found.";
    const visualFeatures = text.match(/Visual Features:\s*([\s\S]*?)(?=Target Audience:)/)?.[1].trim() || "No visual features found.";
    const targetAudience = getValue("Target Audience");
    const sellingPointsMatch = text.match(/Selling Points:\s*([\s\S]*)/);
    const sellingPoints = sellingPointsMatch 
        ? sellingPointsMatch[1].split('\n').map(s => s.replace(/^-\s*/, '').trim()).filter(s => s.length > 0)
        : [];

    return { url, name, description, visualFeatures, targetAudience, sellingPoints, referenceImages: [], timestamp: Date.now() };
  }

  // DIRECT CLIENT PATH
  const ai = getAiClient();
  const langInstruction = lang === 'id' ? "Bahasa Indonesia" : "English";

  const prompt = `
    Analyze the following product URL to extract detailed product knowledge: ${url}
    I need you to act as a marketing expert. Please search for this product and provide a comprehensive summary.
    CRITICAL: Provide the output content in ${langInstruction}.
    Format the output as a Markdown block that acts like a JSON object (do not use actual JSON schema mode as we are using search tools).
    Structure the text strictly like this:
    Name: [Product Name]
    Description: [2-3 sentences description]
    Visual Features: [Physical appearance, colors, materials, packaging]
    Target Audience: [Who is this for?]
    Selling Points:
    - [Point 1]
    - [Point 2]
    - [Point 3]
  `;

  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  }));

  const text = response.text || "";
  const getValue = (key: string) => {
    const regex = new RegExp(`${key}:\\s*(.*)`);
    const match = text.match(regex);
    return match ? match[1].trim() : "Not found";
  };

  const name = getValue("Name");
  const description = text.match(/Description:\s*([\s\S]*?)(?=Visual Features:)/)?.[1].trim() || "No description found.";
  const visualFeatures = text.match(/Visual Features:\s*([\s\S]*?)(?=Target Audience:)/)?.[1].trim() || "No visual features found.";
  const targetAudience = getValue("Target Audience");
  const sellingPointsMatch = text.match(/Selling Points:\s*([\s\S]*)/);
  const sellingPoints = sellingPointsMatch 
    ? sellingPointsMatch[1].split('\n').map(s => s.replace(/^-\s*/, '').trim()).filter(s => s.length > 0)
    : [];

  return { url, name, description, visualFeatures, targetAudience, sellingPoints, referenceImages: [], timestamp: Date.now() };
};

/**
 * Step 2: Generate Model Image using Nano Banana Pro (Gemini 3 Pro Image)
 */
export const generateModelImage = async (product: ProductData, gender: 'male' | 'female'): Promise<GeneratedModel> => {
  const prompt = `
    Create a high-quality, photorealistic commercial advertising image.
    Subject: An attractive Indonesian ${gender} model.
    Action: The model is holding or using a product described as: ${product.name}.
    Product Visuals: ${product.visualFeatures}.
    Outfit: Stylish, modern outfit suitable for: ${product.targetAudience}.
    Background: Blurred, professional commercial background that fits the product vibe (e.g., modern home, studio, outdoor nature).
    Lighting: Cinematic, soft studio lighting.
    Style: 4k, highly detailed, advertising photography.
    Ensure the product looks natural in the model's hand/use.
  `;

  // BACKEND PATH
  if (USE_BACKEND) {
    const res = await backendApi.generateImage(prompt);
    return {
        imageUrl: `data:${res.mimeType};base64,${res.rawBase64}`,
        rawBase64: res.rawBase64,
        mimeType: res.mimeType,
        promptUsed: prompt
    };
  }

  // DIRECT CLIENT PATH
  const ai = getAiClient();
  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "9:16", imageSize: "1K" },
    },
  }));

  let imageUrl = "";
  let rawBase64 = "";
  let mimeType = "";

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      rawBase64 = part.inlineData.data;
      mimeType = part.inlineData.mimeType;
      imageUrl = `data:${mimeType};base64,${rawBase64}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image");
  return { imageUrl, rawBase64, mimeType, promptUsed: prompt };
};

/**
 * Step 3: Generate Commercial Script
 */
export const generateScript = async (product: ProductData, gender: string, lang: Language, style: 'short' | 'normal' = 'short'): Promise<string> => {
  const langInstruction = lang === 'id' ? "Bahasa Indonesia" : "English";
  const lengthInstruction = style === 'short' 
    ? "VERY SHORT. STRICTLY UNDER 30 seconds read time (Max 60 words). Keep it punchy." 
    : "Standard 45 seconds.";

  const prompt = `
    Write a catchy, persuasive commercial script (voiceover only) for a video advertisement.
    Product: ${product.name}
    Audience: ${product.targetAudience}
    Key Points: ${product.sellingPoints.slice(0, 2).join(", ")}
    Model in video: Indonesian ${gender}
    Tone: Enthusiastic, professional, yet relatable.
    Language: ${langInstruction}.
    Length: ${lengthInstruction}.
    Structure: Hook -> Benefit -> Call to Action.
    Return ONLY the raw script text to be read by the voice actor. Do not include [Scene] or (Action) cues.
  `;

  // BACKEND PATH
  if (USE_BACKEND) {
    const res = await backendApi.generateScript(prompt);
    return res.text;
  }

  // DIRECT CLIENT PATH
  const ai = getAiClient();
  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  }));

  return response.text || "Failed to generate script.";
};

/**
 * Modify existing script
 */
export const modifyScript = async (currentScript: string, instruction: 'shorten' | 'expand' | 'regenerate', lang: Language): Promise<string> => {
  const langInstruction = lang === 'id' ? "Bahasa Indonesia" : "English";
  const wordCount = currentScript.split(/\s+/).length;
  
  let userPrompt = "";
  if (instruction === 'shorten') {
    userPrompt = `Rewrite the following commercial script to be shorter (approx 15-20 seconds). Max 40 words. Keep the language ${langInstruction}.`;
  } else if (instruction === 'expand') {
    userPrompt = `Expand the following commercial script to include more details (approx 50 seconds). Keep the language ${langInstruction}.`;
  } else {
    userPrompt = `Rewrite the following commercial script with a completely different tone but keeping the core message and SAME LENGTH (approx ${wordCount} words). Keep the language ${langInstruction}.`;
  }

  const fullPrompt = `Original Script: "${currentScript}"\nInstruction: ${userPrompt}\nReturn ONLY the raw new script text.`;

  if (USE_BACKEND) {
    const res = await backendApi.generateScript(fullPrompt);
    return res.text;
  }

  const ai = getAiClient();
  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: fullPrompt,
  }));
  return response.text || currentScript;
};

/**
 * Step 3b: Generate Audio (TTS)
 */
export const generateAudio = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  if (USE_BACKEND) {
    const res = await backendApi.generateAudio(text, voiceName);
    return res.audioBase64;
  }

  const ai = getAiClient();
  const response = await retry<GenerateContentResponse>(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
      },
    },
  }));
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};


/**
 * Step 4: Generate Video using Veo
 */
export const generateVeoVideo = async (
  imageBase64: string, 
  mimeType: string, 
  promptDetails: string
): Promise<string> => {
  const prompt = `
    Cinematic commercial shot. 
    The model is ${promptDetails}.
    CRITICAL: The model MUST KEEP THEIR MOUTH CLOSED. The model IS NOT SPEAKING. 
    Expression: Confident smile, professional, engaging but silent.
    Action: Showing the product to the camera.
    Subtle camera push in. 
    High production value, 4k advertising style.
  `;

  if (USE_BACKEND) {
    const res = await backendApi.generateVideo(prompt, imageBase64, mimeType);
    return `data:${res.mimeType};base64,${res.videoBase64}`;
  }

  const ai = getAiClient();
  try {
    let operation = await retry<any>(() => ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: { imageBytes: imageBase64, mimeType: mimeType },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '9:16' }
    }));

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 15000)); 
      operation = await retry<any>(() => ai.operations.getVideosOperation({ operation: operation }));
    }

    if (operation.error) throw new Error(operation.error.message || "Unknown Veo error");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation completed but no link returned.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download video file");
    
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
  } catch (e: any) {
    console.error("Veo Generation Error:", e);
    throw new Error(e.message || "Video generation failed");
  }
};
