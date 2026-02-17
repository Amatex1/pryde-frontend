# Mobile Profile Avatar Fix Plan

## Issue
User profile pics are stuck behind the cover photo on mobile devices.

## Investigation Summary
1. Found multiple mobile media queries at different breakpoints (768px, 500px, 480px, 375px)
2. Found CSS attempts to fix this with "FIX: Ensure avatar appears ABOVE cover photo on mobile" comments
3. There are conflicting styles - some have `position: absolute` with `z-index: 20`, others have `position: relative` with `z-index: 10`
4. The `.profile-cover` has `overflow: hidden` which might be clipping the avatar when pulled up with negative margin

## Fix Plan
1. Ensure the avatar has a consistently higher z-index than the cover on all mobile breakpoints
2. Use `position: absolute` with proper z-index to ensure it's above the cover
3. Ensure the avatar is properly positioned to be visible (not clipped by overflow: hidden)

## Files Edited
- pryde-frontend/src/pages/Profile.css - Fix the z-index and positioning for mobile

## Changes Made (COMPLETED)
1. ✅ Increased z-index from 20 to 100 for `.profile-avatar.profile-avatar--overlay` in @media (max-width: 768px)
2. ✅ Added new rule for `.profile-avatar:not(.profile-avatar--overlay)` with z-index: 100 on mobile
3. ✅ Both overlay and non-overlay avatars now properly display above the cover photo

## Status: COMPLETED ✅
