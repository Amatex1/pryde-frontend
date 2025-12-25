/**
 * Service Worker API Collision Detector
 * 
 * Dev mode only:
 * - Detect if SW intercepts /api request
 * - Log hard warning: ⚠️ Service Worker intercepted API request (blocked)
 * 
 * This prevents regression and helps debug CORS/ERR_FAILED issues.
 */

const API_ENDPOINTS = [
  '/api/',
  '/auth/',
  '/status',
  '/me',
  '/notifications',
  '/counts',
  '/refresh',
  '/push/',
  '/users/',
  '/posts/',
  '/messages/',
  '/feed/',
  '/search/',
  '/upload/',
  '/admin/',
  '/stability/',
  '/session-inspector/',
  '/safe-mode/'
];

/**
 * Check if URL is an API endpoint
 */
function isApiEndpoint(url) {
  try {
    const urlObj = new URL(url);
    return API_ENDPOINTS.some(endpoint => urlObj.pathname.includes(endpoint));
  } catch (error) {
    return false;
  }
}

/**
 * Intercept fetch to detect SW interception
 */
function interceptFetch() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, options] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    
    // Check if this is an API request
    if (isApiEndpoint(url)) {
      // Check if service worker is active
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        // Log warning
        console.warn(
          `⚠️ [SW Collision] Service Worker is active and may intercept API request: ${url}`
        );
        console.warn(
          `⚠️ [SW Collision] This can cause CORS errors and ERR_FAILED loops`
        );
        console.warn(
          `⚠️ [SW Collision] Service Worker: ${navigator.serviceWorker.controller.scriptURL}`
        );
      }
    }
    
    // Call original fetch
    return originalFetch.apply(this, args);
  };
}

/**
 * Monitor service worker fetch events
 */
function monitorServiceWorkerFetch() {
  if (!navigator.serviceWorker) {
    console.log('[SW Collision] Service workers not supported');
    return;
  }
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FETCH_INTERCEPTED') {
      const url = event.data.url;
      
      if (isApiEndpoint(url)) {
        console.error(
          `🚨 [SW Collision] Service Worker intercepted API request: ${url}`
        );
        console.error(
          `🚨 [SW Collision] This should NEVER happen - API requests must bypass SW`
        );
        console.error(
          `🚨 [SW Collision] Check vite.config.js and sw-bypass-api.js`
        );
      }
    }
  });
}

/**
 * Check if service worker is intercepting API requests
 */
async function checkServiceWorkerInterception() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    console.log('[SW Collision] No active service worker');
    return;
  }
  
  console.log('[SW Collision] Checking service worker interception...');
  
  // Test API endpoints
  const testEndpoints = ['/api/test', '/auth/test', '/me'];
  
  for (const endpoint of testEndpoints) {
    try {
      // Create a message channel
      const messageChannel = new MessageChannel();
      
      // Send message to service worker
      navigator.serviceWorker.controller.postMessage(
        {
          type: 'CHECK_API_BYPASS',
          url: endpoint
        },
        [messageChannel.port2]
      );
      
      // Wait for response
      const response = await new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        // Timeout after 1 second
        setTimeout(() => {
          resolve({ type: 'TIMEOUT' });
        }, 1000);
      });
      
      if (response.type === 'API_BYPASS_RESULT') {
        if (response.shouldBypass) {
          console.log(`✅ [SW Collision] ${endpoint} will bypass service worker`);
        } else {
          console.error(`🚨 [SW Collision] ${endpoint} will NOT bypass service worker - THIS IS A BUG`);
        }
      }
    } catch (error) {
      console.error(`[SW Collision] Error checking ${endpoint}:`, error);
    }
  }
}

/**
 * Initialize SW-API collision detector (dev mode only)
 */
export function initSwApiCollisionDetector() {
  if (import.meta.env.PROD) {
    console.log('[SW Collision] Skipping in production mode');
    return;
  }
  
  console.log('[SW Collision] 🔍 Initializing SW-API collision detector...');
  
  // Intercept fetch
  interceptFetch();
  
  // Monitor service worker fetch events
  monitorServiceWorkerFetch();
  
  // Check service worker interception
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    checkServiceWorkerInterception();
  } else {
    // Wait for service worker to be ready
    navigator.serviceWorker.ready.then(() => {
      checkServiceWorkerInterception();
    });
  }
  
  console.log('[SW Collision] ✅ SW-API collision detector initialized');
}

