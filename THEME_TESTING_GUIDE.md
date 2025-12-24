# THEME + QUIET MODE TESTING GUIDE

## 🎯 OBJECTIVE
Test all 4 theme combinations to ensure consistent rendering:
- Light
- Dark
- Light + Quiet
- Dark + Quiet

---

## 📋 TEST MATRIX

### **Expected Visual Behavior**

| Mode | Background | Text | Accents | Borders | Shadows |
|------|-----------|------|---------|---------|---------|
| **Light** | `#F5F6FA` (soft grey) | `#1E1E26` (dark) | `#6C5CE7` (purple) | `#E2E4EC` (subtle) | Visible |
| **Dark** | `#0F1021` (midnight) | `#F8F7FF` (white) | `#6C5CE7` (purple) | `#262842` (subtle) | None |
| **Light + Quiet** | `#F5F6FA` | `#1E1E26` (92% opacity) | `#6C5CE7` (65% opacity) | `#E2E4EC` (60% opacity) | Soft |
| **Dark + Quiet** | `#0F1021` | `#F8F7FF` (92% opacity) | `#6C5CE7` (65% opacity) | `#262842` (60% opacity) | None |

---

## 🧪 TEST PROCEDURE

### **1. Toggle Theme Modes**

**Location:** Settings or theme toggle button

**Steps:**
1. Start in Light mode
2. Toggle to Dark mode
3. Toggle back to Light mode
4. Enable Quiet mode (Light + Quiet)
5. Toggle to Dark mode (Dark + Quiet)
6. Disable Quiet mode (Dark only)

**Expected:**
- ✅ Smooth transitions between modes
- ✅ No visual glitches or flashing
- ✅ All elements update consistently
- ✅ No hard-coded colors remain visible

---

### **2. Test Pages**

Test each page in all 4 combinations:

**Pages to test:**
- [ ] Feed
- [ ] Profile
- [ ] Messages
- [ ] Settings
- [ ] Notifications
- [ ] Events
- [ ] Admin
- [ ] Discover
- [ ] Bookmarks
- [ ] Search Results

**For each page, verify:**
- ✅ Background colors match expected values
- ✅ Text is readable (proper contrast)
- ✅ Buttons and accents use correct colors
- ✅ Borders are visible but subtle
- ✅ Shadows appear/disappear correctly
- ✅ No hard-coded colors visible

---

### **3. Test Components**

**Components to test:**
- [ ] DraftManager (modal)
- [ ] CustomModal (dialogs)
- [ ] AudioPlayer
- [ ] CookieBanner
- [ ] DarkModeToggle
- [ ] EditHistoryModal
- [ ] EditProfileModal
- [ ] EmojiPicker
- [ ] EventAttendees
- [ ] EventRSVP
- [ ] FormattedText
- [ ] Post cards
- [ ] Comment sections
- [ ] Navigation bars

**For each component, verify:**
- ✅ Uses CSS variables (no hard-coded colors)
- ✅ Renders correctly in all 4 modes
- ✅ Hover states work properly
- ✅ Focus states are visible
- ✅ Animations respect quiet mode

---

### **4. Test Interactions**

**Actions to test:**
- [ ] Create a post (Feed/Journal/Longform)
- [ ] Upload media
- [ ] Create a poll
- [ ] Save a draft
- [ ] Edit a post
- [ ] Delete a post
- [ ] Like/comment on posts
- [ ] Send a message
- [ ] Create an event
- [ ] RSVP to an event
- [ ] Update profile
- [ ] Change settings

**For each action, verify:**
- ✅ Modals/dialogs use correct theme
- ✅ Form inputs are readable
- ✅ Buttons are clearly visible
- ✅ Success/error messages use correct colors
- ✅ Loading states are visible

---

### **5. Test Edge Cases**

**Scenarios:**
- [ ] Long text content (overflow handling)
- [ ] Many images (media grid)
- [ ] Empty states (no posts, no messages)
- [ ] Error states (failed uploads, network errors)
- [ ] Loading states (spinners, skeletons)
- [ ] Nested components (modals within modals)

**For each scenario, verify:**
- ✅ Theme applies consistently
- ✅ No visual breaks or glitches
- ✅ Text remains readable
- ✅ Borders/shadows behave correctly

---

## 🐛 KNOWN ISSUES TO CHECK

### **1. Hard-Coded Colors**
**Symptom:** Elements don't change color when switching themes
**Fix:** Replace with CSS variables

### **2. Missing Variables**
**Symptom:** Elements appear with default browser colors
**Fix:** Add missing variable definitions to variables.css

### **3. Specificity Conflicts**
**Symptom:** Some elements don't update despite using variables
**Fix:** Check for `!important` declarations or higher specificity selectors

### **4. Quiet Mode Not Softening**
**Symptom:** Quiet mode looks identical to normal mode
**Fix:** Verify `color-mix()` is working in variables.css

### **5. Dark Mode Too Bright**
**Symptom:** Dark mode has bright elements
**Fix:** Check for hard-coded light colors

---

## ✅ SUCCESS CRITERIA

**All tests pass when:**
- ✅ All 4 combinations render correctly
- ✅ No hard-coded colors visible
- ✅ Quiet mode softens (doesn't redesign)
- ✅ Dark mode is comfortable to read
- ✅ Transitions are smooth
- ✅ No console errors
- ✅ No visual glitches

---

## 📊 TEST RESULTS TEMPLATE

```
Date: ___________
Tester: ___________

Light Mode:          [ ] PASS  [ ] FAIL
Dark Mode:           [ ] PASS  [ ] FAIL
Light + Quiet:       [ ] PASS  [ ] FAIL
Dark + Quiet:        [ ] PASS  [ ] FAIL

Issues found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:
- [ ] All 4 combinations tested
- [ ] All pages tested
- [ ] All components tested
- [ ] All interactions tested
- [ ] Edge cases tested
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance is acceptable
- [ ] Accessibility verified (WCAG AAA)
- [ ] Mobile responsive (if applicable)

