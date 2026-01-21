# Service Worker Comprehensive Fix

## Overview

This document describes the comprehensive fix for service worker API interception issues, including safe testing infrastructure and auto-disable protection.

## Problem Statement

Service worker was intercepting API and auth requests, causing:
- CORS errors
- ERR_FAILED loops
- Auth request failures
- Stale API responses
- Mobile/desktop behavior misalignment
- Infinite auth loops

## Solution: Three-Phase Approach

### Phase 1: Exact Workbox Exclusion Rules (MANDATORY)

**File:** `public/sw-bypass-api.js`

**RULE:** Service Worker must NEVER intercept API or auth traffic.

**Bypass Logic (runs BEFORE Workbox routing):**

Request is bypassed if:
1. URL matches API pattern: `/api/*`, `/auth/*`, `/me`, `/status`, `/notifications`, `/counts`
2. Has `Authorization` header
3. Has `credentials: include`
4. Accepts JSON (`Accept: application/json`)
5. Is cross-origin (only cache same-origin)
6. Is not a static asset (`.js`, `.css`, fonts, images)

**Workbox Restrictions:**
- Same-origin only
- Static assets only: `*.js`, `*.css`, fonts, icons, images
- NO runtime caching for JSON
- NO runtime caching for fetch APIs
- NO cross-origin caching

**Outcome:**
- ✅ Workbox never touches authenticated requests
- ✅ CORS / ERR_FAILED loops eliminated
- ✅ Auth requests always reach backend

### Phase 2: Safe Service Worker Behavior Testing

**File:** `src/utils/swTestingInfrastructure.js`

**DEV-ONLY SW Instrumentation:**

**Interception Logger:**
- Logs when service worker intercepts a request
- Logs request URL and whether bypassed or handled
- **HARD WARNING** if SW attempts to handle `/api` request
- Includes stack trace for debugging

**Manual Test Hooks:**
```javascript
// Available in dev mode via window.swTest
window.swTest.toggleSW(true/false)      // Toggle SW on/off
window.swTest.forceSWUpdate()           // Force SW update
window.swTest.forceCacheClear()         // Force cache clear
window.swTest.simulateOffline(true)     // Simulate offline mode
window.swTest.getReport()               // Get interception report
window.swTest.clearLog()                // Clear interception log
```

**Checklist Enforcement:**
```javascript
// Available in dev mode via window.swAuthChecklist
window.swAuthChecklist.testAuthWithSW()         // Test auth with SW enabled
window.swAuthChecklist.testAuthWithoutSW()      // Test auth with SW disabled
window.swAuthChecklist.checkBehaviorIdentical() // Verify identical behavior
```

**Outcome:**
- ✅ Deterministic SW behavior
- ✅ Easy regression detection
- ✅ Confidence before deploy

### Phase 3: Auto-Disable Service Worker on Auth Instability

**File:** `src/utils/swAutoDisable.js`

**Guarded Auto-Disable Logic:**

**Monitors:**
- Auth bootstrap failures
- Repeated `/api/auth/me` failures
- AuthReady loops
- ERR_FAILED on auth endpoints

**Trigger Conditions:**
- Same auth failure occurs 3 times in 1 minute
- Failure originates from fetch interception
- Service worker involved in request chain

**When Triggered:**
1. Automatically unregister service worker
2. Clear SW caches
3. Set `SW_DISABLED_RECOVERY` flag
4. Show calm banner: "We disabled offline mode to restore stability."
5. Reload app cleanly (network-only)

**Rules:**
- Auto-disable triggers ONLY after Phase 1 exclusions
- Never disables SW due to backend 401s (normal auth flow)
- Never loops disable/enable

**User-Facing Behavior:**
- Calm banner shown on recovery
- Dismiss button available
- Offline features disabled only when harmful

**Outcome:**
- ✅ Self-healing PWA
- ✅ No infinite auth loops
- ✅ Offline features disabled only when harmful
- ✅ SW auto-disable acts as safety net, not band-aid

## Implementation Details

### Files Created

