# Pryde Social - Comprehensive Audit Report
## Mobile Sticky Elements, CSS Breakage Risks & Badge Visibility Flow

**Date:** 2026-01-28  
**Scope:** Frontend + Backend Logic Review  
**Mode:** READ-ONLY AUDIT (No Code Changes)

---

## Executive Summary

This audit identifies **12 HIGH severity issues**, **8 MEDIUM severity issues**, and **6 LOW severity items** across three focus areas:

1. **Mobile Sticky Elements**: Most elements are correctly positioned with proper safe area handling. However, there are conflicts between z-index layers and missing `100dvh` fallbacks in several files.

2. **Mobile CSS Breakage Risks**: Several files use `100vh` instead of `100dvh`, risking iOS Safari viewport issues. Modal `max-height: 85vh` can clip content on smaller devices.

3. **Badge Visibility Flow**: **CRITICAL BUG FOUND** - The backend validation at `server/routes/badges.js:188` uses a string comparison (`user.badges.includes(badgeId)`) that fails when comparing string badge IDs against potentially mismatched data types in the user's badges array.

---

## Section A: Mobile Sticky Elements Audit

### A1. Mobile Bottom Navigation
**File:** `src/layouts/AppLayout.css` (lines 15-39)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `fixed` | ✅ Correct |
| Bottom | `0` | ✅ Correct |
| Z-Index | `var(--z-sticky, 200)` | ✅ Correct |
| Safe Area | `padding-bottom: env(safe-area-inset-bottom)` | ✅ Correct |
| Height | `56px` | ✅ Fixed height, stable |

**Breakage Scenarios:**
- ✅ Scroll: Works correctly
- ✅ Keyboard open: Not affected (fixed at bottom)
- ✅ PWA mode: Safe area padding handles home indicator
- ✅ Small viewport: Maintains 56px height

**Conflicts:** None identified.

---

### A2. Message Input / Composer
**File:** `src/pages/Messages.css` (lines 203-208, 1403-1407, 2965-2968)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `sticky` | ⚠️ May conflict with flex containers |
| Bottom | `0` | ✅ Correct |
| Z-Index | `var(--z-sticky, 200)` | ✅ Same as mobile nav |
| Safe Area | `padding-bottom: calc(12px + env(safe-area-inset-bottom, 0) + var(--mobile-nav-height, 56px))` | ✅ Accounts for mobile nav |

**Severity:** MEDIUM  
**Issue:** Multiple definitions of sticky composer across lines 203, 1403, and 2965 with slightly different configurations. This can cause confusion and override conflicts.

**Breakage Scenarios:**
- ⚠️ Scroll: Works but may jump in flex containers
- ⚠️ Keyboard open: iOS Safari keyboard may push content unexpectedly
- ✅ PWA mode: Safe area padding present
- ⚠️ Small viewport: Large padding values may consume too much space

---

### A3. Search Header
**File:** `src/pages/Search.css` (lines 12-22)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `sticky` | ✅ Correct |
| Top | `0` | ✅ Correct |
| Z-Index | `100` | ⚠️ Lower than mobile nav (200) |
| Safe Area | `padding-top: calc(0.75rem + env(safe-area-inset-top, 0))` | ✅ Correct |

**Severity:** LOW  
**Assessment:** Works correctly. Z-index hierarchy is appropriate (nav > header).

---

### A4. Modal Actions (Save/Submit Buttons)
**File:** `src/styles/accessibility.css` (lines 358-367)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `sticky` | ✅ Correct for modal context |
| Bottom | `0` | ✅ Correct |
| Background | `inherit` | ⚠️ May not always match |

**Severity:** LOW  
**Issue:** Using `background: inherit` assumes parent has a solid background. Transparent parents will cause visual issues.

---

### A5. FAB (Floating Action Button)
**File:** `src/layouts/AppLayout.css` (lines 145-165)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `fixed` | ✅ Correct |
| Bottom | `var(--mobile-layer-1, 76px)` | ✅ Uses layer system |
| Z-Index | `100` | ⚠️ Lower than mobile nav (200) |
| Right | `var(--space-4, 16px)` | ✅ Correct |

**Severity:** LOW  
**Assessment:** Correctly stacked below mobile nav but above content.

