import { API_BASE_URL } from '../config/api';

/**
 * Helper function to get full image URL
 * Properly encodes special characters (spaces, parentheses) in filenames
 *
 * @param {string} path - The image path (can be relative or absolute)
 * @returns {string|null} - Full image URL or null if no path provided
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already a full URL

  // Encode special characters in the filename portion of the path
  // This handles spaces, parentheses, and other problematic characters
  const pathParts = path.split('/');
  const filename = pathParts.pop();
  const encodedFilename = encodeURIComponent(filename);
  const encodedPath = [...pathParts, encodedFilename].join('/');

  return `${API_BASE_URL}${encodedPath}`;
};

