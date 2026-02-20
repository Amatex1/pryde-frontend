// src/config/api.js

const isProduction = import.meta.env.PROD;
const BACKEND_URL = 'https://pryde-backend.onrender.com';
// VITE_API_DOMAIN should be set to the custom Render domain (e.g. https://api.prydesocial.com)
// so the httpOnly refresh token cookie is first-party (same root as prydesocial.com)
// and Safari ITP won't block or expire it. Falls back to the raw Render URL if not set.
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN || BACKEND_URL;

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction ? '/api' : `${BACKEND_URL}/api`);

export const API_AUTH_URL = `${BACKEND_URL}/api`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (isProduction ? API_DOMAIN : BACKEND_URL);

// 🔥 Uploads ALWAYS go directly to backend (files are stored there, not on Vercel)
export const UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_URL || BACKEND_URL;

export default {
  API_BASE_URL,
  API_AUTH_URL,
  SOCKET_URL,
  UPLOADS_BASE_URL,
};