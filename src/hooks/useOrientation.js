/**
 * Custom hook to detect device orientation
 * Returns: 'portrait' | 'landscape'
 */

import { useState, useEffect } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState(
    typeof window !== 'undefined' 
      ? (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      : 'portrait'
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerWidth > window.innerHeight 
        ? 'landscape' 
        : 'portrait';
      
      setOrientation(newOrientation);
    };

    // Listen for both resize and orientationchange
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Initial check
    handleOrientationChange();

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

// Usage in components:
// const orientation = useOrientation();
// if (orientation === 'landscape') { ... }

