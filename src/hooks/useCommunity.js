/**
 * useCommunity - Hook for fetching community features data
 * 
 * Fetches:
 * - Member spotlight
 * - Weekly themes
 * - Active members
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import logger from '../utils/logger';

export function useCommunity() {
  const [spotlight, setSpotlight] = useState(null);
  const [themes, setThemes] = useState([]);
  const [activeMembers, setActiveMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all community data in parallel
      const [spotlightRes, themesRes, membersRes] = await Promise.allSettled([
        api.get('/community/spotlight').catch(err => {
          logger.warn('Failed to fetch spotlight:', err.message);
          return { data: { spotlight: null } };
        }),
        api.get('/community/themes').catch(err => {
          logger.warn('Failed to fetch themes:', err.message);
          return { data: { themes: [] } };
        }),
        api.get('/community/active-members').catch(err => {
          logger.warn('Failed to fetch active members:', err.message);
          return { data: { members: [] } };
        })
      ]);

      // Process spotlight
      if (spotlightRes.status === 'fulfilled' && spotlightRes.value.data?.spotlight) {
        setSpotlight(spotlightRes.value.data.spotlight);
      }

      // Process themes
      if (themesRes.status === 'fulfilled' && themesRes.value.data?.themes) {
        setThemes(themesRes.value.data.themes);
      }

      // Process active members (limit to 5 for sidebar)
      if (membersRes.status === 'fulfilled' && membersRes.value.data?.members) {
        setActiveMembers(membersRes.value.data.members.slice(0, 5));
      }

    } catch (err) {
      logger.error('Failed to fetch community data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const dismissSpotlight = useCallback(() => {
    setSpotlight(null);
  }, []);

  const refresh = useCallback(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  return {
    spotlight,
    themes,
    activeMembers,
    loading,
    error,
    dismissSpotlight,
    refresh
  };
}

export default useCommunity;

