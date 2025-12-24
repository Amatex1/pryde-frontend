import { useEffect, useState } from 'react';

/**
 * useUnreadMessages Hook
 * 
 * Fetches and tracks the count of unread messages for the current user.
 * Polls the API every 60 seconds to keep the count up-to-date.
 * 
 * @returns {number} count - The number of unread messages
 */
export function useUnreadMessages() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchUnread() {
      try {
        const res = await fetch('/api/messages/unread-count', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setCount(data.count || 0);
      } catch (error) {
        // Silently fail - don't show errors for background polling
        console.debug('Failed to fetch unread message count:', error);
      }
    }

    // Fetch immediately on mount
    fetchUnread();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return count;
}

