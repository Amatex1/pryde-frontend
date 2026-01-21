# Component Isolation Plan

## ✅ COMPLETED: PostHeader
**Status:** Fully isolated with `fb-` prefix  
**File:** `src/components/PostHeader.isolated.css`  
**Benefits:**
- Zero CSS conflicts
- Can edit without breaking other components
- Self-contained responsive design
- 623 lines of conflicting CSS removed

---

## 🎯 COMPONENTS THAT NEED ISOLATION

### **Priority 1: High Conflict Components**

#### 1. **Message Components** (Messages.css)
**Problem:**
- `.message-header` conflicts with global header styles
- `.message-avatar-small` styled in multiple files
- `.message-sender-name` has inconsistent styling

**Solution:**
- Create `MessageBubble.isolated.css` with `msg-` prefix
- Classes: `.msg-bubble`, `.msg-header`, `.msg-avatar`, `.msg-sender`, `.msg-content`

**Impact:** ~200 lines of CSS, used in Messages page and MiniChat

---

#### 2. **Comment Components** (Feed.css, multiple files)
**Problem:**
- `.comment-header` styled in Feed.css, Groups.css, Profile.css
- `.comment-author` has conflicting styles
- `.comment-avatar` size varies across pages

**Solution:**
- Create `CommentThread.isolated.css` with `cmt-` prefix
- Classes: `.cmt-thread`, `.cmt-header`, `.cmt-avatar`, `.cmt-author`, `.cmt-content`

**Impact:** ~300 lines of CSS, used across Feed, Groups, Profile

---

#### 3. **Notification Components** (Notifications.css)
**Problem:**
- `.notification-card` styled in multiple files
- `.notification-avatar` conflicts with other avatar styles
- Mobile overrides in mobileFriendly.css

**Solution:**
- Create `NotificationCard.isolated.css` with `notif-` prefix
- Classes: `.notif-card`, `.notif-avatar`, `.notif-content`, `.notif-time`

**Impact:** ~150 lines of CSS, used in Notifications page and NotificationBell

---

### **Priority 2: Medium Conflict Components**

#### 4. **Profile Header** (Profile.css)
**Problem:**
- `.profile-header` conflicts with `.post-header`
- `.profile-avatar` has different sizing than post avatars
- Responsive overrides scattered across files

**Solution:**
- Create `ProfileHeader.isolated.css` with `prof-` prefix
- Classes: `.prof-header`, `.prof-avatar`, `.prof-info`, `.prof-stats`

**Impact:** ~250 lines of CSS

---

#### 5. **Group Components** (Groups.css)
**Problem:**
- `.group-card` styled in Groups.css and mobileFriendly.css
- `.group-header` conflicts with other headers
- `.group-posts .post-header` has legacy overrides

**Solution:**
- Create `GroupCard.isolated.css` with `grp-` prefix
- Classes: `.grp-card`, `.grp-header`, `.grp-info`, `.grp-members`

**Impact:** ~200 lines of CSS

---

#### 6. **Lounge Message** (Lounge.css)
**Problem:**
- `.lounge-message-header` similar to `.message-header`
- `.lounge-message-avatar` conflicts with other avatars
- Duplicate styling with Messages.css

**Solution:**
- Create `LoungeMessage.isolated.css` with `lng-` prefix
- Classes: `.lng-message`, `.lng-header`, `.lng-avatar`, `.lng-sender`

**Impact:** ~100 lines of CSS

---

### **Priority 3: Low Conflict (But Would Benefit)**

#### 7. **Admin Components** (Admin.css)
**Problem:**
- `.admin-post-author` duplicates post header logic
- `.admin-post-author-avatar` conflicts with other avatars

**Solution:**
- Create `AdminPost.isolated.css` with `adm-` prefix

**Impact:** ~80 lines of CSS

---

## 📊 ISOLATION BENEFITS

### **Before Isolation:**
- ❌ 1,500+ lines of conflicting CSS across files
- ❌ Editing one component breaks others
- ❌ `!important` wars
- ❌ Unpredictable responsive behavior
- ❌ Hard to maintain

### **After Isolation:**
- ✅ Each component in ONE file
- ✅ Edit freely without breaking others
- ✅ No `!important` needed
- ✅ Predictable responsive design
- ✅ Easy to maintain and debug

---

## 🚀 IMPLEMENTATION STRATEGY

### **Step 1: Create Isolated CSS**
1. Create `[Component].isolated.css` with unique prefix
2. Add CSS reset at top
3. Copy all component styles
4. Rename all classes with prefix
5. Add responsive styles
6. Add dark mode support

### **Step 2: Update Component JSX**
1. Import new isolated CSS
2. Update all className attributes
3. Test on all pages that use it

### **Step 3: Remove Old Styles**
1. Remove from original CSS file
2. Remove overrides from mobileFriendly.css
3. Remove overrides from responsiveBase.css
4. Remove overrides from other global files

### **Step 4: Verify**
1. Test component on all pages
2. Test responsive behavior
3. Test dark mode
4. Check for visual regressions

---

## 📝 NAMING CONVENTIONS

| Component | Prefix | Example Classes |
|-----------|--------|----------------|
| PostHeader | `fb-` | `.fb-post-header`, `.fb-avatar`, `.fb-name` |
| Message | `msg-` | `.msg-bubble`, `.msg-header`, `.msg-avatar` |
| Comment | `cmt-` | `.cmt-thread`, `.cmt-header`, `.cmt-author` |
| Notification | `notif-` | `.notif-card`, `.notif-avatar`, `.notif-time` |
| Profile | `prof-` | `.prof-header`, `.prof-avatar`, `.prof-info` |
| Group | `grp-` | `.grp-card`, `.grp-header`, `.grp-members` |
| Lounge | `lng-` | `.lng-message`, `.lng-header`, `.lng-sender` |
| Admin | `adm-` | `.adm-post`, `.adm-header`, `.adm-avatar` |

---

## ✅ SUCCESS METRICS

- **Lines of CSS removed:** Target 1,500+ lines
- **Files simplified:** Target 10+ files
- **Conflicts resolved:** Target 100% of component conflicts
- **Maintainability:** Each component editable independently

