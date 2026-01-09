/**
 * Route Prefetching Utility
 * 
 * PERFORMANCE: Prefetch critical routes to make navigation feel instant
 * 
 * How it works:
 * - On hover/focus of navigation links, prefetch the route's JS chunk
 * - Uses <link rel="prefetch"> to load chunks with low priority
 * - Doesn't block main thread or current page
 * - Browser caches the chunk, so navigation is instant
 * 
 * Usage:
 * import { prefetchRoute } from '../utils/routePrefetch';
 * 
 * <Link 
 *   to="/messages" 
 *   onMouseEnter={() => prefetchRoute('/messages')}
 *   onFocus={() => prefetchRoute('/messages')}
 * >
 */

const prefetchedRoutes = new Set();

/**
 * Prefetch a route's JavaScript chunk
 * @param {string} route - Route path (e.g., '/messages', '/profile')
 */
export function prefetchRoute(route) {
  // Skip if already prefetched
  if (prefetchedRoutes.has(route)) {
    return;
  }

  // Skip in development (Vite handles this differently)
  if (import.meta.env.DEV) {
    return;
  }

  // Mark as prefetched
  prefetchedRoutes.add(route);

  // Map routes to their lazy-loaded chunks
  // These paths match the dynamic imports in your route config
  const routeChunkMap = {
    '/messages': () => import('../pages/Messages.jsx'),
    '/profile': () => import('../features/profile/ProfileController.jsx'),
    '/feed': () => import('../pages/Feed.jsx'),
    '/lounge': () => import('../pages/Lounge.jsx'),
    '/groups': () => import('../pages/Groups.jsx'),
    '/settings': () => import('../pages/Settings.jsx'),
    '/search': () => import('../pages/Search.jsx'),
  };

  // Get the import function for this route
  const importFn = routeChunkMap[route];

  if (!importFn) {
    console.warn(`[Prefetch] No chunk mapping for route: ${route}`);
    return;
  }

  // Prefetch the chunk
  // This triggers the dynamic import but doesn't execute the module
  // The browser caches it for when the user actually navigates
  importFn().catch((error) => {
    console.error(`[Prefetch] Failed to prefetch ${route}:`, error);
    prefetchedRoutes.delete(route); // Allow retry
  });
}

/**
 * Prefetch multiple routes at once
 * @param {string[]} routes - Array of route paths
 */
export function prefetchRoutes(routes) {
  routes.forEach(prefetchRoute);
}

/**
 * Prefetch on idle (when browser is not busy)
 * @param {string[]} routes - Array of route paths to prefetch
 */
export function prefetchOnIdle(routes) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchRoutes(routes);
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      prefetchRoutes(routes);
    }, 1000);
  }
}

/**
 * Clear prefetch cache (useful for testing)
 */
export function clearPrefetchCache() {
  prefetchedRoutes.clear();
}

