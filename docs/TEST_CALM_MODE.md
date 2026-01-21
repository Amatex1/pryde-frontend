# Calm Mode Testing Guide

**Date:** 2026-01-09  
**Status:** Ready for Testing

## Quick Start

```bash
cd pryde-frontend
npm run dev
```

Open browser to `http://localhost:5173`

---

## 🎯 PHASE A: Badge Hierarchy

### Test Profile Page

1. Navigate to any user profile
2. **Check Badge Display:**
   - ✅ Tier 1 badges (Founder, Team, Moderator) appear inline with display name
   - ✅ Tier 2 badges (Active, Organizer, etc.) appear in muted row below
   - ✅ Tier 3 badges hidden, accessible via "View X more badges" button
   - ✅ No gradients on badges
   - ✅ No glows or decorative effects

### Test Feed

1. Navigate to `/feed`
2. **Check Post Headers:**
   - ✅ Only Tier 1 badges shown next to author names
   - ✅ Tier 2 & 3 badges completely hidden in feed
   - ✅ Clean, minimal badge display

### Test Comments

1. Open any post with comments
2. **Check Comment Headers:**
   - ✅ Only Tier 1 badges shown next to commenter names
   - ✅ Badges are subtle, not distracting

---

## 🎯 PHASE B: Profile Layout Spine

### Visual Hierarchy Check

Navigate to any profile and verify vertical order:

1. ✅ Cover photo (clean, no overlay)
2. ✅ Avatar (overlaps cover by 60px)
3. ✅ Display name (prominent but calm)
4. ✅ Username (muted, secondary)
5. ✅ Tier 1 badges (inline with name)
6. ✅ Tier 2 badges (muted row)
7. ✅ Pronouns/age pills (flat, no gradients)
8. ✅ Bio (centered, max-width 600px)
9. ✅ Stats (Posts, Followers, Following)

### Spacing Check

- ✅ Consistent 16px gap between sections
- ✅ No floating elements
- ✅ No overlapping visuals
- ✅ Everything snaps to vertical grid

---

## 🎯 PHASE C: Feed Rhythm

### Post Card Consistency

Scroll through feed and verify each post card has:

- ✅ ONE background color (var(--bg-card))
- ✅ ONE border (1px solid)
- ✅ ONE border radius (12px)
- ✅ NO gradients
- ✅ NO glows on hover
- ✅ NO decorative shadows

### Vertical Rhythm

- ✅ 24px spacing between posts
- ✅ 16px padding inside posts
- ✅ Consistent spacing: author → content → actions

### Visual Noise Reduction

- ✅ Reaction buttons: icons only, no glow
- ✅ Comment counts: muted text
- ✅ Timestamps: quiet, secondary
- ✅ Privacy icons: subtle
- ✅ **Content is the loudest element**

---

## 🎯 PHASE D: Mobile Calm Mode

### Resize browser to < 768px width

### Layout Check

- ✅ Single column layout (no sidebars)
- ✅ Post cards full width
- ✅ No horizontal scroll
- ✅ Vertical stacking for all elements

### Profile Mobile

- ✅ Avatar: 100px × 100px
- ✅ Display name: 1.5rem
- ✅ All badges stack vertically
- ✅ Tier 2 & 3 badges hidden behind "Details"

### Touch Targets

- ✅ All buttons minimum 44px height
- ✅ Increased spacing between icons
- ✅ No tiny click targets

### Visual Restraint

- ✅ Reduced saturation
- ✅ No gradients
- ✅ Flat surfaces only

---

## 🎯 PHASE E: Quiet Chrome

### Navigation Bar

- ✅ Background: var(--bg-card)
- ✅ Border: 1px solid (subtle)
- ✅ NO gradients
- ✅ NO glow
- ✅ NO backdrop-filter blur

### Brand Color Usage (ONLY)

Check that purple/brand color appears ONLY on:

- ✅ Active tab/link
- ✅ Primary CTA buttons
- ✅ New message badge
- ✅ Focus states on inputs

### Everything Else

- ✅ Neutral gray backgrounds
- ✅ Muted text colors
- ✅ Flat hover states (no glow)
- ✅ Clean transitions

---

## 🎯 Dark Mode Test

Toggle to dark mode (Settings → Theme → Dark)

- ✅ All calm mode styles apply
- ✅ Borders use rgba(255, 255, 255, 0.1)
- ✅ Backgrounds use var(--bg-card)
- ✅ No harsh contrasts
- ✅ Readable text

---

## ✅ Success Criteria

### Profile Page
- Feels like a calm, authoritative identity card
- Badge hierarchy is immediately clear
- No visual clutter
- Easy to scan in 2 seconds

### Feed
- Feels like a calm reading column
- Content is the star
- Consistent rhythm
- No competing visual elements

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

## 🐛 Known Issues to Watch For

- [ ] Badge tier classification might need adjustment for custom badges
- [ ] Tier 3 modal might need scroll handling for users with 20+ badges
- [ ] Mobile touch targets on reaction buttons might need fine-tuning
- [ ] Dark mode contrast on muted text might need adjustment

---

## 📊 Before/After Comparison

### Before (Expressive/Decorative)
- Multiple gradients per page
- Glowing effects on hover
- Decorative shadows everywhere
- All badges visible at once
- Competing visual elements
- Cluttered profile headers

### After (Calm/Platform-Grade)
- No gradients
- No glows
- Subtle shadows only on avatar
- 3-tier badge hierarchy
- Content is the star
- Clean, structured profiles

---

## 🎉 Sign-Off

When all checks pass:

- [ ] Profile page validated
- [ ] Feed validated
- [ ] Mobile validated
- [ ] Navigation validated
- [ ] Dark mode validated
- [ ] Badge hierarchy working correctly

**Transformation Complete!** 🏳️‍🌈✨

Pryde is now platform-grade while staying warm and queer.

