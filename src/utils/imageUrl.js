// src/utils/imageUrl.js
import { UPLOADS_BASE_URL } from '../config/api';

// CDN base URL — set VITE_CDN_URL in frontend env to route media through Cloudflare.
// Example: VITE_CDN_URL=https://cdn.prydeapp.com
const CDN_URL = import.meta.env.VITE_CDN_URL?.replace(/\/$/, '') || null;

export const getImageUrl = (path) => {
  if (!path) return null;

  // Already absolute (R2 CDN URL stored by backend, or external)
  if (path.startsWith('http')) return path;

  // Encode filename safely
  const pathParts = path.split('/');
  const filename = pathParts.pop();
  const encodedFilename = encodeURIComponent(filename);
  const encodedPath = [...pathParts, encodedFilename].join('/');

  const cleanPath = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`;

  // If CDN is configured, serve relative media paths through CDN
  if (CDN_URL) {
    return `${CDN_URL}${cleanPath}`;
  }

  // Fallback: route through backend API
  const baseUrl = UPLOADS_BASE_URL.replace(/\/$/, '');
  return `${baseUrl}/api${cleanPath}`;
};
