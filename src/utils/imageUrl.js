// src/utils/imageUrl.js
import { UPLOADS_BASE_URL } from '../config/api';

export const getImageUrl = (path) => {
  if (!path) return null;

  // Already absolute
  if (path.startsWith('http')) return path;

  // Encode filename safely
  const pathParts = path.split('/');
  const filename = pathParts.pop();
  const encodedFilename = encodeURIComponent(filename);
  const encodedPath = [...pathParts, encodedFilename].join('/');

  // Ensure clean joining with /api prefix
  // Backend routes are at /api/upload/image and /api/upload/file
  const baseUrl = UPLOADS_BASE_URL.replace(/\/$/, '');
  const cleanPath = encodedPath.startsWith('/')
    ? encodedPath
    : `/${encodedPath}`;

  return `${baseUrl}/api${cleanPath}`;
};
