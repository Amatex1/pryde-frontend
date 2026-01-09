# Calm Mode Validation Checklist

**Date:** 2026-01-09  
**Status:** Ready for Testing

## PHASE F: Validation

Compare profile, feed, and mobile feed to ensure they feel:
- ✅ Calm
- ✅ Structured
- ✅ Predictable
- ✅ Easy to scan

**Nothing should shout. Nothing should feel decorative. The content must be the star.**

---

## Testing Checklist

### 1. Build & Run

```bash
cd pryde-frontend
npm run build
npm run dev
```

Open browser to `http://localhost:5173`

---

### 2. Profile Page Testing

**URL:** `/profile/[username]`

#### Visual Checks:
- [ ] Cover photo is clean, no decorative overlay
- [ ] Avatar overlaps cover by exactly half (60px)
- [ ] Display name is prominent but calm (no text-shadow)
- [ ] Username is muted, secondary
- [ ] **Tier 1 badges** appear inline with name (if user has them)
- [ ] **Tier 2 badges** appear in muted row below name
- [ ] **Tier 3 badges** hidden, accessible via "View X more badges" button
- [ ] Pronouns/age pills are flat, no gradients
- [ ] Bio is readable, centered, max-width 600px
- [ ] Stats (Posts, Followers, Following) are balanced, horizontal
- [ ] No floating elements
- [ ] No overlapping visuals
- [ ] Everything snaps to vertical grid

#### Spacing Checks:
- [ ] Consistent 16px (1rem) gap between sections
- [ ] Stats have 16px padding-top with border separator
- [ ] No random gaps or tight clusters

#### Color Checks:
- [ ] No gradients on badges
- [ ] No glows on any elements
- [ ] Subtle shadow only on avatar
- [ ] Muted colors for secondary info

---

### 3. Feed Page Testing

**URL:** `/feed`

#### Visual Checks:
- [ ] Post cards have ONE background (var(--bg-card))
- [ ] Post cards have ONE border (1px solid)
- [ ] Post cards have ONE radius (12px)
- [ ] No gradients anywhere
- [ ] No glows on hover
- [ ] No decorative shadows
- [ ] **Tier 1 badges only** shown in post headers
- [ ] Tier 2 & 3 badges hidden in feed

#### Spacing Checks:
- [ ] 24px (1.5rem) between posts
- [ ] 16px (1rem) padding inside posts
- [ ] Consistent spacing: author → content → actions

#### Interaction Checks:
- [ ] Reaction buttons: icons only, no glow
- [ ] Comment counts: muted text
- [ ] Timestamps: quiet, secondary
- [ ] Privacy icons: subtle

#### Content Hierarchy:
- [ ] Post content is the loudest element
- [ ] Author name is secondary
- [ ] Meta info (time, privacy) is tertiary
- [ ] Actions are quiet until hovered

---

### 4. Mobile Testing

**URL:** Any page on mobile (< 768px width)

#### Layout Checks:
- [ ] Single column layout (no sidebars)
- [ ] Post cards full width
- [ ] No horizontal scroll
- [ ] Vertical stacking for all elements

#### Profile Mobile:
- [ ] Avatar: 100px × 100px
- [ ] Display name: 1.5rem
- [ ] Stats: 1.5rem gap
- [ ] All badges stack vertically
- [ ] Tier 2 & 3 badges hidden behind "Details"

#### Touch Targets:
- [ ] All buttons minimum 44px height
- [ ] Increased spacing between icons
- [ ] No tiny click targets

#### Visual Restraint:
- [ ] Reduced saturation (~15% less)
- [ ] No gradients
- [ ] Flat surfaces only
- [ ] Calm color palette

---

### 5. Navigation Testing

**URL:** All pages

#### Navbar Checks:
- [ ] Background: var(--bg-card)
- [ ] Border: 1px solid var(--border-light)
- [ ] No gradients
- [ ] No glow
- [ ] No backdrop-filter blur

#### Brand Color Usage (ONLY):
- [ ] Active tab/link: var(--pryde-purple)
- [ ] Primary CTA buttons: var(--pryde-purple)
- [ ] New message badge: var(--pryde-purple)
- [ ] Focus states: var(--pryde-purple)

#### Everything Else:
- [ ] Neutral gray backgrounds
- [ ] Muted text colors
- [ ] Flat hover states (no glow)
- [ ] Clean transitions

---

### 6. Dark Mode Testing

**Toggle:** Settings → Theme → Dark

#### All Pages:
- [ ] Calm mode styles apply in dark mode
- [ ] Borders use rgba(255, 255, 255, 0.1)
- [ ] Backgrounds use var(--bg-card)
- [ ] No harsh contrasts
- [ ] Readable text

---

### 7. Accessibility Testing

#### Keyboard Navigation:
- [ ] All interactive elements focusable
- [ ] Focus states visible (purple outline)
- [ ] Tab order logical

#### Screen Reader:
- [ ] Badge tooltips have aria-label
- [ ] Tier 3 modal has proper ARIA attributes
- [ ] All buttons have descriptive labels

#### Contrast:
- [ ] Text meets WCAG AA standards
- [ ] Muted text still readable
- [ ] Focus indicators visible

---

## Success Criteria

### Profile Page
- Feels like a calm, authoritative identity card
- Badge hierarchy is clear
- No visual clutter
- Easy to scan

### Feed
- Feels like a calm reading column
- Content is the star
- Consistent rhythm
- No competing elements

### Mobile
- Feels like a quiet reading app
- Single column, full width
- Proper touch targets
- Reduced visual noise

### Navigation
- Quiet and neutral
- Brand color only for active states
- Doesn't compete with content

---

## Known Issues / Future Work

- [ ] Ensure all legacy badge usage is migrated to TieredBadgeDisplay
- [ ] Test with users who have many badges (Tier 3 modal)
- [ ] Validate warmth and queer identity are preserved
- [ ] Fine-tune spacing if needed
- [ ] Accessibility audit

---

## Sign-Off

- [ ] Profile page validated
- [ ] Feed validated
- [ ] Mobile validated
- [ ] Navigation validated
- [ ] Dark mode validated
- [ ] Accessibility validated

**Transformation Complete:** Pryde is now platform-grade while staying warm and queer. 🏳️‍🌈✨

