# Service Worker Quick Reference

## 🚀 Quick Start

### Dev Mode Testing

```javascript
// Enable interception logging
window.swTest.enableLogging()

// Make API request and check console
fetch('/api/auth/me')
// Expected: ✅ API request correctly bypassed

// Get full report
window.swTest.getReport()

// Test auth with/without SW
window.swAuthChecklist.testAuthWithSW()
window.swAuthChecklist.checkBehaviorIdentical()
```

### Production Debugging

```javascript
// Check if SW is disabled for recovery
window.swAutoDisable.isDisabled()

// Get recovery reason
window.swAutoDisable.getReason()

// Get failure report
window.swAutoDisable.getReport()

// Clear recovery flag (re-enable SW)
window.swAutoDisable.clearRecoveryFlag()
// Then reload
```

## 🔍 What to Look For

### ✅ Good Signs

```
[SW Bypass] ⚠️ Request bypassed: /api/auth/me (API endpoint)
[SW Test] ✅ API request correctly bypassed: /api/users/me (API endpoint)
[SW Auto-Disable] 🛡️ Auto-disable protection initialized
```

### 🚨 Bad Signs (Regressions)

```
🚨 [SW Bypass] REGRESSION: Service worker attempted to handle API request
🚨 [SW Test] REGRESSION: Service worker handled API request
🚨 [SW Auto-Disable] AUTO-DISABLE TRIGGERED
```

## 🛠️ Manual Controls

### Toggle Service Worker

```javascript
// Disable SW
window.swTest.toggleSW(false)

// Enable SW
window.swTest.toggleSW(true)
```

### Force Updates

```javascript
// Force SW update
window.swTest.forceSWUpdate()

// Force cache clear
window.swTest.forceCacheClear()

// Unregister SW
window.swTest.unregisterSW()
```

### Clear Logs

```javascript
// Clear interception log
window.swTest.clearLog()

// Reset failure tracker
window.swAutoDisable.reset()
```

## 📊 Reports

### Interception Report

```javascript
window.swTest.getReport()
// Returns:
// {
//   totalInterceptions: 42,
//   apiInterceptions: 5,
//   apiHandled: 0,      // Should ALWAYS be 0
//   apiBypassed: 5,     // Should equal apiInterceptions
//   interceptions: [...],
//   apiInterceptions: [...]
// }
```

### Failure Report

```javascript
window.swAutoDisable.getReport()
// Returns:
// {
//   failures: [...],
//   autoDisableTriggered: false,
//   threshold: 3,
//   window: 60000
// }
```

### Auth Checklist Results

```javascript
window.swAuthChecklist.getResults()
// Returns:
// {
//   swEnabled: { success: true, user: {...}, timestamp: ... },
//   swDisabled: { success: true, user: {...}, timestamp: ... }
// }
```

## 🔧 Common Tasks

### Test API Bypass

1. Open DevTools Console
2. Enable logging: `window.swTest.enableLogging()`
3. Make API request: `fetch('/api/auth/me')`
4. Check console for bypass confirmation

### Test Auth Stability

1. Open DevTools Console
2. Test with SW: `window.swAuthChecklist.testAuthWithSW()`
3. Disable SW: `window.swTest.toggleSW(false)`
4. Test without SW: `window.swAuthChecklist.testAuthWithoutSW()`
5. Check identical: `window.swAuthChecklist.checkBehaviorIdentical()`

### Recover from Auto-Disable

1. Check if disabled: `window.swAutoDisable.isDisabled()`
2. Get reason: `window.swAutoDisable.getReason()`
3. Clear flag: `window.swAutoDisable.clearRecoveryFlag()`
4. Reload page

### Debug SW Issues

1. Get interception report: `window.swTest.getReport()`
2. Check for API handling: Look for `apiHandled > 0`
3. Get failure report: `window.swAutoDisable.getReport()`
4. Clear caches: `window.swTest.forceCacheClear()`
5. Force update: `window.swTest.forceSWUpdate()`

## 🎯 Expected Behavior

### API Requests

- **ALWAYS** bypassed by service worker
- **NEVER** cached
- **ALWAYS** go to network
- **NEVER** cause CORS errors

### Static Assets

- **ALWAYS** handled by service worker
- **CACHED** with appropriate TTL
- **SAME-ORIGIN** only
- **IMMUTABLE** assets only

### Auth Failures

- **MONITORED** automatically
- **TRACKED** in failure report
- **AUTO-DISABLE** after 3 failures in 1 minute
- **BANNER** shown on recovery

## 🚨 Troubleshooting

### SW Intercepting API Requests

**Symptom:** `🚨 REGRESSION: Service worker handled API request`

**Fix:**
1. Check `vite.config.js` - ensure `importScripts: ['sw-bypass-api.js']`
2. Check `public/sw-bypass-api.js` - ensure bypass logic is correct
3. Force SW update: `window.swTest.forceSWUpdate()`
4. Clear caches: `window.swTest.forceCacheClear()`

### Auth Loops

**Symptom:** Repeated auth failures, auto-disable triggered

**Fix:**
1. Check failure report: `window.swAutoDisable.getReport()`
2. Verify SW is disabled: `window.swAutoDisable.isDisabled()`
3. Check recovery reason: `window.swAutoDisable.getReason()`
4. If false positive, clear flag: `window.swAutoDisable.clearRecoveryFlag()`

### CORS Errors

**Symptom:** CORS errors on API requests

**Fix:**
1. Verify API requests are bypassed: `window.swTest.getReport()`
2. Check `apiHandled` should be 0
3. If not, force SW update: `window.swTest.forceSWUpdate()`
4. Clear caches: `window.swTest.forceCacheClear()`

### Stale Caches

**Symptom:** Old content showing after deploy

**Fix:**
1. Force cache clear: `window.swTest.forceCacheClear()`
2. Force SW update: `window.swTest.forceSWUpdate()`
3. Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## 📝 Notes

- All test hooks are **DEV-ONLY** (except auto-disable utilities)
- Auto-disable protection is **ALWAYS ACTIVE** in production
- Interception logging is **DEV-ONLY**
- Recovery banner is **PRODUCTION-ONLY**

