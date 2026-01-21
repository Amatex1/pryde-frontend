// src/config/api.js

// Determine if we're in production (Vercel deployment)
// In production, use relative URLs to go through Vercel's proxy (same-origin cookies work!)
// In development, use the direct backend URL
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Base URL of backend API (must include /api)
// Production: Use relative /api path (goes through Vercel proxy)
// Development: Use direct backend URL or localhost
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (isProduction ? "/api" : "https://pryde-backend.onrender.com/api");

// Socket URL uses the server root, NOT /api
// Note: WebSockets still need direct connection to backend (proxy only handles HTTP)
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://pryde-backend.onrender.com";

// Default export for compatibility
export default {
  API_BASE_URL,
  SOCKET_URL,
};

