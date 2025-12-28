/**
 * useBadges Hook
 * 
 * Fetches and caches badge data for users.
 * Provides badge lookup by user ID.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';

// In-memory cache for badge definitions
let badgeDefinitionsCache = null;
let badgeDefinitionsPromise = null;

/**
 * Fetch all badge definitions (cached)
 */
export async function fetchBadgeDefinitions() {
  if (badgeDefinitionsCache) {
    return badgeDefinitionsCache;
  }
  
  if (badgeDefinitionsPromise) {
    return badgeDefinitionsPromise;
  }
  
  badgeDefinitionsPromise = api.get('/badges')
    .then(response => {
      badgeDefinitionsCache = response.data;
      return badgeDefinitionsCache;
    })
    .catch(error => {
      logger.error('Failed to fetch badge definitions:', error);
      badgeDefinitionsPromise = null;
      return [];
    });
  
  return badgeDefinitionsPromise;
}

/**
 * Convert badge IDs to full badge objects
 */
export function resolveBadges(badgeIds, definitions) {
  if (!badgeIds || !Array.isArray(badgeIds) || !definitions) {
    return [];
  }
  
  return badgeIds
    .map(id => definitions.find(def => def.id === id))
    .filter(Boolean)
    .sort((a, b) => (a.priority || 100) - (b.priority || 100));
}

/**
 * Hook for using badges with a specific user
 */
export function useBadges(badgeIds = []) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const badgeIdsRef = useRef(badgeIds);

  useEffect(() => {
    let mounted = true;
    
    async function loadBadges() {
      try {
        const definitions = await fetchBadgeDefinitions();
        if (mounted) {
          const resolved = resolveBadges(badgeIdsRef.current, definitions);
          setBadges(resolved);
        }
      } catch (error) {
        logger.error('useBadges error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    loadBadges();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Update when badge IDs change
  useEffect(() => {
    badgeIdsRef.current = badgeIds;
    
    if (badgeDefinitionsCache) {
      const resolved = resolveBadges(badgeIds, badgeDefinitionsCache);
      setBadges(resolved);
    }
  }, [badgeIds]);

  return { badges, loading };
}

/**
 * Hook for fetching a user's badges by user ID
 */
export function useUserBadges(userId) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchUserBadges() {
      try {
        const response = await api.get(`/badges/user/${userId}`);
        if (mounted) {
          setBadges(response.data);
        }
      } catch (error) {
        logger.error('Failed to fetch user badges:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchUserBadges();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { badges, loading };
}

export default useBadges;

