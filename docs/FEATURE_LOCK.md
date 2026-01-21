# Feature Lock — Pryde Platform

> **This document records features that have been intentionally removed or never built.**
> 
> These features will NOT be reintroduced without a platform-wide policy change.

---

## 🔒 Locked Features

The following features are permanently locked. They conflict with Pryde's core values of calm, privacy, and user wellbeing.

### Content Discovery

| Feature | Status | Reason |
|---------|--------|--------|
| Algorithmic feed ranking | ❌ Locked | Manipulates user attention; conflicts with chronological-first principle |
| Trending topics | ❌ Locked | Creates artificial urgency and FOMO |
| Explore page with viral content | ❌ Locked | Promotes engagement-bait over genuine connection |
| Public hashtags with virality | ❌ Locked | Tags redirect to Groups instead; no viral amplification |

### Social Metrics

| Feature | Status | Reason |
|---------|--------|--------|
| Public follower counts | ❌ Locked | Creates social hierarchy and comparison anxiety |
| Public like counts | ❌ Locked | Pressures users to perform for engagement |
| View counts | ❌ Locked | Creates anxiety about reach and visibility |
| Share/repost counts | ❌ Locked | Amplifies content beyond intended audience |

### Content Amplification

| Feature | Status | Reason |
|---------|--------|--------|
| Reposts / Retweets | ❌ Locked | Forces content out of original context; enables dogpiling |
| Quote posts | ❌ Locked | Often used for harassment and dunking |
| Cross-posting to external platforms | ❌ Locked | Content should stay in its intended community |

### Notifications & Engagement

| Feature | Status | Reason |
|---------|--------|--------|
| Push notifications for likes | ❌ Locked | Creates dopamine loops; Quiet Mode philosophy |
| "X just posted" notifications | ❌ Locked | Creates urgency and FOMO |
| Email digests of missed content | ❌ Locked | Pressures users to return constantly |

---

## 📋 Removed Features Log

These features existed at some point and were deliberately removed:

| Feature | Removed Date | Reason |
|---------|--------------|--------|
| Tags/hashtags (viral) | 2025-12 | Replaced with Groups-only discovery |
| Creator Mode | 2025-12 | Created performance anxiety; all users equal |
| Post visibility metrics | 2025-12 | Removed public engagement pressure |
| Trending section | 2025-12 | Artificial urgency conflicts with calm-first |

---

## 🛡️ Policy Statement

> **These features will not be reintroduced without a platform-wide policy change.**
> 
> If any of these features are ever reconsidered, it requires:
> 1. Public announcement to the community
> 2. Clear justification for why the change is necessary
> 3. User consent mechanisms (opt-in, not opt-out)
> 4. Preservation of calm-first, privacy-respecting defaults

---

## 🔗 Related Files

- `src/config/platformFlags.js` — Code-level constants that enforce these locks
- `src/pages/PlatformGuarantees.jsx` — User-facing guarantees page
- `/guarantees` — Public URL for platform guarantees

---

## ✅ How to Use Platform Flags

For developers: Before building a new feature, check `platformFlags.js`:

```javascript
import { isFeatureLocked, NO_ALGORITHMIC_FEED } from '../config/platformFlags';

// Check if a feature is locked
if (NO_ALGORITHMIC_FEED) {
  // Feed must be chronological
}

// Or use the helper
if (isFeatureLocked('NO_TRENDING')) {
  // Don't show trending topics
}
```

These flags serve as guardrails. If you find yourself wanting to set one to `false`, you're probably building something that doesn't belong on Pryde.

---

*Last updated: 2025-12-27*

