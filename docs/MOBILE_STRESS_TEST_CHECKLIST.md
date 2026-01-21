# Mobile Stress Test Checklist - MANDATORY Before Release

## 🎯 Purpose

This checklist ensures the PWA and mobile browsers behave predictably under real-world stress conditions. **ALL tests must pass before marking a build as stable.**

---

## ⚠️ BLOCKING CRITERIA

If **ANY** test causes:
- ❌ Auth loop (stuck in login/logout cycle)
- ❌ Broken UI (missing elements, layout issues)
- ❌ Missing avatar or "Unknown User"
- ❌ Infinite loading spinner
- ❌ Console errors (except expected network failures)
- ❌ Stale data after refresh

→ **BLOCK RELEASE** until fixed

---

## 📋 Test Scenarios

### 1. Cold Boot Tests

#### ☐ Test 1.1: Cold boot with no cache
**Steps:**
1. Clear all browser data (cache, storage, cookies)
2. Close all tabs
3. Open app in new tab
4. Verify auth loading screen appears
5. Verify smooth transition to logged-out state

**Expected:**
- ✅ AuthLoadingScreen shows briefly
- ✅ Redirects to login page
- ✅ No console errors
- ✅ No infinite loading

#### ☐ Test 1.2: Cold boot with valid token
**Steps:**
1. Login to app
2. Close all tabs
3. Wait 5 minutes
4. Open app in new tab

**Expected:**
- ✅ AuthLoadingScreen shows briefly
- ✅ Calls /auth/me ONCE
- ✅ Loads user data correctly
- ✅ Shows avatar and username
- ✅ Redirects to feed

#### ☐ Test 1.3: Cold boot with expired token
**Steps:**
1. Login to app
2. Close all tabs
3. Wait 20 minutes (token expires at 15 min)
4. Open app in new tab

**Expected:**
- ✅ AuthLoadingScreen shows briefly
- ✅ Attempts token refresh
- ✅ Either refreshes successfully OR logs out cleanly
- ✅ No auth loop
- ✅ No infinite loading

---

### 2. App Lifecycle Tests

#### ☐ Test 2.1: Kill app mid-request, reopen
**Steps:**
1. Login to app
2. Navigate to feed
3. While feed is loading, force-close browser/tab
4. Immediately reopen app

**Expected:**
- ✅ App restarts cleanly
- ✅ Auth verification completes
- ✅ No duplicate requests
- ✅ No stale loading states

#### ☐ Test 2.2: Background app for 30+ seconds
**Steps:**
1. Login to app
2. Navigate to feed
3. Switch to another app for 30+ seconds
4. Return to app

**Expected:**
- ✅ App resumes correctly
- ✅ Data refreshes if needed
- ✅ No auth loop
- ✅ Socket reconnects if needed

#### ☐ Test 2.3: Lock phone, unlock, resume app
**Steps:**
1. Login to app on mobile
2. Lock phone screen
3. Wait 10 seconds
4. Unlock phone

**Expected:**
- ✅ App resumes immediately
- ✅ No re-authentication required
- ✅ UI state preserved
- ✅ No layout shifts

---

### 3. Network Stress Tests

#### ☐ Test 3.1: Toggle airplane mode during auth
**Steps:**
1. Logout
2. Start login process
3. Enable airplane mode while /auth/me is loading
4. Wait 5 seconds
5. Disable airplane mode

**Expected:**
- ✅ Shows network error gracefully
- ✅ Allows retry
- ✅ No infinite loading
- ✅ No auth loop

#### ☐ Test 3.2: Switch Wi-Fi ↔ mobile data
**Steps:**
1. Login on Wi-Fi
2. Navigate to feed
3. Switch to mobile data
4. Refresh page

**Expected:**
- ✅ App works on new network
- ✅ Auth persists
- ✅ Data loads correctly
- ✅ No duplicate requests

#### ☐ Test 3.3: Slow 3G simulation
**Steps:**
1. Enable Chrome DevTools Network Throttling (Slow 3G)
2. Login to app
3. Navigate between pages

