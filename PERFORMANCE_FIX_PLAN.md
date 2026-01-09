# 🚀 Performance Fix Plan - LCP & CLS

**Date:** 2026-01-09  
**Current Metrics:**
- **LCP:** 4.57s (POOR - Target: <2.5s)
- **CLS:** 0.2106 (POOR - Target: <0.1)

---

## 🎯 Root Causes Identified

### LCP Issues (Largest Contentful Paint)
1. **Cover photos** loaded as `background-image` (not optimized, no lazy loading)
2. **Profile photos** loaded as `background-image` (not optimized)
3. **No preload hints** for critical images (logo, first post image)
4. **No fetchpriority="high"** on above-the-fold images
5. **Large unoptimized images** (no AVIF/WebP, no responsive sizes)

### CLS Issues (Cumulative Layout Shift)
**Elements causing shifts:**
- `div.navbar-logo` - No reserved space for logo
- `div.search-input-wrapper` - Search bar loads async
- `div.navbar-actions` - Actions load after auth check
- `button.bell-button` - Notification bell loads async
- `div.profile-layout` - Profile content shifts when loaded

**Root causes:**
1. **No explicit dimensions** on navbar elements
2. **No skeleton loaders** for async content
3. **Images without width/height** attributes
4. **Async content** (notifications, messages) loads without reserved space

---

## ✅ Fix Plan

### PHASE 1: Fix LCP (Cover Photos & Profile Photos)
**Target: Reduce LCP from 4.57s to <2.5s**

1. **Convert background-images to `<img>` or OptimizedImage**
   - ProfileHeader.jsx: Cover photo
   - ProfileHeader.jsx: Profile avatar
   - Use OptimizedImage component with fetchpriority="high"

2. **Add preload hints to index.html**
   - Preload Pryde logo
   - Preconnect to image CDN/backend

3. **Add fetchpriority="high" to above-the-fold images**
   - Cover photo (if exists)
   - Profile photo
   - First post image in feed

4. **Ensure responsive image sizes**
   - Cover photos: 1200px max width
   - Profile photos: 200px max width
   - Use AVIF/WebP formats

---

### PHASE 2: Fix CLS (Navbar & Layout Shifts)
**Target: Reduce CLS from 0.2106 to <0.1**

1. **Reserve space for navbar elements**
   - Add explicit height to `.navbar` (60px)
   - Add min-width to `.navbar-logo` (120px)
   - Add min-width to `.navbar-actions` (200px)
   - Add min-width to `.search-input-wrapper` (300px)

2. **Add skeleton loaders**
   - Navbar: Show placeholder for bell/messages before auth loads
   - Profile: Show skeleton for profile info before data loads
   - Feed: Show skeleton for posts before data loads

3. **Add width/height to all images**
   - Navbar logo: width="36" height="36"
   - Profile avatar: aspect-ratio: 1/1
   - Cover photo: aspect-ratio: 3/1

4. **Reserve space for async content**
   - Notification bell: min-width + min-height
   - Message counter: min-width
   - Profile stats: min-height

---

### PHASE 3: Additional Optimizations

1. **Lazy load below-the-fold content**
   - Posts after first 3
   - Profile tabs (Essays, Photos)
   - Sidebar content

2. **Optimize font loading**
   - Add font-display: swap
   - Preload critical fonts

3. **Code splitting**
   - Lazy load modals (EditProfile, PhotoViewer)
   - Lazy load routes

---

## 📋 Implementation Checklist

### LCP Fixes
- [ ] Convert cover photo to OptimizedImage
- [ ] Convert profile avatar to OptimizedImage
- [ ] Add preload for Pryde logo in index.html
- [ ] Add fetchpriority="high" to cover photo
- [ ] Add fetchpriority="high" to profile photo
- [ ] Add fetchpriority="high" to first feed post image

### CLS Fixes
- [ ] Add explicit height to navbar (60px)
- [ ] Add min-width to navbar-logo (120px)
- [ ] Add min-width to navbar-actions (200px)
- [ ] Add min-width to search-input-wrapper (300px)
- [ ] Add width/height to navbar logo image
- [ ] Add aspect-ratio to profile avatar (1/1)
- [ ] Add aspect-ratio to cover photo (3/1)
- [ ] Create NavbarSkeleton component
- [ ] Create ProfileHeaderSkeleton component
- [ ] Reserve space for notification bell
- [ ] Reserve space for message counter

---

## 🎯 Expected Results

**After fixes:**
- **LCP:** <2.5s (Good) - 45% improvement
- **CLS:** <0.1 (Good) - 52% improvement

**User experience:**
- No layout jumps when page loads
- Images load progressively
- Navbar feels instant
- Profile loads smoothly