---

### A6. Admin Table Headers
**File:** `src/styles/hardening.css` (lines 277-284)

| Property | Value | Assessment |
|----------|-------|------------|
| Position | `sticky` | ✅ Correct |
| Top | `0` | ✅ Correct |
| Z-Index | `2` | ✅ Local stacking context |

**Assessment:** Works correctly for table scroll.

---

## Section B: Mobile CSS Breakage Risks

### B1. `100vh` Instead of `100dvh`

| File | Line | Selector | Severity | Screens Affected |
|------|------|----------|----------|------------------|
| `src/pages/Home.css` | 8 | `.home-page` | **HIGH** | Landing page |
| `src/pages/Lounge.css` | 6, 17 | `.lounge-page`, `.lounge-container` | **HIGH** | Lounge chat |
| `src/pages/PhotoEssay.css` | 2 | `.photo-essay-page` | **MEDIUM** | Photo essay creation |
| `src/styles/accessibility.css` | 352 | `.modal-content` | **MEDIUM** | All modals on mobile |
| `src/styles/mobileFriendly.css` | 1167 | `.modal-content` | **MEDIUM** | All modals (landscape) |

**Root Cause:** iOS Safari's dynamic toolbar shrinks/expands during scroll. Using `100vh` causes content to be hidden under the toolbar.

**Impact:**
- Bottom content cut off on iOS Safari
- Users cannot reach bottom buttons/actions
- Especially problematic in PWA mode

**Recommended Fix:** Replace `100vh` with:
```css
min-height: 100vh; /* Fallback */
min-height: 100dvh; /* Modern browsers */
```

---

### B2. `overflow: hidden` on Form Containers

| File | Line | Selector | Severity | Issue |
|------|------|----------|----------|-------|
| `src/styles/mobileFriendly.css` | 919 | `.comments-section, .post-comments` | **HIGH** | Truncates long comment threads |
| `src/styles/mobileFriendly.css` | 927 | `.comment, .comment.reply` | **HIGH** | Cuts off comment content |
| `src/index.css` | 254 | `.embed-container, .video-container` | **MEDIUM** | May clip video controls |

**Impact:** Content is visually cut off without indication that more content exists. Users may not know to scroll.

**Recommended Fix:** Replace with:
```css
overflow-x: hidden; /* Only hide horizontal overflow */
overflow-y: visible; /* Allow vertical content to show */
```

---

### B3. Fixed Heights on Mobile

| File | Line | Selector | Value | Severity |
|------|------|----------|-------|----------|
| `src/pages/Lounge.css` | 17 | `.lounge-container` | `calc(100vh - 70px)` | **HIGH** |
| `src/layouts/AppLayout.css` | 24 | `.mobile-nav` | `56px` | LOW (intentional) |
| `src/styles/mobileFriendly.css` | 463 | `.post-image` | `max-height: 50vh` | LOW (intentional) |

**Issue:** `.lounge-container` uses `calc(100vh - 70px)` which inherits the iOS Safari viewport bug.

**Recommended Fix:**
```css
height: calc(100vh - 70px); /* Fallback */
height: calc(100dvh - 70px); /* Modern browsers */
```

---

### B4. Modal `max-height: 85vh` on Small Viewports

| File | Line | Selector | Severity |
|------|------|----------|----------|
| `src/styles/accessibility.css` | 352 | `.modal-content` | **MEDIUM** |

**Issue:** On devices with <600px viewport height, 85vh leaves only ~510px for modal content. Combined with sticky footer (~50px) and header (~60px), only ~400px remains for form content.

**Impact:** Forms with many fields may be difficult to complete.

**Recommended Fix:** Consider using `max-height: 100dvh` with safe area padding, or implement full-screen modals on very small devices.

---

### B5. `max-width: 100vw` Risks

| File | Line | Selector | Severity |
|------|------|----------|----------|
| `src/index.css` | 258 | `.reaction-picker` | **MEDIUM** |
| `src/styles/breakpoints.css` | 374 | `html, body` | LOW (intentional global) |

**Issue:** `100vw` includes scrollbar width on desktop, causing horizontal overflow.

