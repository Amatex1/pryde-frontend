/**
 * Global API Client with Request Deduplication and 429 Backoff
 * 
 * Features:
 * - Deduplicates inflight requests (prevents duplicate API calls)
 * - Response caching with configurable TTL
 * - Global 429 rate limit handling with backoff
 * - Automatic retry with exponential backoff
 * 
 * Usage:
 * import { apiFetch } from '../utils/apiClient';
 * 
 * const data = await apiFetch('/api/users/me', {}, { cacheTtl: 60000 });
 */

import { API_BASE_URL } from '../config/api.js';
import { getAuthToken } from './auth';
import logger from './logger';

// In-flight request tracking (prevents duplicate requests)
const inflight = new Map();

// Response cache with expiration
const cache = new Map();

// Rate limit backoff state
let rateLimitedUntil = 0;
let backoffDelay = 1000; // Start with 1 second

/**
 * Global fetch coordinator with deduplication and caching
 * 
 * @param {string} url - API endpoint (relative or absolute)
 * @param {Object} options - Fetch options
 * @param {Object} config - Additional configuration
 * @param {number} config.cacheTtl - Cache time-to-live in milliseconds (0 = no cache)
 * @param {boolean} config.skipAuth - Skip adding auth token (default: false)
 * @returns {Promise<any>} Response data or null on error
 */
export async function apiFetch(url, options = {}, { cacheTtl = 0, skipAuth = false } = {}) {
  const now = Date.now();

  // Check if we're rate limited
  if (rateLimitedUntil > now) {
    const waitTime = rateLimitedUntil - now;
    logger.warn(`[API] Rate limited, waiting ${waitTime}ms before retry`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Build full URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const cacheKey = `${fullUrl}:${JSON.stringify(options)}`;

  // Serve cached response if valid
  if (cacheTtl && cache.has(cacheKey)) {
    const { data, expires } = cache.get(cacheKey);
    if (now < expires) {
      logger.debug(`[API] Cache hit: ${url}`);
      return data;
    }
    cache.delete(cacheKey);
  }

  // Deduplicate inflight requests
  if (inflight.has(cacheKey)) {
    logger.debug(`[API] Deduplicating request: ${url}`);
    return inflight.get(cacheKey);
  }

  // Add auth token if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  // Add default headers
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add credentials for cookies
  options.credentials = options.credentials || 'include';

  const request = fetch(fullUrl, options)
    .then(async (res) => {
      // Handle 429 Rate Limit
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay;
        
        rateLimitedUntil = now + delay;
        backoffDelay = Math.min(backoffDelay * 2, 60000); // Max 60 seconds
        
        logger.warn(`[API] Rate limited (429): ${url}, backing off for ${delay}ms`);
        return null;
      }

      // Reset backoff on success
      if (res.ok) {
        backoffDelay = 1000;
        rateLimitedUntil = 0;
      }

      // Handle non-OK responses
      if (!res.ok) {
        logger.warn(`[API] Error ${res.status}: ${url}`);
        throw new Error(`API error ${res.status}`);
      }

      // Parse JSON response
      const data = await res.json();

      // Cache successful response
      if (cacheTtl) {
        cache.set(cacheKey, {
          data,
          expires: now + cacheTtl,
        });
        logger.debug(`[API] Cached response: ${url} (TTL: ${cacheTtl}ms)`);
      }

      return data;
    })
    .catch((error) => {
      logger.error(`[API] Request failed: ${url}`, error);
      return null;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, request);
  return request;
}

/**
 * Clear all cached responses
 */
export function clearCache() {
  cache.clear();
  logger.debug('[API] Cache cleared');
}

/**
 * Clear cached responses matching a URL pattern
 * @param {string} pattern - URL pattern to match (e.g., '/friends', '/users/')
 */
export function clearCachePattern(pattern) {
  let cleared = 0;
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  logger.debug(`[API] Cleared ${cleared} cache entries matching: ${pattern}`);
}
