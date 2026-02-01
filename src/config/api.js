// src/config/api.js

const isProduction = import.meta.env.PROD;

// Your backend root (NO /api here)
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://pryde-backend.onrender.com';

// ===============================
// API endpoints (WITH /api prefix)
// ===============================
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction ? '/api' : `${BACKEND_URL}/api`);

export const API_AUTH_URL = `${BACKEND_URL}/api`;

// ===============================
// Socket (root-level)
// ===============================
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

// ===============================
// 🔥 Uploads (served at backend ROOT)
// ===============================
export const UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_URL ||
  (isProduction ? '' : BACKEND_URL);
// In prod: "" → relative path (/upload/...)
// In dev: https://pryde-backend.onrender.com/upload/...

export default {
  API_BASE_URL,
  API_AUTH_URL,
  SOCKET_URL,
  UPLOADS_BASE_URL,
};