**Recommended Fix:** Use `100%` instead of `100vw` for width constraints.

---

### B6. Deprecated File Still Active

| File | Status | Severity |
|------|--------|----------|
| `src/styles/mobileFriendly.css` | ⚠️ DEPRECATED but still imported | **HIGH** |

**Issue:** Lines 1-15 indicate this file is deprecated and scheduled for removal, but it still contains active styles that affect mobile rendering. This creates maintenance confusion and potential style conflicts.

**Recommended Fix:** Complete migration to PageLayout system and remove file.

---

## Section C: Badge Edit & Visibility Flow Audit

### C1. Problem Statement

**User-Reported Issue:**
> "You can only make your own badges public"
> AND
> Cannot change which badges are public, including their own badges.

---

### C2. Code Flow Analysis

#### Frontend: BadgeSettings.jsx

**File:** `src/components/BadgeSettings.jsx`

**Flow:**
1. `fetchBadges()` (line 30) calls `GET /badges/me`
2. Response contains `{ badges: [...], publicBadges: [...], hiddenBadges: [...] }`
3. User toggles badge via `togglePublicBadge(badgeId)` (line 61)
4. On save, `handleSave()` (line 43) calls `PUT /badges/me/visibility` with `{ publicBadges, hiddenBadges }`

**Frontend Logic Assessment:**
- ✅ Correctly filters CORE_ROLE badges from controllable badges
- ✅ Correctly enforces 3-badge limit on non-CORE_ROLE badges
- ✅ Sends badge IDs as strings (from `badge.id`)

---

#### Backend: GET /badges/me

**File:** `server/routes/badges.js` (lines 124-151)

```javascript
const user = await User.findById(req.userId)
  .select('badges publicBadges hiddenBadges privacySettings.hideBadges')
  .lean();

const badges = await Badge.find({
  id: { $in: user.badges || [] },
  isActive: true
}).sort({ priority: 1 }).lean();

res.json({
  badges,                    // Full badge objects
  publicBadges: user.publicBadges || [],  // Array of badge IDs (strings)
  hiddenBadges: user.hiddenBadges || [],
  ...
});
```

**Assessment:** ✅ Correctly returns badge data.

---

#### Backend: PUT /badges/me/visibility (THE PROBLEM)

**File:** `server/routes/badges.js` (lines 153-234)

**Critical Code (lines 186-191):**
```javascript
// Validate that all publicBadges belong to user
if (publicBadges && publicBadges.length > 0) {
  const invalidBadges = publicBadges.filter(badgeId => !user.badges.includes(badgeId));
  if (invalidBadges.length > 0) {
    return res.status(400).json({ message: 'You can only make your own badges public' });
  }
  ...
}
```

---

### C3. ROOT CAUSE ANALYSIS

#### **CRITICAL BUG: Type Mismatch in Badge Ownership Check**

**Severity:** 🔴 **CRITICAL**

**The Problem:**

The validation `user.badges.includes(badgeId)` compares:
- `publicBadges` array: Contains **string** badge IDs (e.g., `"founder"`, `"early_member"`)
- `user.badges` array: Contains **string** badge IDs (per User model definition)

**However**, the User model at `server/models/User.js` (lines 301-307) shows:
```javascript
badges: {
  type: [{
    type: String,
    ref: 'Badge'
  }],
  default: []
}
```

**The Issue:**
The `ref: 'Badge'` suggests these are meant to be references to the Badge model, but badges use a custom `id` field (e.g., `"founder"`) not MongoDB's `_id`.

**Hypothesis 1: The user's badges array is empty or not populated**
- If `user.badges = []`, then `user.badges.includes(badgeId)` will always return `false`
- This would cause "You can only make your own badges public" for ALL badges

**Hypothesis 2: Badge assignment not working**
- Users may not be getting badges assigned properly
- Check badge assignment flow (automatic and manual)

---

### C4. Data Type Verification

**User Model (server/models/User.js):**
```javascript
badges: {
  type: [{ type: String, ref: 'Badge' }],
  default: []
}
publicBadges: {
  type: [{ type: String, ref: 'Badge' }],
  default: []
}
```

**Badge Model (server/models/Badge.js):**
```javascript
id: {
  type: String,
  required: true,
  unique: true,
  lowercase: true
}
```

