/**
 * Normalize Feed Data
 * 
 * Provides defensive normalization for feed API responses to ensure
 * all data structures are properly initialized and never null/undefined.
 * 
 * Usage:
 *   import normalizeFeedData from '../utils/normalizeFeedData';
 *   const normalized = normalizeFeedData(response.data);
 */

export default function normalizeFeedData(data) {
  if (!data) {
    return {
      posts: {},
      comments: {},
      reactions: {},
      users: {},
      metadata: {}
    }
  }
  return {
    posts: data?.posts ?? {},
    comments: data?.comments ?? {},
    reactions: data?.reactions ?? {},
    users: data?.users ?? {},
    metadata: data?.metadata ?? {}
  }
}

