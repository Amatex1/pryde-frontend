# Update Detection System

## Overview
Implemented a reliable, non-intrusive update detection system that automatically detects new deployments and prompts users to refresh without requiring manual page reload.

## Architecture

### Backend (API Endpoint)

**File:** `server/routes/version.js`

```javascript
GET /api/version
```

**Response:**
```json
{
  "version": "1.0.0",
  "timestamp": 1234567890,
  "environment": "production"
}
```

**Environment Variables:**
- `BUILD_VERSION` - Set during build/deployment (e.g., git commit hash, version number)
- `BUILD_TIME` - Timestamp of build
- `NODE_ENV` - Environment (development/production)

### Frontend Components

#### 1. Version Checker (`src/utils/versionChecker.js`)

**Purpose:** Polls the backend API to detect version changes

**Key Functions:**
- `checkVersion()` - Checks backend for new version
- `subscribeToUpdates(fn)` - Subscribe to update notifications
- `resetUpdateDetection()` - Reset state after refresh
- `isUpdateDetected()` - Get current detection state

**How it works:**
1. Fetches `/api/version` from backend
2. Compares with stored version
3. If different, triggers update notification
4. Notifies all subscribers

#### 2. Update Store (`src/state/updateStore.js`)

**Purpose:** Global state management for update availability

**Key Functions:**
- `useUpdateStore(setter)` - Subscribe to update state changes
- `triggerUpdate()` - Trigger update notification
- `resetUpdateState()` - Reset after refresh
- `isUpdateAvailable()` - Check if update is available

**Integration:**
- Subscribes to version checker updates
- Listens for service worker events
- Manages React component state

#### 3. Update Banner (`src/components/UpdateBanner.jsx`)

**Purpose:** Non-intrusive UI notification for updates

**Features:**
- Pill-shaped banner at bottom center
- "Refresh Now" and "Later" buttons
- Clears all caches before refresh
- Refreshes auth token to keep user logged in
- Responsive design (mobile/desktop)

**Styling:** `src/components/UpdateBanner.css`
- Mobile: Compact pill at bottom center
- Desktop: Expanded card with description
- Uses CSS variables for theming
- Smooth animations

### Auto-Check Triggers

The system checks for updates automatically in these scenarios:

1. **On App Load** - Immediate check when app starts
2. **Every 60 Seconds** - Periodic polling (configurable)
3. **Window Focus** - When user returns to tab
4. **Visibility Change** - When tab becomes visible
5. **Online Event** - When connection is restored
6. **Service Worker Update** - When new SW is installed

## Implementation Details

### App.jsx Integration

```javascript
// Subscribe to update notifications
const unsubscribe = useUpdateStore(setUpdateAvailable);

// Check immediately on load
checkVersion();

// Check every 60 seconds
const versionCheckInterval = setInterval(checkVersion, 60000);

// Check on window focus
const onFocus = () => checkVersion();
window.addEventListener('focus', onFocus);

// Check on visibility change
const onVisible = () => {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
};
document.addEventListener('visibilitychange', onVisible);

// Check when coming back online
const onOnline = () => checkVersion();
window.addEventListener('online', onOnline);
```

### Service Worker Integration

**File:** `src/main.jsx`

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.dispatchEvent(new Event('pryde-update-detected'));
  });
}
```

This ensures updates are detected even when service worker updates independently.

## User Experience

### Update Flow

1. **New Deployment** - Backend version changes
2. **Detection** - Frontend detects change via API poll
3. **Notification** - Non-intrusive banner appears at bottom
4. **User Choice:**
   - **Refresh Now** - Clears caches, refreshes auth, reloads page
   - **Later** - Dismisses banner, user can continue working

### Banner Behavior

**Mobile:**
```
┌─────────────────────────────────┐
│ 🎉 New update available [Refresh]│
└─────────────────────────────────┘
```

**Desktop:**
```
┌──────────────────────────────────────┐
│ 🎉 New update available              │
│    A new version of Pryde is ready.  │
│    [Refresh Now] [Later]             │
└──────────────────────────────────────┘
```

### Cache Clearing

When user clicks "Refresh Now":

1. Refresh auth token (keeps user logged in)
2. Unregister all service workers
3. Clear all caches
4. Reload with cache-busting parameter

```javascript
const timestamp = Date.now();
window.location.href = `${window.location.origin}${window.location.pathname}?v=${timestamp}`;
```

## Configuration

### Backend Environment Variables

Set these during build/deployment:

```bash
BUILD_VERSION=1.2.3
BUILD_TIME=1234567890
NODE_ENV=production
```

### Frontend Configuration

**Check Interval:** `src/App.jsx`
```javascript
const versionCheckInterval = setInterval(checkVersion, 60000); // 60 seconds
```

**API Endpoint:** `src/utils/versionChecker.js`
```javascript
const res = await fetch('/api/version', { cache: 'no-store' });
```

## Testing

### Manual Testing

1. **Console Testing:**
```javascript
// Check current version
fetch('/api/version').then(r => r.json()).then(console.log)

// Trigger manual check
window.checkForUpdate()
```

2. **Simulate Update:**
   - Change `BUILD_VERSION` environment variable
   - Restart backend
   - Wait 60 seconds or focus window
   - Banner should appear

### Automated Testing

```javascript
// Test version checker
import { checkVersion, subscribeToUpdates } from './utils/versionChecker';

const unsubscribe = subscribeToUpdates(() => {
  console.log('Update detected!');
});

await checkVersion();
```

## Benefits

✅ **Non-Intrusive** - Pill banner at bottom, doesn't block content
✅ **Automatic** - No manual refresh needed to detect updates  
✅ **Reliable** - Multiple detection methods (API + Service Worker)
✅ **User-Friendly** - Clear options, keeps user logged in
✅ **Performant** - Lightweight API calls, efficient polling
✅ **Responsive** - Adapts to mobile and desktop
✅ **Themeable** - Uses CSS variables for dark/light mode

## Comparison with Old System

| Feature | Old System | New System |
|---------|-----------|------------|
| Detection Method | Meta tag in HTML | Backend API endpoint |
| Update Trigger | Manual refresh required | Automatic detection |
| Check Frequency | 5 minutes | 1 minute + events |
| Banner Style | Top-right toast | Bottom-center pill |
| Mobile Support | Limited | Fully responsive |
| Cache Clearing | Manual | Automatic |
| Auth Preservation | No | Yes |

## Future Enhancements

- [ ] Add update changelog display
- [ ] Add "Don't show again" option
- [ ] Add update scheduling (refresh at specific time)
- [ ] Add A/B testing for banner styles
- [ ] Add analytics for update adoption rate
- [ ] Add progressive update (update in background)