**Expected:**
- ✅ Loading states show correctly
- ✅ No timeout errors
- ✅ Graceful degradation
- ✅ No layout shifts

---

### 4. PWA-Specific Tests

#### ☐ Test 4.1: Refresh PWA while logged in
**Steps:**
1. Install PWA (Add to Home Screen)
2. Login
3. Pull down to refresh (or Cmd+R)

**Expected:**
- ✅ Page refreshes
- ✅ Auth persists
- ✅ No re-login required
- ✅ User data loads correctly

#### ☐ Test 4.2: Refresh PWA while logged out
**Steps:**
1. Install PWA
2. Ensure logged out
3. Pull down to refresh

**Expected:**
- ✅ Page refreshes
- ✅ Stays on login page
- ✅ No auth loop
- ✅ No console errors

#### ☐ Test 4.3: Service worker update
**Steps:**
1. Deploy new version
2. Open old PWA version
3. Wait for service worker update
4. Refresh page

**Expected:**
- ✅ New version loads
- ✅ Old caches cleared
- ✅ Auth persists
- ✅ No stale JS/CSS

---

### 5. Rotation & Viewport Tests

#### ☐ Test 5.1: Rotate screen during auth loading
**Steps:**
1. Logout
2. Start login process
3. Rotate device while loading
4. Complete login

**Expected:**
- ✅ Layout adapts correctly
- ✅ No broken UI
- ✅ Auth completes successfully
- ✅ No duplicate requests

#### ☐ Test 5.2: Keyboard appearance
**Steps:**
1. Open app on mobile
2. Focus on text input (e.g., post composer)
3. Keyboard appears

**Expected:**
- ✅ Layout adjusts for keyboard
- ✅ Input remains visible
- ✅ No content cut off
- ✅ Smooth transition

---

### 6. Auth Flow Stress Tests

#### ☐ Test 6.1: Logout → Login → Refresh → Repeat
**Steps:**
1. Login
2. Logout
3. Login again
4. Refresh page
5. Repeat 3 times

**Expected:**
- ✅ No auth loop
- ✅ Each login works correctly
- ✅ No stale user data
- ✅ No console errors

#### ☐ Test 6.2: Multiple tabs sync
**Steps:**
1. Open app in Tab A
2. Login in Tab A
3. Open app in Tab B
4. Verify Tab B shows logged-in state
5. Logout in Tab A
6. Verify Tab B logs out

**Expected:**
- ✅ Cross-tab sync works
- ✅ Both tabs stay in sync
- ✅ No auth desync
- ✅ No duplicate requests

---

## 🎯 Success Criteria

**ALL tests must pass with:**
- ✅ No auth loops
- ✅ No broken UI
- ✅ No missing avatars
- ✅ No infinite loading
- ✅ No console errors (except expected network failures)
- ✅ Predictable behavior across all scenarios

---

## 📝 Test Log Template

```
Date: ___________
Tester: ___________
Build Version: ___________

Test Results:
[ ] 1.1 Cold boot with no cache
[ ] 1.2 Cold boot with valid token
[ ] 1.3 Cold boot with expired token
[ ] 2.1 Kill app mid-request
[ ] 2.2 Background app 30+ seconds
[ ] 2.3 Lock/unlock phone
[ ] 3.1 Airplane mode during auth
[ ] 3.2 Switch Wi-Fi ↔ mobile data
[ ] 3.3 Slow 3G simulation
[ ] 4.1 Refresh PWA while logged in
[ ] 4.2 Refresh PWA while logged out
[ ] 4.3 Service worker update
[ ] 5.1 Rotate during auth loading
[ ] 5.2 Keyboard appearance
[ ] 6.1 Logout → Login → Refresh loop
[ ] 6.2 Multiple tabs sync

Blocking Issues Found:
_______________________________
_______________________________

Release Approved: [ ] YES  [ ] NO
```

---

**Last Updated:** 2025-12-25  
**Status:** Mandatory for all releases

