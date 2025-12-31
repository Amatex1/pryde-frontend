# 🔒 FEED FREEZE - Pryde Social

**Status:** FROZEN as of 2025-12-31  
**Authority:** Pre-Launch Polish Pass

---

## Purpose

This document locks the feed's visual and layout styles. No CSS changes to feed components are permitted without explicit unfreeze authorization.

---

## 🔒 LOCKED SPACING TOKENS

The following spacing values are FROZEN:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Minimal gaps |
| `--space-2` | 8px | Small gaps |
| `--space-3` | 12px | Header/content margins |
| `--space-4` | 16px | Card padding |
| `--space-5` | 24px | Between posts |

---

## 🔒 LOCKED POST LAYOUT

### Post Card Structure
```
.post-card
├── PostHeader (grid: avatar | text | actions)
│   ├── Avatar (40px desktop, 36px mobile)
│   ├── Text Stack (name + meta)
│   └── Kebab Actions (32px)
├── .post-content (body text)
└── .post-actions (reaction bar)
```

### Locked Values
- Card padding: `var(--space-4)` (16px)
- Card radius: `var(--radius-lg)` (16px)
- Card gap: `var(--space-5)` (24px between posts)
- Card shadow: `0 1px 2px rgba(0,0,0,0.06)`

---

## 🔒 LOCKED HEADER → CONTENT → REACTIONS ORDER

1. **PostHeader** (z-index: 2)
2. **Post Content** (z-index: 1, margin-top: 12px)
3. **Reactions/Actions** (border-top separator)

This order is NON-NEGOTIABLE.

---

## 🔒 LOCKED TYPOGRAPHY HIERARCHY

| Element | Weight | Size | Opacity |
|---------|--------|------|---------|
| Author name | 600 | 0.9375rem | 1.0 |
| Body text | 400 | 1rem | 1.0 |
| Metadata | 400 | 0.85em | 0.65 |
| Buttons | 500 | 14px | 0.75 (restore on hover) |

---

## 🔒 MOBILE ADJUSTMENTS (also frozen)

| Property | Mobile (≤480px) | Desktop |
|----------|-----------------|---------|
| Post gap | 16px | 24px |
| Card padding | 12px | 16px |
| Card radius | 12px | 16px |

---

## ❌ PROHIBITED CHANGES

Without explicit unfreeze:

1. **NO** changes to `.posts-list` gap
2. **NO** changes to `.post-card` padding, radius, or shadow
3. **NO** changes to PostHeader grid structure
4. **NO** changes to content/reactions spacing
5. **NO** changes to typography weights or sizes
6. **NO** new animations on feed components

---

## ✅ UNFREEZE PROCESS

To unfreeze feed styles:

1. Create issue titled "Feed Unfreeze: [reason]"
2. Document specific change required
3. Get explicit approval
4. Make change with minimal scope
5. Re-freeze immediately after

---

## Files Under Freeze

- `src/pages/Feed.css`
- `src/components/PostHeader.css`
- `src/styles/design-system.css` (spacing tokens only)

---

**Remember:** The feed is the heart of Pryde Social. Stability over novelty.

