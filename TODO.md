# Pryde Frontend TODO

## High Priority - ESLint Errors (17 total)
### Architecture Violations (8)
- [ ] Feed.jsx:340 - window.innerHeight
- [ ] Feed.jsx - window.matchMedia  
- [ ] Feed.jsx - window.innerWidth
- [ ] Messages.jsx:65 - window.innerWidth
- [ ] Messages.jsx:72 - window.innerWidth
- [ ] Profile.jsx:1102 - window.matchMedia
- [ ] Profile.jsx:1436 - window.innerWidth
- [ ] Profile.jsx:1461 - window.innerWidth

### Constant Binary Expressions (2)
- [ ] Messages.jsx:1656 - constant truthiness
- [ ] Messages.jsx:2539 - constant truthiness

### JSX Accessibility (2)
- [ ] GroupsList.jsx:317 - no-noninteractive-tabindex
- [ ] PhotoEssay.jsx:342 - img-redundant-alt

### Unnecessary Escapes (5)
- [ ] Register.jsx:119 - unnecessary \[ \/
- [ ] Register.jsx:237 - unnecessary \[ \/
- [ ] ResetPassword.jsx:46 - unnecessary \[ \/
- [ ] pushNotifications.jsx:141 - unnecessary \-
- [ ] pwa.js:297 - unnecessary \-

## Medium Priority
- Empty state designs
- Advanced motion interactions

## Low Priority
- Theme expansions (additional color schemes like high contrast, sepia)

## Completed Features
✓ Skeleton loading states (FeedSkeleton.jsx, PostSkeleton.jsx)
✓ Toast notification system (Toast.jsx)
✓ Image blur placeholders (ProgressiveImage.jsx)
✓ Feed animation polish (staggered animations, smooth transitions, reduced motion support)
✓ Virtual scrolling optimization for 100+ posts (threshold lowered to 10)
✓ Hybrid scroll support prepared
