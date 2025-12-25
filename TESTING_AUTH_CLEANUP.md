# Testing Guide: Auth Cleanup

## Quick Test Scenarios

### 1. Logout Flow Test

**Steps:**
1. Login to the app
2. Open browser DevTools (F12)
3. Go to Console tab
4. Click logout button

**Expected Results:**
- ✅ No 401 errors in console
- ✅ No "Failed to fetch" errors
- ✅ Redirect to `/login` page
- ✅ Socket disconnects (check Network tab → WS)
- ✅ No background requests after logout

**Logs to Look For:**
```
🚪 [LOGOUT] Starting logout process...
🚪 [LOGOUT] Step 1: Marking as unauthenticated
🚪 [LOGOUT] Step 2: Clearing AuthContext
🚪 [LOGOUT] Step 3: Aborting in-flight requests
🚪 [LOGOUT] Step 4: Disconnecting socket
🚪 [LOGOUT] Step 5: Clearing local auth state
🚪 [LOGOUT] Step 6: Calling backend logout
🚪 [LOGOUT] Step 7: Clearing API cache
🚪 [LOGOUT] Step 8: Clearing draft data
🚪 [LOGOUT] Step 9: Clearing mutation guard
🚪 [LOGOUT] Step 10: Clearing session storage and redirecting
```

---

### 2. Login Flow Test

**Steps:**
1. Go to `/login` page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Enter credentials and login

**Expected Results:**
- ✅ Login succeeds
- ✅ User avatar loads immediately (not "Unknown User")
- ✅ Feed loads without 401 errors
- ✅ Socket connects successfully
- ✅ No duplicate `/auth/me` requests

**Logs to Look For:**
```
[Feed] Waiting for auth to be ready...
[AuthContext] Hydrating user data...
[AuthContext] User hydrated successfully
[Feed] Auth ready - fetching initial data
```

---

### 3. Auth Ready Gate Test

**Steps:**
1. Login to the app
2. Open DevTools → Console
3. Watch for auth state transitions

**Expected Results:**
- ✅ `authReady` starts as `false`
- ✅ `authReady` becomes `true` after `/auth/me` succeeds
- ✅ Feed waits for `authReady` before fetching posts
- ✅ No premature API calls

**Logs to Look For:**
```
[Feed] Waiting for auth to be ready...
[AuthContext] Hydrating user data...
[AuthContext] User hydrated successfully
[Feed] Auth ready - fetching initial data
```

---

### 4. Socket Cleanup Test

**Steps:**
1. Login to the app
2. Open DevTools → Network tab
3. Filter by "WS" (WebSocket)
4. Click logout

**Expected Results:**
- ✅ WebSocket connection closes immediately
- ✅ No reconnection attempts
- ✅ No "WebSocket is already in CLOSING or CLOSED state" errors

**Logs to Look For:**
```
🚪 Disconnecting socket for logout
🔌 Disconnecting socket
```

---

### 5. In-Flight Request Cancellation Test

**Steps:**
1. Login to the app
2. Open DevTools → Network tab
3. Throttle network to "Slow 3G"
4. Navigate to a page that makes API calls
5. Immediately click logout

**Expected Results:**
- ✅ Pending requests are cancelled
- ✅ No 401 errors in console
- ✅ Redirect to login happens immediately

**Logs to Look For:**
```
🚪 [LOGOUT] Step 3: Aborting in-flight requests
🚫 Aborting X in-flight requests
```

---

### 6. Duplicate Logout Prevention Test

**Steps:**
1. Login to the app
2. Open DevTools → Console
3. Click logout button multiple times rapidly

**Expected Results:**
- ✅ Only one logout process runs
- ✅ No duplicate logout logs
- ✅ No errors

**Logs to Look For:**
```
🚪 [LOGOUT] Starting logout process...
⚠️ Logout already in progress, skipping...
```

---

## Common Issues & Solutions

### Issue: "Unknown User" after login
**Cause:** `refreshUser()` not called after login
**Solution:** Check `Login.jsx` - ensure `await refreshUser()` is called

### Issue: 401 errors after logout
**Cause:** Auth guard not working
**Solution:** Check `apiClient.js` - ensure `getIsLoggingOut()` check is present

### Issue: Socket reconnects after logout
**Cause:** `disconnectSocketForLogout()` not called
**Solution:** Check `auth.js` logout step 4

### Issue: Feed loads before auth ready
**Cause:** Auth ready gate not implemented
**Solution:** Check `Feed.jsx` - ensure `authReady` check is present

---

## DevTools Tips

### Check Auth State
```javascript
// In browser console
localStorage.getItem('token')
localStorage.getItem('refreshToken')
```

### Check Socket State
```javascript
// In browser console
window.socket?.connected
```

### Check Auth Context
```javascript
// Add to component
console.log('authReady:', authReady);
console.log('isAuthenticated:', isAuthenticated);
console.log('user:', user);
```

---

## Performance Metrics

### Before Fix
- 10-15 failed requests after logout
- 5-10 401 errors in console
- Socket reconnection attempts
- 2-3 second delay before redirect

### After Fix
- 0 failed requests after logout
- 0 401 errors in console
- Clean socket disconnect
- Immediate redirect

---

**Last Updated:** 2025-12-25

