# Manual Testing Guide - In-Place Photo Editing

## 🎯 Quick Start

1. **Start the development server:**
   ```bash
   cd pryde-frontend
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **Log in** to your account

4. **Navigate to your profile** (click your avatar in navbar)

---

## ✅ Test Checklist

### 1. Edit Mode Activation (Desktop)

**Steps:**
1. Go to your profile page
2. Hover over the cover photo
3. Look for "Edit Cover" button in top-right corner
4. Click "Edit Cover"

**Expected Results:**
- ✅ Edit mode activates
- ✅ Visual guides appear on cover photo (dashed lines)
- ✅ Save bar slides up from bottom with "Changes won't apply until you save"
- ✅ Save button is disabled (no changes yet)

---

### 2. Cover Photo Drag Editing

**Steps:**
1. While in edit mode, click and drag the cover photo
2. Move it around
3. Release mouse

**Expected Results:**
- ✅ Photo moves in real-time as you drag
- ✅ Visual guides fade out during drag
- ✅ Visual guides fade back in after ~300ms pause
- ✅ Avatar-safe circle guide visible (top-left)
- ✅ Text clearance guide visible (bottom)
- ✅ Save button becomes enabled
- ✅ Cursor changes to "grabbing" during drag

---

### 3. Avatar Editing

**Steps:**
1. While in edit mode, hover over your avatar
2. Look for small edit button (✏️) on avatar
3. Click and drag the avatar
4. Look for zoom slider at bottom of avatar

**Expected Results:**
- ✅ Edit button appears on avatar hover
- ✅ Avatar can be dragged to reposition
- ✅ Zoom slider appears after interaction
- ✅ Slider adjusts avatar size (1x to 2x)
- ✅ Changes tracked in save bar

---

### 4. Keyboard Nudging

**Steps:**
1. While in edit mode, click on cover photo to focus it
2. Press arrow keys (Up, Down, Left, Right)

**Expected Results:**
- ✅ Photo moves 5px per keypress
- ✅ Movement is smooth
- ✅ Bounds are respected (doesn't move too far)
- ✅ Save button enabled after keyboard changes

---

### 5. Save Changes

**Steps:**
1. Make some changes to photo positions
2. Click "Save changes" in bottom save bar

**Expected Results:**
- ✅ Button shows "Saving..." state
- ✅ Changes persist to backend
- ✅ Edit mode exits
- ✅ Save bar disappears
- ✅ Toast notification: "Photo positions saved successfully!"
- ✅ Photos remain in new positions after page refresh

---

### 6. Cancel Changes

**Steps:**
1. Enter edit mode
2. Make some changes to photo positions
3. Click "Cancel" in save bar

**Expected Results:**
- ✅ Photos return to original positions
- ✅ Edit mode exits
- ✅ Save bar disappears
- ✅ No backend request made
- ✅ No changes persisted

---

### 7. Edit Profile Modal (Cleanup Verification)

**Steps:**
1. Click "Edit Profile" button (top-right of cover)
2. Scroll through the modal

**Expected Results:**
- ✅ NO photo editing section visible
- ✅ Modal shows only: Basic Info, Social Links, Interests, Badges, Accessibility
- ✅ Note at top: "Photo editing moved to in-place editing on profile header"
- ✅ Modal is cleaner and more focused

---

### 8. Mobile Testing (Resize browser to <768px)

**Steps:**
1. Resize browser to mobile width (375px-768px)
2. Go to your profile
3. Click "Edit Cover" button
4. Try touch drag (or mouse drag to simulate)

**Expected Results:**
- ✅ Edit buttons remain accessible
- ✅ Touch drag works smoothly
- ✅ Save bar adapts to mobile layout (stacks vertically)
- ✅ All buttons are touch-friendly (44px minimum)
- ✅ Visual guides scale appropriately

---

### 9. Accessibility Testing

**Steps:**
1. Enter edit mode
2. Press Tab key to navigate
3. Use arrow keys to nudge photo
4. Enable "Reduce motion" in OS settings
5. Test with screen reader (optional)

**Expected Results:**
- ✅ Can focus on editor with Tab
- ✅ Arrow keys nudge position
- ✅ ARIA labels present
- ✅ Focus indicators visible
- ✅ No animations when reduced motion enabled
- ✅ Screen reader announces edit mode

---

### 10. Edge Cases

**Test A: Missing Cover Photo**
1. Remove your cover photo (if possible)
2. Go to profile

**Expected:** Edit button still works, placeholder shown

**Test B: Missing Avatar**
1. Remove your avatar (if possible)
2. Go to profile

**Expected:** Edit button doesn't appear (no photo to edit)

**Test C: Network Error**
1. Enter edit mode
2. Make changes
3. Disconnect internet
4. Click Save

**Expected:** Error toast shown, edit mode remains active

**Test D: Non-Owner Profile**
1. Visit someone else's profile

**Expected:** No edit buttons visible, cannot enter edit mode

---

## 🐛 Common Issues & Solutions

### Issue: Visual guides don't appear
**Solution:** Check browser console for CSS loading errors

### Issue: Drag doesn't work
**Solution:** Verify edit mode is active (save bar should be visible)

### Issue: Save button always disabled
**Solution:** Make sure you've actually moved the photo

### Issue: Changes don't persist
**Solution:** Check browser console for API errors, verify backend is running

### Issue: Photos jump back after save
**Solution:** Check backend response, verify position data is being saved

---

## 📊 Performance Checks

### Check 1: Smooth Dragging
- Drag should be 60fps with no jank
- Visual guides should fade smoothly

### Check 2: No Memory Leaks
- Enter/exit edit mode multiple times
- Check browser DevTools Memory tab

### Check 3: Bundle Size
- Check Network tab in DevTools
- New components should add ~6KB total

---

## 🎨 Visual Quality Checks

### Check 1: Visual Guides
- Guides should be subtle (low opacity)
- Neutral color (not purple)
- Fade smoothly during drag

### Check 2: Save Bar
- Should slide up smoothly
- Should be fixed at bottom
- Should not cover important content

### Check 3: Edit Buttons
- Should be clearly visible
- Should have good contrast
- Should respond to hover

---

## ✅ Sign-Off Checklist

Before marking as production-ready:

- [ ] All 10 test scenarios pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Smooth performance (60fps)
- [ ] Works on mobile
- [ ] Keyboard accessible
- [ ] Reduced motion respected
- [ ] Backend persistence works
- [ ] Edit Profile modal cleaned up
- [ ] Documentation complete

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

✅ Edit mode activation
✅ Cover photo drag
✅ Avatar editing
✅ Keyboard nudging
✅ Save functionality
✅ Cancel functionality
✅ Modal cleanup
✅ Mobile responsive
✅ Accessibility
✅ Edge cases

Issues Found:
1. ___________
2. ___________

Overall Status: PASS / FAIL / NEEDS WORK
```

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Mark task as complete
   - Deploy to staging
   - Perform final QA
   - Deploy to production

2. **If issues found:**
   - Document issues in TODO.md
   - Fix critical bugs
   - Re-test
   - Repeat until all tests pass

3. **Future enhancements:**
   - Add photo upload in edit mode
   - Add reset button
   - Add undo/redo
   - Add grid overlay