1. **`public/sw-bypass-api.js`** - Phase 1: Exact bypass logic
2. **`src/utils/swTestingInfrastructure.js`** - Phase 2: Testing infrastructure
3. **`src/utils/swAutoDisable.js`** - Phase 3: Auto-disable protection

### Files Modified

1. **`vite.config.js`** - Workbox configuration with importScripts
2. **`src/main.jsx`** - Integration of all three phases

### Integration Flow

```
App Startup
├── DEV MODE
│   ├── Initialize SW testing infrastructure
│   ├── Initialize SW-API collision detector
│   └── Expose test hooks globally
│
└── PRODUCTION MODE
    ├── Initialize auto-disable protection
    ├── Check if SW disabled for recovery
    │   ├── YES → Skip SW registration, show banner
    │   └── NO → Continue
    ├── Clear stale SW and caches
    └── Register service worker
        └── Import sw-bypass-api.js (Phase 1)
```

### Service Worker Fetch Flow

```
Fetch Event
├── sw-bypass-api.js (Phase 1)
│   ├── Check if should bypass
│   │   ├── YES → fetch() directly, stop propagation
│   │   └── NO → Continue
│   └── Notify clients (for testing)
│
└── Workbox (only if not bypassed)
    └── Handle static assets only
```

## Testing

### Manual Testing (Dev Mode)

1. **Test API Bypass:**
   ```javascript
   // Open DevTools Console
   window.swTest.enableLogging()
   // Make API request
   fetch('/api/auth/me')
   // Check console for: ✅ API request correctly bypassed
   ```

2. **Test SW Toggle:**
   ```javascript
   // Disable SW
   window.swTest.toggleSW(false)
   // Enable SW
   window.swTest.toggleSW(true)
   ```

3. **Test Auth Checklist:**
   ```javascript
   // After auth bootstrap
   window.swAuthChecklist.testAuthWithSW()
   window.swAuthChecklist.checkBehaviorIdentical()
   ```

4. **Get Interception Report:**
   ```javascript
   window.swTest.getReport()
   // Returns: { totalInterceptions, apiInterceptions, apiHandled, apiBypassed }
   ```

### Auto-Disable Testing (Production)

1. **Simulate Auth Failures:**
   - Cause 3 auth failures in 1 minute
   - Verify auto-disable triggers
   - Verify banner shows
   - Verify app reloads

2. **Check Recovery State:**
   ```javascript
   window.swAutoDisable.isDisabled()  // true
   window.swAutoDisable.getReason()   // { reason: 'auth_instability', ... }
   ```

3. **Clear Recovery Flag:**
   ```javascript
   window.swAutoDisable.clearRecoveryFlag()
   // Reload to re-enable SW
   ```

## Final Guarantees

✅ **API traffic bypasses Workbox 100%**
- All API requests go directly to network
- No cache interference
- No CORS errors

✅ **Service worker handles static assets only**
- JS, CSS, fonts, images
- Same-origin only
- Immutable assets only

✅ **Mobile & desktop behavior align**
- Consistent caching strategy
- No platform-specific bugs

✅ **Auth loops eliminated at the source**
- Phase 1 prevents SW from touching auth
- Phase 3 auto-disables if issues persist

✅ **SW auto-disable acts as safety net, not band-aid**
- Only triggers after Phase 1 exclusions
- Only triggers on repeated failures
- Only triggers when SW is involved

## Migration Notes

**For existing users:**
- Stale service workers cleared automatically on next load
- Auto-disable protection active immediately
- No manual intervention required

**For new users:**
- Clean service worker registration
- No stale cache issues
- Optimal performance from day one

## Debugging

**Dev Mode Commands:**
```javascript
// SW Testing
window.swTest.getReport()
window.swTest.clearLog()
window.swTest.forceCacheClear()

// Auth Checklist
window.swAuthChecklist.getResults()

// Auto-Disable
window.swAutoDisable.getReport()
window.swAutoDisable.reset()
```

**Console Warnings to Watch For:**
- `🚨 REGRESSION: Service worker handled API request` - Phase 1 failure
- `⚠️ Service Worker is active and may intercept API request` - Collision detector
- `🚨 AUTO-DISABLE TRIGGERED` - Phase 3 triggered

