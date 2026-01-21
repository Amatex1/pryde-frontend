# Authentication Refresh Single-Flight Regression Note

## Summary

This note documents a previously identified race condition in Pryde’s authentication refresh flow that caused **premature session expiration (5–10 minute logouts)** despite valid refresh tokens.

The issue is now resolved. This document exists to ensure it **never re-appears**.

---

## Root Cause (Historical)

Pryde uses short-lived access tokens and rotating refresh tokens stored in httpOnly cookies.

Although refresh token rotation and hashing were correctly implemented on the backend, **multiple independent frontend refresh triggers were allowed to fire concurrently**.

Specifically:

- `api.js` (Axios interceptor) had refresh single-flight protection
- `apiClient.js` (fetch wrapper) had refresh single-flight protection
- ❌ `authLifecycle.js` triggered refresh independently with **no coordination**

This allowed multiple `/auth/refresh` requests to race.

Because refresh tokens rotate on success:
- The first refresh succeeded and rotated the token
- The second refresh used an already-invalidated token
- Backend correctly rejected the request
- Frontend interpreted the rejection as “session expired”
- User was logged out unexpectedly

This was **not a backend bug** — it was a frontend coordination issue.

---

## Correct Architecture (Canonical Rule)

> **There must only ever be ONE refresh request in flight at any time.**

All refresh triggers (401 responses, focus events, visibility changes, intervals, reconnects) MUST funnel through a **single shared refresh promise**.

No component may call the refresh endpoint directly.

---

## Guardrails (Non-Negotiable Rules)

### 1. Single-Flight Enforcement
- Refresh logic must be centralized
- A shared `refreshPromise` (or equivalent) must be used
- If a refresh is already in progress:
  - New triggers must await or no-op
  - They must NOT start a new request

### 2. Refresh Authority
- Only one module is allowed to:
  - Call `/auth/refresh`
  - Decide whether refresh failure causes logout
- Lifecycle helpers must never log out users directly

### 3. Token Rotation Assumption
- Refresh tokens rotate on every successful refresh
- Any concurrent refresh attempt WILL fail by design
- Frontend must therefore prevent concurrency

### 4. Storage Rules (Context)
- Refresh tokens exist ONLY in httpOnly cookies
- Access tokens are in memory only
- No JavaScript-accessible refresh tokens exist

---

## Files of Interest (Do Not Bypass)

If modifying auth behavior, review these together:

- `src/utils/api.js`
- `src/utils/apiClient.js`
- `src/utils/authLifecycle.js`
- `src/context/AuthContext.jsx`

Any new refresh trigger MUST integrate with the shared refresh mechanism.

---

## Regression Test Checklist

Before merging any auth-related change, verify:

- [ ] Only one refresh request can occur at a time
- [ ] Multi-tab usage does not cause logout
- [ ] Focus / visibility changes do not trigger parallel refreshes
- [ ] Access token expiry is recoverable via refresh
- [ ] Logout only occurs on:
  - User action
  - Refresh token expiry
  - Session revocation
  - Account ban/deletion

---

## Why This Matters

This issue was subtle, intermittent, and easy to misdiagnose.

Documenting it ensures:
- Stable long-lived sessions
- Predictable multi-tab behavior
- Safe refresh token rotation
- No future “random logout” regressions

If this rule is broken again, **the bug will return**.

---

Last updated: YYYY-MM-DD  
Owner: Auth / Security  
Status: FIXED
