// src/config/api.js

// Determine if we're in production (Vercel deployment)
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Direct backend URL (for auth endpoints that need cookies to work cross-origin)
// Vercel rewrites don't properly forward cookies, so auth calls go direct
const BACKEND_URL = "https://pryde-backend.onrender.com";

// Base URL of backend API (must include /api)
// Production: Use relative /api path (goes through Vercel proxy for non-auth calls)
// Development: Use direct backend URL or localhost
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction ? "/api" : `${BACKEND_URL}/api`);

// Auth API URL - ALWAYS goes direct to backend (cookies don't work through Vercel proxy)
// This is used for /refresh, /auth/login, /auth/register, /auth/logout
export const API_AUTH_URL = `${BACKEND_URL}/api`;

// Socket URL uses the server root, NOT /api
// Note: WebSockets still need direct connection to backend (proxy only handles HTTP)
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || BACKEND_URL;

// Default export for compatibility
export default {
  API_BASE_URL,
  API_AUTH_URL,
  SOCKET_URL,
};

