# Typography Token Migration Plan

**Status**: Phase 3 - High-Impact CSS Files  
**Date**: 2026-02-04  
**Goal**: Replace all magic number font-sizes, font-weights, and line-heights with consolidated typography tokens

---

## 📋 Migration Status

### ✅ Completed Files
- [x] **Profile.css** - 21 replacements (line-heights, font-weights)
  - Migrated all magic numbers to tokens
  - Tested and verified

### 🔄 In Progress
- [ ] **Admin.css** - 25 magic numbers identified
  - 2/25 completed manually
  - Ready for automated migration

### ⏳ Pending Files
- [ ] **Groups.css** - ~60 magic numbers (estimated)
- [ ] **Navbar.css** - ~40 magic numbers (estimated)
- [ ] **Feed.calm.css** - ~50 magic numbers (estimated)
- [ ] **Settings.css** - ~45 magic numbers (estimated)
- [ ] **Lounge.css** - ~35 magic numbers (estimated)
- [ ] **GroupsList.css** - ~30 magic numbers (estimated)

---

## 🎯 Token Mapping Reference

### Font Weights
```css
/* OLD → NEW */
font-weight: 400  →  var(--font-weight-normal)
font-weight: 500  →  var(--font-weight-medium)
font-weight: 600  →  var(--font-weight-semibold)
font-weight: 700  →  var(--font-weight-bold)
font-weight: 900  →  var(--font-weight-bold)  /* Map to bold */
```

### Line Heights
```css
/* TIGHT (1.25) - Headings, single-line labels */
line-height: 1      →  var(--line-height-tight)
line-height: 1.2    →  var(--line-height-tight)
line-height: 1.25   →  var(--line-height-tight)
line-height: 1.3    →  var(--line-height-tight)

/* NORMAL (1.5) - Body text, comments, UI text */
line-height: 1.4    →  var(--line-height-normal)
line-height: 1.45   →  var(--line-height-normal)
line-height: 1.5    →  var(--line-height-normal)
line-height: 1.55   →  var(--line-height-normal)

/* RELAXED (1.65) - Long-form content, bios */
line-height: 1.6    →  var(--line-height-relaxed)
line-height: 1.65   →  var(--line-height-relaxed)
line-height: 1.8    →  var(--line-height-relaxed)
```

### Font Sizes (Already Using Tokens)
Most files already use:
- `var(--font-size-xs)` - 12px
- `var(--font-size-sm)` - 14px
- `var(--font-size-base)` - 16px
- `var(--font-size-lg)` - 18px
- `var(--font-size-xl)` - 20px
- `var(--font-size-2xl)` - 24px
- `var(--font-size-3xl)` - 32px

---

## 🛠️ Migration Tools

### Automated Script
**File**: `migrate-typography-tokens.js`

**Usage**:
```bash
cd f:/Desktop/pryde-frontend
node migrate-typography-tokens.js
```

**What it does**:
- Scans all target CSS files
- Replaces magic numbers with tokens
- Provides detailed statistics
- Preserves formatting and comments

**Safety**:
- Creates backups (use git to review)
- Only modifies specified files
- Preserves `!important` flags
- Maintains exact spacing

---

## 📝 Manual Review Checklist

After running the script:

1. **Review Changes**
   ```bash
   git diff src/pages/Admin.css
   git diff src/pages/Groups.css
   git diff src/pages/Navbar.css
   git diff src/pages/Feed.calm.css
   git diff src/pages/Settings.css
   git diff src/pages/Lounge.css
   git diff src/pages/GroupsList.css
   ```

2. **Test Visual Regression**
   - [ ] Profile page layout
   - [ ] Admin panel tables
   - [ ] Groups page
   - [ ] Navbar spacing
   - [ ] Settings forms
   - [ ] Lounge interface

3. **Check Edge Cases**
   - [ ] `line-height: 0` (used for spacing hacks)
   - [ ] Inline styles in comments
   - [ ] Media query overrides
   - [ ] Dark mode variants

---

## 🚀 Execution Plan

### Step 1: Run Automated Migration
```bash
node migrate-typography-tokens.js
```

### Step 2: Review Output
Check console for:
- Files processed
- Replacements made
- Any warnings

### Step 3: Visual Testing
Test each page in browser:
- Light mode
- Dark mode
- Mobile responsive
- Tablet responsive

### Step 4: Commit Changes
```bash
git add src/pages/Admin.css src/pages/Groups.css src/pages/Navbar.css
git add src/pages/Feed.calm.css src/pages/Settings.css src/pages/Lounge.css
git add src/pages/GroupsList.css
git commit -m "Phase 3: Migrate typography tokens in high-impact CSS files"
```

---

## ⚠️ Known Issues & Edge Cases

1. **line-height: 0** - Used for spacing hacks, maps to tight (review manually)
2. **font-weight: 900** - No 900 token, maps to bold (700)
3. **!important flags** - Preserved in replacements
4. **Calc expressions** - Not touched by script
5. **CSS variables** - Already using tokens, skipped

---

## 📊 Expected Impact

- **Consistency**: All typography uses same scale
- **Maintainability**: Single source of truth
- **Performance**: No change (CSS variables already in use)
- **Accessibility**: Improved with consistent line-heights
- **File Size**: Minimal change (~50 bytes per file)

---

## 🔄 Next Steps (Phase 4 & 5)

After Phase 3 completion:
- [ ] Phase 4: Apply semantic tokens (button, input, post, comment)
- [ ] Phase 5: Remove !important overrides
- [ ] Final: Commit and push all changes

