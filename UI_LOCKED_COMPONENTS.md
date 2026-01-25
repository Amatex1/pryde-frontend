# UI Locked Components

> **IMPORTANT**: This document defines which UI components are locked, guarded, or unlocked.
> Changes to locked components require explicit approval.

---

## 🔒 LOCKED COMPONENTS

These components are **frozen** and may not be modified without explicit approval.
They represent core product identity and user experience.

### Post Cards
- `.post-card` structure and styling
- Post content layout
- Media display within posts
- Post actions bar

### Reaction System
- Emoji reactions display
- Reaction counts and badges
- Reaction picker

### Comment Threads
- Comment layout and nesting
- Reply functionality styling
- Comment actions

### Navbar
- Top navigation structure
- Mobile header
- Navigation dropdowns
- Search bar in navbar

### Buttons & Pills
- `.btn-primary`, `.btn-secondary`
- Pill badges
- Action buttons

### Modals
- Modal structure and animations
- Modal backdrop
- Modal sizing

### Quiet Mode
- Quiet mode color system
- Quiet mode typography
- Quiet mode transitions

---

## 🛡️ GUARDED COMPONENTS

These components may be modified for **stability and safety only**.
No visual redesign allowed.

### Messages Page
- **Allowed**: Layout stability fixes, scroll behavior, height calculations
- **Not Allowed**: Visual redesign, new features, color changes

### Profile Header
- **Allowed**: Text safety fixes, responsive adjustments
- **Not Allowed**: Layout redesign, new elements

---

## 🔓 UNLOCKED COMPONENTS

These components may be modified freely for improvements.

### Settings Page
- Full redesign allowed
- New sections can be added

### Legal/Auth Pages
- Styling improvements allowed
- Dark mode fixes allowed

### Edge-case Responsive Fixes
- Mobile-specific adjustments
- Tablet breakpoint fixes
- PWA-specific styling

---

## Rules

1. **Locked components** may not be modified without explicit approval
2. **Guarded components** may only be modified for stability/safety fixes
3. **Unlocked components** may be modified freely
4. All changes must respect the design token system
5. No hardcoded colors allowed - use CSS variables
6. No `!important` unless absolutely necessary

---

## Change Process

### For Locked Components:
1. Document the proposed change
2. Explain why it's necessary
3. Get explicit approval
4. Test thoroughly before deployment

### For Guarded Components:
1. Ensure change is stability/safety only
2. No visual redesign
3. Test across all breakpoints

### For Unlocked Components:
1. Follow design system
2. Test thoroughly
3. Deploy when ready

---

*Last Updated: 2026-01-25*
*Phase: PRYDE_PHASE_1_4_UI_STABILITY_AND_PROFESSIONAL_POLISH*

