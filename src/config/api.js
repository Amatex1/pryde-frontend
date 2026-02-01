// src/config/api.js

const isProduction = import.meta.env.PROD;
const BACKEND_URL = 'https://pryde-backend.onrender.com';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction ? '/api' : `${BACKEND_URL}/api`);

export const API_AUTH_URL = `${BACKEND_URL}/api`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

// 🔥 FIX: In prod, uploads go through /api proxy like everything else
// In dev, uploads go directly to backend ROOT (not /api)
export const UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_URL ||
  (isProduction ? '/api' : BACKEND_URL); // ✅ Changed this line

export default {
  API_BASE_URL,
  API_AUTH_URL,
  SOCKET_URL,
  UPLOADS_BASE_URL,
};