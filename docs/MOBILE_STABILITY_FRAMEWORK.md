# Mobile-First Stability Framework for PWA & Mobile Browsers

## 🎯 Purpose

This framework ensures the Pryde PWA behaves **deterministically** on mobile devices and browsers, eliminating auth loops, stale cache issues, and unpredictable behavior.

---

## 🔥 Core Principles

### 1. **Assume JS Can Pause at Any Time**
Mobile apps can be backgrounded, causing JavaScript execution to pause. Code must handle interruptions gracefully.

**Rules:**
- ✅ Use cleanup functions in `useEffect`
- ✅ Detect app resume and refresh stale data
- ✅ Never assume continuous execution
- ❌ Don't rely on timers running uninterrupted

### 2. **Assume Requests Can Fail Once**
Mobile networks are unreliable (Wi-Fi ↔ cellular, tunnels, airplane mode).

**Rules:**
- ✅ Show loading states for all network requests
- ✅ Handle errors gracefully with retry options
- ✅ Never assume immediate success
- ❌ Don't show success UI before request completes

### 3. **Assume State Can Reset Mid-Render**
Mobile browsers aggressively evict apps from memory, causing state loss.

**Rules:**
- ✅ Persist critical state to localStorage/sessionStorage
- ✅ Hydrate state on mount
- ✅ Never rely on in-memory state alone
- ❌ Don't assume state survives backgrounding

### 4. **Assume App Can Cold-Boot Repeatedly**
iOS and mobile browsers kill apps frequently to save memory.

**Rules:**
- ✅ Implement deterministic bootstrap sequence
- ✅ Handle cold boot with no cache
- ✅ Handle cold boot with stale cache
- ❌ Don't assume warm start

---

## 📋 Implementation

### 1. Mobile-First Debug Rules (Dev Mode)

**File:** `src/utils/mobileDebug.js`

**Features:**
- Warns if effects depend on uninterrupted execution
- Warns if auth state mutates without persistence
- Warns if UI assumes immediate network success
- Warns if layout relies on fixed heights
- Warns if data fetched before authReady

**Usage:**
```javascript
import { warnUninterruptedExecution } from '../utils/mobileDebug';

useEffect(() => {
  warnUninterruptedExecution('MyComponent', 'Polling every 5 seconds');
  
  const interval = setInterval(() => {
    // Polling logic
  }, 5000);
  
  return () => clearInterval(interval); // Cleanup!
}, []);
```

---

### 2. Service Worker Caching Rules

**File:** `vite.config.js`

**NEVER Cache:**
- `/api/auth/*` - Auth endpoints
- `/api/refresh` - Token refresh
- `/api/push/status` - Push notification status
- `/api/users/me` - Current user data

**Cache Strategy:**
- **Auth endpoints:** `NetworkOnly` (never cache)
- **General API:** `NetworkFirst` with 5-minute TTL
- **Images:** `CacheFirst` with 30-day TTL
- **Fonts:** `CacheFirst` with 1-year TTL

**On Deploy:**
- Force service worker update
- Clear old caches
- Prevent stale JS bundles

---

### 3. PWA-Safe Auth Bootstrap Flow

**File:** `src/utils/authBootstrap.js`

**Boot Sequence (Mandatory Order):**
1. App mounts
2. `authLoading = true`
3. Load token from storage
4. **IF no token:**
   - `authReady = true`
   - `authLoading = false`
   - Render logged-out UI
5. **IF token exists:**
   - Attach token to API client
   - Call `/api/auth/me` **ONCE**
6. **IF /me succeeds:**
   - Hydrate user
   - `authReady = true`
7. **IF /me fails:**
   - Clear token
   - `authReady = true`
8. `authLoading = false`
9. **ONLY NOW allow:**
   - Data fetches
   - Sockets
   - Polling

**Absolute Rules:**
- ❌ No retries
- ❌ No loops
- ❌ No auth calls before bootstrap completes

**Usage:**
```javascript
import { executeAuthBootstrap } from '../utils/authBootstrap';

useEffect(() => {
  executeAuthBootstrap().then(({ user, error }) => {
    if (user) {
      setUser(user);
    }
  });
}, []);
```

---

### 4. Service Worker Debug Logging

**File:** `src/utils/serviceWorkerDebug.js`

**Features (Dev Mode Only):**
- Log when service worker serves cached response
- Warn if cached JS version != backend API version
- Detect stale auth responses
- Monitor cache hit/miss rates

**Usage:**
```javascript
import { initServiceWorkerDebug } from '../utils/serviceWorkerDebug';

// In main.jsx
if (import.meta.env.DEV) {
  initServiceWorkerDebug();
}
```

---

### 5. Mobile Stress Test Checklist

**File:** `MOBILE_STRESS_TEST_CHECKLIST.md`

**Mandatory Tests Before Release:**
- ☐ Cold boot with no cache
- ☐ Cold boot with valid token
- ☐ Cold boot with expired token
- ☐ Kill app mid-request, reopen
- ☐ Background app for 30+ seconds
- ☐ Toggle airplane mode during auth
- ☐ Switch Wi-Fi ↔ mobile data
- ☐ Rotate screen during auth loading
- ☐ Lock phone, unlock, resume app
- ☐ Refresh PWA while logged in
- ☐ Refresh PWA while logged out
- ☐ Logout → login → refresh → repeat

**Blocking Criteria:**
If ANY test causes auth loop, broken UI, missing avatar, or infinite loading → **BLOCK RELEASE**

---

## 🚀 Quick Start

### 1. Enable Mobile Debug Warnings (Dev)
```javascript
// In your component
import { warnPrematureDataFetch } from '../utils/mobileDebug';

useEffect(() => {
  warnPrematureDataFetch('MyComponent', '/api/posts');
  fetchPosts();
}, []);
```

### 2. Use PWA-Safe Auth Bootstrap
```javascript
// In AuthContext
import { executeAuthBootstrap } from '../utils/authBootstrap';

useEffect(() => {
  executeAuthBootstrap().then(({ user }) => {
    setUser(user);
    setAuthReady(true);
  });
}, []);
```

### 3. Run Mobile Stress Tests
Follow `MOBILE_STRESS_TEST_CHECKLIST.md` before every release.

---

## 📊 Success Metrics

**Before Framework:**
- ❌ Auth loops on PWA refresh
- ❌ Stale user data after deploy
- ❌ Infinite loading on mobile
- ❌ Broken UI after backgrounding

**After Framework:**
- ✅ Deterministic auth flow
- ✅ No stale cache issues
- ✅ Predictable mobile behavior
- ✅ Graceful error handling

---

**Last Updated:** 2025-12-25  
**Status:** Production-ready

