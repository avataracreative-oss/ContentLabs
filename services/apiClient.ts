// This service communicates with our Node.js Backend (server.js)
// instead of talking directly to Google Gemini.

const BACKEND_URL = 'http://localhost:3001/api'; // Adjust if deployed

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
    const res = await fetch(`${BACKEND_URL}/generate/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, lang })
    });
    if (!res.ok) throw new Error('Backend analysis failed');
    return res.json();
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