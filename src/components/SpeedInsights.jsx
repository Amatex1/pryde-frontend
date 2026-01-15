/**
 * SpeedInsights Component
 * 
 * Integrates Vercel Speed Insights for performance monitoring.
 * This component should be mounted near the root of your app to track all performance metrics.
 * 
 * For more information, see:
 * https://vercel.com/docs/speed-insights
 */

import { useEffect } from 'react';

export default function SpeedInsights() {
  useEffect(() => {
    // Dynamically import and inject Speed Insights
    import('@vercel/speed-insights').then(({ injectSpeedInsights }) => {
      injectSpeedInsights();
    }).catch((err) => {
      console.error('Failed to load Vercel Speed Insights:', err);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
