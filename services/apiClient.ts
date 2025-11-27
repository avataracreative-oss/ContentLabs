
// This service communicates with our Node.js Backend (server.js)
// instead of talking directly to Google Gemini.

// CRITICAL FIX: Use the Environment Variable for the Backend URL with optional chaining.
// In Project IDX, this must be the HTTPS URL of your server (port 3001).
// If not set or env is undefined, it falls back to localhost (which causes errors in HTTPS previews).
const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3001/api';

console.log("Connecting to Backend at:", BACKEND_URL);

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export const backendApi = {
  login: async (email, password) => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  loginWithGoogle: async (accessToken) => {
    const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
    });
    if (!res.ok) throw new Error('Google Auth Failed');
    return res.json();
  },

  analyzeProduct: async (url, lang) => {
    try {
      const res = await fetch(`${BACKEND_URL}/generate/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ url, lang })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Backend analysis failed');
      }
      return res.json();
    } catch (e) {
      console.error("API Error:", e);
      throw new Error("Failed to connect to server. Ensure Backend is running and VITE_BACKEND_URL is set in .env");
    }
  },

  generateImage: async (prompt) => {
    const res = await fetch(`${BACKEND_URL}/generate/image`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Backend image gen failed');
    return res.json();
  },

  generateScript: async (prompt) => {
    const res = await fetch(`${BACKEND_URL}/generate/script`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Backend script gen failed');
    return res.json();
  },

  generateAudio: async (text, voiceName) => {
    const res = await fetch(`${BACKEND_URL}/generate/audio`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, voiceName })
    });
    if (!res.ok) throw new Error('Backend audio gen failed');
    return res.json();
  },

  generateVideo: async (prompt, imageBase64, mimeType) => {
    const res = await fetch(`${BACKEND_URL}/generate/video`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ prompt, imageBase64, mimeType })
    });
    if (!res.ok) throw new Error('Backend video gen failed');
    return res.json();
  }
};
