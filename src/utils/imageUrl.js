// src/utils/imageUrl.js
import { UPLOADS_BASE_URL } from '../config/api';

// CDN base URL — set VITE_CDN_URL in frontend env to route media through Cloudflare.
// Example: VITE_CDN_URL=https://media.prydeapp.com
const CDN_URL = import.meta.env.VITE_CDN_URL?.replace(/\/$/, '') || null;

const ABSOLUTE_OR_SPECIAL_URL_PATTERN = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export const getImageUrl = (path) => {
  if (!path) return null;

  const normalizedPath = typeof path === 'string' ? path.trim() : String(path).trim();
  if (!normalizedPath) return null;

  // Already absolute/special (R2 CDN URL stored by backend, blob/data preview, or external)
  if (ABSOLUTE_OR_SPECIAL_URL_PATTERN.test(normalizedPath)) return normalizedPath;

  // Encode filename safely
  const pathParts = normalizedPath.split('/');
  const filename = pathParts.pop();
  const encodedFilename = encodeURIComponent(filename);
  const encodedPath = [...pathParts, encodedFilename].join('/');

  const cleanPath = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`;
  const baseUrl = UPLOADS_BASE_URL.replace(/\/$/, '');

  // Legacy or backend-served API paths should stay on the backend, not the CDN.
  if (cleanPath.startsWith('/api/')) {
    return `${baseUrl}${cleanPath}`;
  }

  // If CDN is configured, serve relative media paths through CDN
  if (CDN_URL) {
    return `${CDN_URL}${cleanPath}`;
  }

  // Fallback: route through backend API
  return `${baseUrl}/api${cleanPath}`;
};