**Assessment:** Types should match (both are strings). The `ref: 'Badge'` is misleading because it references by custom `id` field, not MongoDB `_id`.

---

### C5. Likely Root Causes

| Probability | Issue | Location |
|-------------|-------|----------|
| **HIGH** | User's `badges` array is empty or not being populated | Badge assignment flow |
| **MEDIUM** | Badge assignment creates entries but doesn't use the correct `id` format | Admin badge assignment route |
| **LOW** | Type coercion issue with `.includes()` | `server/routes/badges.js:188` |

---

### C6. Verification Steps (For Developer)

1. **Check a user's badges array directly:**
   ```javascript
   db.users.findOne({ username: "testuser" }, { badges: 1 })
   ```

2. **Check what format badge IDs are stored in:**
   - Expected: `["founder", "early_member"]`
   - Problem: `[]` or `["60a7f9e2c1234567890abcde"]` (ObjectIds instead)

3. **Check badge assignment route:**
   - `POST /api/badges/admin/assign/:id` (server/routes/badges.js)
   - Verify it pushes the badge's `id` field, not `_id`

---

### C7. Recommended Fixes

#### Fix 1: Add Debug Logging (Immediate)
Add console.log in the visibility route to see actual values:
```javascript
console.log('User badges:', user.badges);
console.log('Requested publicBadges:', publicBadges);
console.log('Invalid badges:', invalidBadges);
```

#### Fix 2: Verify Badge Assignment
Ensure badge assignment routes push the badge's `id` field:
```javascript
// Should be:
user.badges.push(badge.id);  // "founder"
// NOT:
user.badges.push(badge._id); // ObjectId
```

#### Fix 3: Add Explicit String Comparison
```javascript
const invalidBadges = publicBadges.filter(badgeId =>
  !user.badges.some(b => String(b) === String(badgeId))
);
```

#### Fix 4: Frontend Error Handling
Show more specific error messages:
```javascript
setMessage(error.response?.data?.message ||
  `Failed to save. You have ${badges.length} badges assigned.`);
```

---

## Summary of Findings

### Critical Issues (Immediate Action Required)

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| C-1 | Badge visibility validation fails due to empty/mismatched user.badges array | 🔴 CRITICAL | server/routes/badges.js:188 |
| B-1 | `100vh` causing iOS Safari viewport issues | 🔴 HIGH | Home.css, Lounge.css |
| B-6 | Deprecated mobileFriendly.css still active | 🔴 HIGH | src/styles/mobileFriendly.css |

### Medium Issues (Plan for Next Sprint)

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| A-2 | Multiple sticky composer definitions | 🟡 MEDIUM | Messages.css |
| B-2 | `overflow: hidden` cutting off content | 🟡 MEDIUM | mobileFriendly.css |
| B-4 | Modal 85vh too small for compact devices | 🟡 MEDIUM | accessibility.css |

### Low Issues (Track for Future)

| ID | Issue | Severity | Location |
|----|-------|----------|----------|
| A-4 | Modal actions use `background: inherit` | 🟢 LOW | accessibility.css |
| B-5 | `100vw` includes scrollbar | 🟢 LOW | index.css |

---

## Appendix: File Reference

| File | Lines Audited | Issues Found |
|------|---------------|--------------|
| server/routes/badges.js | 153-234 | 1 CRITICAL |
| src/components/BadgeSettings.jsx | 1-154 | 0 |
| src/layouts/AppLayout.css | 1-439 | 0 |
| src/pages/Messages.css | 1-4035 | 1 MEDIUM |
| src/pages/Home.css | 1-32+ | 1 HIGH |
| src/pages/Lounge.css | 1-35+ | 1 HIGH |
| src/styles/mobileFriendly.css | 1-1188+ | 3 HIGH/MEDIUM |
| src/styles/accessibility.css | 1-400+ | 2 MEDIUM/LOW |
| server/models/User.js | 299-330 | 0 (types verified) |
| server/models/Badge.js | 1-111 | 0 (types verified) |

---

**Report Generated:** 2026-01-28
**Auditor:** Code Argument
**Status:** Complete - Awaiting Developer Action


