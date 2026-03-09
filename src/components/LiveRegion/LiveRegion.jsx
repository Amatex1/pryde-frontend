
/**
 * Live Region Component
 * Announces dynamic content changes to screen readers
 */

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';

// Live region context
const LiveRegionContext = createContext(null);

/**
 * LiveRegionProvider - Provides live region context
 */
export function LiveRegionProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const idCounter = useRef(0);

  const announce = (message, priority = 'polite') => {
    const id = ++idCounter.current;
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Auto-remove after announcement
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  };

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <LiveRegion announcements={announcements} />
    </LiveRegionContext.Provider>
  );
}

/**
 * useLiveRegion hook - Access to live region announcements
 */
export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  
  if (!context) {
    // Return a no-op if not in provider
    return { announce: () => {} };
  }
  
  return context;
}

/**
 * LiveRegion component - Renders aria-live regions
 */
function LiveRegion({ announcements }) {
  const politeRef = useRef(null);
  const assertiveRef = useRef(null);

  useEffect(() => {
    // Update polite region
    if (politeRef.current) {
      const politeAnnouncement = announcements.find(a => a.priority === 'polite');
      if (politeAnnouncement) {
        politeRef.current.textContent = politeAnnouncement.message;
      }
    }

    // Update assertive region
    if (assertiveRef.current) {
      const assertiveAnnouncement = announcements.find(a => a.priority === 'assertive');
      if (assertiveAnnouncement) {
        assertiveRef.current.textContent = assertiveAnnouncement.message;
      }
    }
  }, [announcements]);

  return (
    <>
      {/* Polite region - for most announcements */}
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Assertive region - for urgent announcements */}
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * useAnnounce hook - Simplified announcement hook
 */
export function useAnnounce() {
  const { announce } = useLiveRegion();

  return {
    /**
     * Announce a message politely (default)
     */
    announce: (message) => announce(message, 'polite'),
    
    /**
     * Announce a message urgently
     */
    announceUrgent: (message) => announce(message, 'assertive'),
    
    /**
     * Announce success
     */
    success: (message) => announce(message, 'polite'),
    
    /**
     * Announce error
     */
    error: (message) => announce(message, 'assertive'),
    
    /**
     * Announce loading state
     */
    loading: (message) => announce(message, 'polite'),
    
    /**
     * Announce completion
     */
    complete: (message) => announce(message, 'polite')
  };
}

export default {
  LiveRegionProvider,
  LiveRegion,
  useLiveRegion,
  useAnnounce
};

