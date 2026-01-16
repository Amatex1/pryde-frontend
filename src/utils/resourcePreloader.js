/**
 * Resource Preloader - Reduce network waterfall
 * 
 * STRATEGY:
 * 1. Preload critical API endpoints in parallel
 * 2. Prefetch user data, posts, notifications
 * 3. Cache results for instant display
 * 4. Reduce perceived latency
 * 
 * USAGE:
 * - Call preloadCriticalResources() on app load
 * - Call preloadFeedData() before navigating to feed
 * - Use cached data to show UI instantly
 */

import api from './api';
import { apiFetch } from './apiClient';
import logger from './logger';

// Cache for preloaded data
// NOTE: trending removed 2025-12-26 (hashtags deprecated)
const cache = {
  user: null,
  posts: null,
  notifications: null,
  timestamp: null
};

// Cache TTL (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if cache is still valid
 */
function isCacheValid() {
  if (!cache.timestamp) return false;
  return Date.now() - cache.timestamp < CACHE_TTL;
}

/**
 * Preload critical resources in parallel
 * Call this on app load (after auth bootstrap)
 */
export async function preloadCriticalResources() {
  try {
    logger.debug('🚀 Preloading critical resources...');

    // NOTE: /auth/me is now handled by AuthContext, so we skip it here
    // Preload notifications only
    const notificationsResponse = await apiFetch(
      '/notifications?limit=10',
      {},
      { cacheTtl: 60_000 } // 1 minute cache
    ).catch(err => {
      logger.debug('Notifications preload failed (non-critical):', err);
      return null;
    });

    // Cache successful responses
    if (notificationsResponse) {
      cache.notifications = notificationsResponse;
      logger.debug('✅ Notifications preloaded');
    }

    cache.timestamp = Date.now();
    logger.debug('🎉 Critical resources preloaded');
  } catch (error) {
    logger.warn('Resource preload failed (non-critical):', error);
    // Don't throw - this is just an optimization
  }
}

/**
 * Preload feed data
 * Call this before navigating to feed
 */
export async function preloadFeedData() {
  try {
    logger.debug('🚀 Preloading feed data...');

    // 🚀 LCP OPTIMIZATION: Preload first page of posts using same endpoint as Feed.jsx
    // Use /posts endpoint with filter=followers to match Feed.jsx default state
    const postsResponse = await api.get('/posts?filter=followers&page=1&limit=20').catch(err => {
      logger.debug('Posts preload failed (non-critical):', err);
      return null;
    });

    // Cache successful response (preserves the full response structure)
    if (postsResponse?.data) {
      cache.posts = postsResponse.data;
      logger.debug(`✅ Posts preloaded (${postsResponse.data.posts?.length || 0} posts)`);
    }

    cache.timestamp = Date.now();
    logger.debug('🎉 Feed data preloaded');
  } catch (error) {
    logger.warn('Feed preload failed (non-critical):', error);
  }
}

/**
 * Get cached user data
 */
export function getCachedUser() {
  return isCacheValid() ? cache.user : null;
}

/**
 * Get cached posts
 */
export function getCachedPosts() {
  return isCacheValid() ? cache.posts : null;
}

/**
 * Get cached notifications
 */
export function getCachedNotifications() {
  return isCacheValid() ? cache.notifications : null;
}

// REMOVED 2025-12-26: getCachedTrending() - hashtags deprecated

/**
 * Clear cache
 */
export function clearCache() {
  cache.user = null;
  cache.posts = null;
  cache.notifications = null;
  cache.timestamp = null;
  logger.debug('🗑️ Resource cache cleared');
}

