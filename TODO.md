# Pryde Profile & Cover Photo Reposition UX Upgrade

## Implementation Progress

### 1. Live Masked Preview ✅
- [x] Add circular mask for profile photo with soft dimming outside
- [x] Add full-width crop mask for cover photo with soft dimming outside
- [x] Ensure masks show exact final rendered size

### 2. Drag-First Interaction ✅
- [x] Make drag primary interaction with grab/grabbing cursor
- [x] Change sliders to "Fine tune size" label
- [x] Remove numeric zoom values from UI

### 3. Soft Safety Guides ✅
- [x] Add subtle dashed guides for cover photo (avatar overlap, text clearance)
- [x] Guides fade out during drag, fade back in after interaction
- [x] Use low-contrast neutral tones, not purple

### 4. Pryde-First Visual Styling ✅
- [x] Use --color-primary for active drag state, slider thumb, save feedback
- [x] Smooth easing on drag release with reduced-motion respect
- [x] No visual clutter or sharp edges

### 5. Unified Save Pattern ✅
- [x] Remove individual photo save buttons
- [x] Add sticky unified "Save changes" button at bottom
- [x] Button disabled until change detected
- [x] Helper text: "Changes won't apply until you save"

### 6. Quiet, Forgiving Defaults ✅
- [x] Default zoom slightly in (≈1.05x) to avoid edge clipping
- [x] Images centered on load
- [x] Soft bounds with gentle easing back from edges
- [x] No error states during repositioning

## Files Modified
- EditProfileModal.css - Added mask styling, safety guides, unified save UI
- EditProfileModal.jsx - Updated drag logic, change detection, unified save

## Testing Checklist
- [ ] Drag interactions work smoothly on desktop and mobile
- [ ] Bounds checking prevents images from going too far off-screen
- [ ] Keyboard accessibility (arrow key nudging) implemented
- [ ] ARIA labels added for screen readers
- [ ] Works in Dark Mode and Quiet Mode
- [ ] No breaking changes to existing backend APIs
- [ ] Save button enables/disables correctly on changes
- [ ] Safety guides fade properly during interaction
- [ ] Masks show exact final rendered appearance
