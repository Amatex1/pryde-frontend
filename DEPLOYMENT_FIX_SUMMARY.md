# Deployment Fix Summary - MIME Type Error & SSR Build Error

## Issues Fixed

### 1. **MIME Type Error: "unsupported MIME type ('text/html')"**
**Root Cause:** Service worker conflicts and incorrect routing configuration were causing JavaScript files to be served as HTML.

**Solutions Applied:**
- ✅ Removed custom `public/sw.js` that conflicted with Vite PWA plugin
- ✅ Updated `vite.config.js` to properly configure service worker
- ✅ Updated `public/_redirects` to exclude static assets from SPA routing
- ✅ Fixed `navigateFallback` configuration in Vite PWA plugin

### 2. **SSR Build Error: "rollupOptions.input should not be an html file when building for SSR"**
**Root Cause:** Both repositories had `render.yaml` files trying to deploy both services, causing conflicts.

**Solutions Applied:**
- ✅ Separated backend and frontend deployments
- ✅ Updated backend's `render.yaml` to only deploy backend service
- ✅ Updated frontend's `render.yaml` to only deploy frontend service

---

## Changes Made

### Frontend Repository (`pryde-frontend`)

#### 1. **Removed Custom Service Worker**
- Deleted `public/sw.js` (conflicted with Vite PWA plugin)
- Vite PWA now generates optimized service worker automatically

#### 2. **Updated `vite.config.js`**
```javascript
// Changed from:
navigateFallback: null

// To:
navigateFallback: 'index.html',
navigateFallbackDenylist: [/^\/api/, /^\/assets\//, /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/]
```

#### 3. **Updated `public/_redirects`**
Added explicit exclusions for static assets:
```
/assets/*  200
/icons/*   200
/*.js      200
/*.css     200
/sw.js     200
/workbox-*.js   200
# ... etc
```

#### 4. **Updated `render.yaml`**
- Removed backend service definition
- Added proper static asset routing
- Added cache headers for optimal performance

### Backend Repository (`pryde-backend`)

#### 1. **Updated `render.yaml`**
- Removed frontend service definition
- Kept only backend API service

---

## Deployment Instructions

### Frontend Deployment (Render)

1. **Create New Static Site on Render:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Static Site"
   - Connect to `pryde-frontend` repository
   - Render will automatically use the `render.yaml` configuration

2. **Verify Build Settings:**
   - Build Command: `npm install && npm run build`
   - Publish Directory: `./dist`
   - Auto-Deploy: Yes (on push to main)

3. **Environment Variables:**
   - No environment variables needed for static site
   - API URL is configured in `src/config/api.js`

### Backend Deployment (Render)

1. **Verify Existing Service:**
   - Backend should already be deployed from `pryde-backend` repository
   - Service name: `pryde-backend`
   - URL: `https://pryde-backend.onrender.com`

2. **Check Environment Variables:**
   - Ensure all required env vars are set in Render Dashboard
   - See backend's `render.yaml` for required variables

---

## Testing Checklist

After deployment, verify:

- [ ] Frontend builds successfully without SSR errors
- [ ] No MIME type errors in browser console
- [ ] JavaScript files load correctly (check Network tab)
- [ ] Service worker registers successfully
- [ ] Static assets (images, fonts) load correctly
- [ ] SPA routing works (refresh on any route)
- [ ] API calls to backend work correctly
- [ ] PWA features work (install prompt, offline mode)

---

## Files Modified

### Frontend Repository
- `vite.config.js` - Fixed service worker configuration
- `public/_redirects` - Added static asset exclusions
- `public/sw.js` - **DELETED** (conflicted with Vite PWA)
- `render.yaml` - Removed backend service, added proper routing

### Backend Repository
- `render.yaml` - Removed frontend service

---

## Next Steps

1. **Monitor Deployment:**
   - Check Render dashboard for successful deployment
   - Review build logs for any warnings

2. **Clear Browser Cache:**
   - Users may need to clear cache or hard refresh (Ctrl+Shift+R)
   - Service worker will auto-update on next visit

3. **Test in Production:**
   - Verify all features work correctly
   - Check browser console for errors
   - Test on multiple devices/browsers

---

## Troubleshooting

### If MIME Type Error Persists:
1. Clear browser cache completely
2. Unregister service workers in DevTools → Application → Service Workers
3. Hard refresh (Ctrl+Shift+R)

### If Build Fails:
1. Check build logs in Render dashboard
2. Verify `package.json` has correct dependencies
3. Ensure `vite.config.js` has no syntax errors

### If Assets Don't Load:
1. Check `_redirects` file is in `dist/` folder after build
2. Verify Render routing configuration
3. Check browser Network tab for 404 errors

---

## Support

For issues, check:
- Render build logs: https://dashboard.render.com
- Browser console for client-side errors
- Backend logs for API errors

