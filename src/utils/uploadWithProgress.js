import { getCsrfToken } from './api';
import { getAuthToken } from './auth';

/**
 * DEV-MODE WARNING: Log warning for unauthenticated upload attempts
 */
const warnUnauthenticatedUpload = (url) => {
  if (import.meta.env.DEV) {
    console.warn('⚠️ Attempted upload without authentication token.');
    console.warn('📍 URL:', url);
    console.warn('This upload will likely fail with 401/403.');
  }
};

/**
 * Upload a file with progress tracking using XMLHttpRequest
 * @param {Object} options - Upload options
 * @param {string} options.url - Upload endpoint URL
 * @param {File} options.file - File to upload
 * @param {string} options.fieldName - Form field name (default: 'photo')
 * @param {Function} options.onProgress - Progress callback (percent)
 * @param {Object} options.additionalData - Additional form data to send
 * @returns {Promise<Object>} Upload response data
 */
export function uploadWithProgress({
  url,
  file,
  fieldName = 'photo',
  onProgress,
  additionalData = {}
}) {
  return new Promise((resolve, reject) => {
    // Get auth token using centralized auth utility
    const token = getAuthToken();

    // CRITICAL: Block upload if no auth token
    if (!token) {
      warnUnauthenticatedUpload(url);
      reject(new Error('Authentication required. Please log in to upload files.'));
      return;
    }

    const xhr = new XMLHttpRequest();

    // Get CSRF token for security
    const csrfToken = getCsrfToken();

    xhr.open('POST', url);

    // Enable credentials (cookies) for cross-origin requests
    xhr.withCredentials = true;

    // CRITICAL: Set Authorization header with Bearer token (matches backend auth middleware)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    // Also set x-auth-token for backwards compatibility
    xhr.setRequestHeader('x-auth-token', token);

    if (csrfToken) {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Handle successful upload
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid upload response'));
        }
      } else if (xhr.status === 401) {
        // Auth failure - surface clearly
        if (import.meta.env.DEV) {
          console.error('❌ Upload auth failed (401):', url);
          console.error('📋 Token was:', token ? 'Present' : 'Missing');
        }
        reject(new Error('Authentication failed. Please log in again.'));
      } else if (xhr.status === 403) {
        // Forbidden - could be CSRF or permission issue
        if (import.meta.env.DEV) {
          console.error('❌ Upload forbidden (403):', url);
          console.error('📋 CSRF Token:', csrfToken ? 'Present' : 'Missing');
          try {
            const errorData = JSON.parse(xhr.responseText);
            console.error('📋 Error details:', errorData);
          } catch {
            // Response body is not valid JSON; skip structured error logging.
          }
        }
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || 'Upload forbidden. Please try again.'));
        } catch {
          // Response body is not valid JSON; fall back to a generic message.
          reject(new Error('Upload forbidden. Please refresh the page and try again.'));
        }
      } else {
        // Try to parse error response
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || errorData.error || 'Upload failed'));
        } catch {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      }
    };

    // Handle network errors
    xhr.onerror = () => reject(new Error('Network error during upload'));

    // Handle upload abort
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    // Build form data
    const formData = new FormData();
    formData.append(fieldName, file);

    // Add any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // Send the request
    xhr.send(formData);
  });
}

/**
 * Upload multiple files with progress tracking
 * @param {Object} options - Upload options
 * @param {string} options.url - Upload endpoint URL
 * @param {File[]} options.files - Files to upload
 * @param {string} options.fieldName - Form field name (default: 'media')
 * @param {Function} options.onProgress - Progress callback (percent)
 * @param {Object} options.additionalData - Additional form data to send
 * @returns {Promise<Object>} Upload response data
 */
export function uploadMultipleWithProgress({
  url,
  files,
  fieldName = 'media',
  onProgress,
  additionalData = {}
}) {
  return new Promise((resolve, reject) => {
    // Get auth token using centralized auth utility
    const token = getAuthToken();

    // CRITICAL: Block upload if no auth token
    if (!token) {
      warnUnauthenticatedUpload(url);
      reject(new Error('Authentication required. Please log in to upload files.'));
      return;
    }

    const xhr = new XMLHttpRequest();

    // Get CSRF token for security
    const csrfToken = getCsrfToken();

    xhr.open('POST', url);

    // Enable credentials (cookies) for cross-origin requests
    xhr.withCredentials = true;

    // CRITICAL: Set Authorization header with Bearer token (matches backend auth middleware)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    // Also set x-auth-token for backwards compatibility
    xhr.setRequestHeader('x-auth-token', token);

    if (csrfToken) {
      xhr.setRequestHeader('X-CSRF-Token', csrfToken);
      xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
    }

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    // Handle successful upload
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid upload response'));
        }
      } else if (xhr.status === 401) {
        // Auth failure - surface clearly
        if (import.meta.env.DEV) {
          console.error('❌ Upload auth failed (401):', url);
          console.error('📋 Token was:', token ? 'Present' : 'Missing');
        }
        reject(new Error('Authentication failed. Please log in again.'));
      } else if (xhr.status === 403) {
        // Forbidden - could be CSRF or permission issue
        if (import.meta.env.DEV) {
          console.error('❌ Upload forbidden (403):', url);
          console.error('📋 CSRF Token:', csrfToken ? 'Present' : 'Missing');
          try {
            const errorData = JSON.parse(xhr.responseText);
            console.error('📋 Error details:', errorData);
          } catch {
            // Response body is not valid JSON; skip structured error logging.
          }
        }
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || 'Upload forbidden. Please try again.'));
        } catch {
          reject(new Error('Upload forbidden. Please refresh the page and try again.'));
        }
      } else {
        // Try to parse error response
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || errorData.error || 'Upload failed'));
        } catch {
          reject(new Error(xhr.responseText || 'Upload failed'));
        }
      }
    };

    // Handle network errors
    xhr.onerror = () => reject(new Error('Network error during upload'));

    // Handle upload abort
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    // Build form data
    const formData = new FormData();

    // Append all files
    files.forEach(file => {
      formData.append(fieldName, file);
    });

    // Add any additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // Send the request
    xhr.send(formData);
  });
}

