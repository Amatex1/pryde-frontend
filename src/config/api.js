// src/config/api.js

const isProduction = import.meta.env.PROD;

// Custom domain for backend - uses VITE_API_DOMAIN env var
// This makes the httpOnly refresh token cookie first-party (same root as the frontend)
// and Safari ITP won't block or expire it.
const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

// Fallback to Render URL for local development
const BACKEND_URL = 'https://pryde-backend.onrender.com';

// In production, use the custom domain; in development, use Render URL
const getBackendUrl = () => {
  if (isProduction && API_DOMAIN) {
    return API_DOMAIN;
  }
  return BACKEND_URL;
};

// Use direct backend URL in production (NOT Vercel proxy which breaks cookies)
// In development, use Render URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction 
    ? (API_DOMAIN ? `${API_DOMAIN}/api` : 'https://api.prydeapp.com/api') 
    : `${getBackendUrl()}/api`);

// Use custom domain in production, Render URL in development
// 🔥 CRITICAL: Always use direct backend URL in production!
// Vercel proxy (/api) does NOT forward cookies properly - this breaks auth!
export const API_AUTH_URL = isProduction 
  ? (API_DOMAIN ? `${API_DOMAIN}/api` : 'https://api.prydeapp.com/api') 
  : `${BACKEND_URL}/api`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (isProduction 
    ? (API_DOMAIN || 'https://api.prydeapp.com') 
    : BACKEND_URL);

// 🔥 Uploads ALWAYS go directly to backend (files are stored there, not on Vercel)
export const UPLOADS_BASE_URL =
  import.meta.env.VITE_UPLOADS_URL || (isProduction
    ? (API_DOMAIN || 'https://api.prydeapp.com')
    : getBackendUrl());

export default {
  API_BASE_URL,
  API_AUTH_URL,
  SOCKET_URL,
  UPLOADS_BASE_URL,
};
