# Workbox Service Worker API Bypass Fix

## Problem
Service worker was intercepting API requests, causing:
- CORS errors
- ERR_FAILED loops
- Auth request failures
- Stale API responses
- Mobile/desktop behavior misalignment

## Solution

### 1. ✅ Exclude ALL API Requests from Service Worker

**File:** `vite.config.js`

**Changes:**
- Removed ALL API caching strategies (NetworkFirst, NetworkOnly)
- Added `navigateFallbackDenylist` to exclude API patterns
- Restricted runtime caching to STATIC ASSETS ONLY:
  - Images (uploads, static)
  - Fonts
  - JS/CSS bundles
- Added `cacheableResponse` filters for safety

**API Patterns Excluded:**
- `/api/*`
- `/auth/*`
- `/status`
- `/me`
- `/notifications`
- `/counts`

### 2. ✅ Restrict Workbox to Static Assets Only

**File:** `vite.config.js`

**Runtime Caching (STATIC ONLY):**
```javascript
runtimeCaching: [
  // Images from uploads (30 days)
  { urlPattern: /uploads\/.*/, handler: 'CacheFirst' },
  
  // Static images (30 days)
  { urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/, handler: 'CacheFirst' },
  
  // Fonts (1 year)
  { urlPattern: /\.(woff2?|ttf|eot)$/, handler: 'CacheFirst' },
  
  // JS/CSS bundles (7 days)
  { urlPattern: /\.(js|css)$/, handler: 'CacheFirst' }
]
```

**NO API caching, NO JSON caching, NO authenticated endpoints**

### 3. ✅ Force Network-Only Strategy for Fetch

**File:** `public/sw-bypass-api.js`

**Custom Service Worker Plugin:**
- Intercepts ALL fetch events BEFORE Workbox
- Checks if request should bypass service worker:
  - URL matches API pattern
  - Has Authorization header
  - Has credentials: 'include'
  - Accepts JSON
- If yes, fetches directly from network
- If no, lets Workbox handle it

**Key Features:**
- `event.stopImmediatePropagation()` prevents Workbox from handling bypassed requests
- Logs bypasses in dev mode
- Notifies clients of bypassed requests

### 4. ✅ Clear Stale Service Workers & Caches

**File:** `src/utils/clearStaleSW.js`

**On Next Load:**
1. Unregister ALL existing service workers
2. Delete all Workbox caches:
   - `workbox-*`
   - `api-cache`
   - `auth-no-cache`
   - `refresh-no-cache`
   - `push-no-cache`
   - `user-no-cache`
   - `image-cache`
   - `static-image-cache`
   - `font-cache`
   - `static-resources`
3. Register clean service worker with corrected rules
4. Mark as cleared (runs only once)

**Integration:** `src/main.jsx`
```javascript
clearStaleSWAndCaches().then(result => {
  console.log(`Unregistered ${result.serviceWorkersUnregistered} SW(s)`);
  console.log(`Deleted ${result.cachesDeleted} cache(s)`);
  return registerServiceWorker();
});
```

### 5. ✅ Add Dev Warning for SW-API Collision

**File:** `src/utils/swApiCollisionDetector.js`

**Dev Mode Only:**
- Intercepts `window.fetch` to detect SW interception
- Monitors service worker fetch events
- Checks if SW is bypassing API requests correctly
- Logs hard warnings:
  - `⚠️ Service Worker is active and may intercept API request`
  - `🚨 Service Worker intercepted API request - THIS SHOULD NEVER HAPPEN`

**Integration:** `src/main.jsx`
```javascript
if (import.meta.env.DEV) {
  initSwApiCollisionDetector();
}
```

## Final Outcome

✅ **No CORS errors from Workbox**
- API requests bypass service worker entirely
- No cache interference with CORS headers

✅ **No ERR_FAILED loops**
- Stale service workers cleared on next load
- Clean service worker registration

✅ **Auth requests reach backend correctly**
- Authorization headers preserved
- Credentials included
- No cache interference

✅ **PWA behaves deterministically**
- Static assets cached (images, fonts, JS/CSS)
- API requests always fresh from network
- No zombie PWA state

✅ **Mobile & desktop behavior aligns**
- Same caching strategy across platforms
- No platform-specific bugs
- Consistent user experience

## Testing

### Manual Testing
1. Clear browser cache
2. Reload app
3. Check console for:
   - `[Clear SW] ✅ All service workers unregistered`
   - `[Clear SW] ✅ All Workbox caches deleted`
   - `[SW Bypass] ⚠️ API request bypassed service worker: /api/...`

### Dev Mode Testing
1. Open DevTools Console
2. Make API request
3. Check for warnings:
   - `⚠️ [SW Collision] Service Worker is active and may intercept API request`
   - `✅ [SW Collision] /api/test will bypass service worker`

### Production Testing
1. Build app: `npm run build`
2. Deploy to production
3. Check Network tab:
   - API requests should show `(from network)`
   - Static assets should show `(from ServiceWorker)`

## Files Changed

1. `vite.config.js` - Workbox configuration
2. `public/sw-bypass-api.js` - Custom SW bypass plugin
3. `src/utils/clearStaleSW.js` - Clear stale SW & caches
4. `src/utils/swApiCollisionDetector.js` - Dev warning system
5. `src/main.jsx` - Integration

## Migration Notes

**For existing users:**
- Stale service workers will be cleared automatically on next load
- No manual intervention required
- One-time cleanup process

**For new users:**
- Clean service worker registration
- No stale cache issues
- Optimal performance from day one

