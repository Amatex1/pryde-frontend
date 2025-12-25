# Service Worker Deployment Checklist

## Pre-Deployment Testing

### ✅ Phase 1: Bypass Logic Testing

- [ ] **Dev Mode Testing**
  - [ ] Run `npm run dev`
  - [ ] Open DevTools Console
  - [ ] Enable logging: `window.swTest.enableLogging()`
  - [ ] Make API request: `fetch('/api/auth/me')`
  - [ ] Verify console shows: `✅ API request correctly bypassed`
  - [ ] Get report: `window.swTest.getReport()`
  - [ ] Verify `apiHandled === 0`
  - [ ] Verify `apiBypassed > 0`

- [ ] **Build Testing**
  - [ ] Run `npm run build`
  - [ ] Serve build: `npx serve dist`
  - [ ] Open DevTools Network tab
  - [ ] Make API request
  - [ ] Verify shows `(from network)` not `(from ServiceWorker)`
  - [ ] Make static asset request
  - [ ] Verify shows `(from ServiceWorker)` after first load

### ✅ Phase 2: Testing Infrastructure

- [ ] **Test Hooks Verification**
  - [ ] Verify `window.swTest` exists in dev mode
  - [ ] Test toggle: `window.swTest.toggleSW(false)`
  - [ ] Verify SW unregistered
  - [ ] Test toggle: `window.swTest.toggleSW(true)`
  - [ ] Verify page reloads
  - [ ] Test force update: `window.swTest.forceSWUpdate()`
  - [ ] Test cache clear: `window.swTest.forceCacheClear()`

- [ ] **Auth Checklist Verification**
  - [ ] Verify `window.swAuthChecklist` exists in dev mode
  - [ ] Test with SW: `window.swAuthChecklist.testAuthWithSW()`
  - [ ] Verify auth succeeds
  - [ ] Disable SW: `window.swTest.toggleSW(false)`
  - [ ] Test without SW: `window.swAuthChecklist.testAuthWithoutSW()`
  - [ ] Verify auth succeeds
  - [ ] Check identical: `window.swAuthChecklist.checkBehaviorIdentical()`
  - [ ] Verify returns `true`

### ✅ Phase 3: Auto-Disable Testing

- [ ] **Failure Tracking**
  - [ ] Verify `window.swAutoDisable` exists
  - [ ] Get initial report: `window.swAutoDisable.getReport()`
  - [ ] Verify `failures.length === 0`
  - [ ] Verify `autoDisableTriggered === false`

- [ ] **Auto-Disable Trigger** (Optional - destructive test)
  - [ ] Simulate 3 auth failures (modify backend or use mock)
  - [ ] Verify console shows: `🚨 AUTO-DISABLE TRIGGERED`
  - [ ] Verify banner appears
  - [ ] Verify page reloads
  - [ ] Verify `window.swAutoDisable.isDisabled() === true`
  - [ ] Get reason: `window.swAutoDisable.getReason()`
  - [ ] Clear flag: `window.swAutoDisable.clearRecoveryFlag()`
  - [ ] Reload page

## Deployment Steps

### 1. Pre-Deployment

- [ ] All tests passing
- [ ] No console errors in dev mode
- [ ] No console errors in build mode
- [ ] API requests bypass SW correctly
- [ ] Static assets cache correctly
- [ ] Auth works with and without SW

### 2. Build

- [ ] Run `npm run build`
- [ ] Verify build succeeds
- [ ] Check build output for warnings
- [ ] Verify `dist/sw.js` exists
- [ ] Verify `dist/sw-bypass-api.js` exists

### 3. Deploy

- [ ] Deploy to staging first
- [ ] Test on staging:
  - [ ] API requests work
  - [ ] Auth works
  - [ ] No CORS errors
  - [ ] No ERR_FAILED loops
  - [ ] Static assets cache
  - [ ] SW registers correctly

- [ ] Deploy to production
- [ ] Monitor for:
  - [ ] CORS errors
  - [ ] Auth failures
  - [ ] Auto-disable triggers
  - [ ] Console warnings

### 4. Post-Deployment Monitoring

- [ ] **First 24 Hours**
  - [ ] Monitor error logs for CORS errors
  - [ ] Monitor error logs for auth failures
  - [ ] Check for auto-disable triggers
  - [ ] Check for regression warnings
  - [ ] Verify API requests bypass SW
  - [ ] Verify static assets cache

- [ ] **First Week**
  - [ ] Monitor auto-disable triggers
  - [ ] Check recovery reasons
  - [ ] Verify no infinite loops
  - [ ] Verify mobile/desktop alignment
  - [ ] Check user reports

## Rollback Plan

### If Issues Detected

1. **Immediate Actions**
   - [ ] Check console for errors
   - [ ] Get interception report: `window.swTest.getReport()`
   - [ ] Get failure report: `window.swAutoDisable.getReport()`
   - [ ] Check if auto-disable triggered

2. **Quick Fixes**
   - [ ] Force cache clear: `window.swTest.forceCacheClear()`
   - [ ] Force SW update: `window.swTest.forceSWUpdate()`
   - [ ] Clear recovery flag: `window.swAutoDisable.clearRecoveryFlag()`

3. **Rollback** (if quick fixes don't work)
   - [ ] Revert to previous version
   - [ ] Deploy rollback
   - [ ] Clear all caches
   - [ ] Unregister all SWs
   - [ ] Notify users

## Success Criteria

### ✅ All Must Pass

- [ ] API requests NEVER cached
- [ ] API requests NEVER intercepted by SW
- [ ] Auth works identically with/without SW
- [ ] No CORS errors
- [ ] No ERR_FAILED loops
- [ ] No infinite auth loops
- [ ] Static assets cache correctly
- [ ] Mobile/desktop behavior identical
- [ ] Auto-disable protection active
- [ ] Recovery banner works
- [ ] Test hooks work in dev mode

## Documentation

### ✅ Team Handoff

- [ ] Share `SW_COMPREHENSIVE_FIX.md` with team
- [ ] Share `SW_QUICK_REFERENCE.md` with team
- [ ] Add to onboarding docs
- [ ] Add to deployment checklist
- [ ] Add to troubleshooting guide
- [ ] Train team on test hooks
- [ ] Train team on auto-disable

## Emergency Contacts

**If critical issues arise:**

1. Check documentation:
   - `SW_COMPREHENSIVE_FIX.md`
   - `SW_QUICK_REFERENCE.md`
   - `SW_IMPLEMENTATION_SUMMARY.md`

2. Use test hooks:
   - `window.swTest.*`
   - `window.swAutoDisable.*`

3. Check console warnings:
   - `🚨 REGRESSION`
   - `🚨 AUTO-DISABLE TRIGGERED`

4. Rollback if needed

## Notes

- Auto-disable is a **safety net**, not a band-aid
- Phase 1 should prevent all issues
- Phase 3 only triggers if Phase 1 fails
- Monitor auto-disable triggers closely
- Investigate any auto-disable triggers
- Clear recovery flag after investigation

---

**Deployment Status:** Ready for deployment after checklist completion ✅

