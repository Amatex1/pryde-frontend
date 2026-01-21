# 🌿 PRYDE SOCIAL REFACTOR PLAN
## Calm Creative Platform for LGBTQ+ Introverts & Deep Thinkers

---

## 📋 EXECUTIVE SUMMARY

**Current State:** Traditional social media with friends, likes, followers, fast-scrolling feed  
**Target State:** Calm creative platform focused on depth, reflection, and meaningful connection  
**Timeline:** 6 Phases (estimated 4-6 weeks)  
**Risk Level:** Medium (major feature removal, but data preserved)

---

## ✅ CONFIRMED DECISIONS

### 1. USER DATA STRATEGY
- ✅ Keep all existing user accounts
- ✅ Keep all existing posts
- ❌ Remove all friend relationships
- ❌ Remove public follower/following counts
- 🔒 Convert likes to private (user can see their own likes only)

### 2. MESSAGING SYSTEM
- ✅ Keep 1-on-1 direct messages
- ❌ Remove group chats permanently
- 🔍 Discovery via: Profiles, Posts, Comments, Community Tags

### 3. FOLLOWING MECHANISM
- ✅ Keep follow/unfollow functionality (backend)
- ❌ Hide all follower counts from UI
- 📊 Internal use only: "Following Feed" + DM access

### 4. DISCOVERY SYSTEM (3-Tier)
1. **Community Tags** (primary) - #DeepThoughts, #QueerLife, etc.
2. **Slow Global Feed** - Chronological + time-weighted
3. **Featured Creator Posts** - Admin-curated quality content

### 5. IMPLEMENTATION METHOD
**Phased Rollout** - 6 sequential phases with testing between each

---

## 🎯 CORE FEATURE CHANGES

### REMOVE ❌
- Friends system (requests, lists, online status)
- Public like counts
- Public follower/following counts
- Group chats
- Stories (24-hour posts)
- Algorithmic feed
- Complex privacy (custom lists)
- Infinite scrolling

### KEEP ✅
- User profiles
- Posts (text, images, video)
- Comments
- Security stack (2FA, JWT, rate limiting)
- LGBTQ+ branding
- 1-on-1 DMs
- Follow mechanism (hidden)

### ADD ➕
- Quiet Mode (hide all metrics)
- Slow Feed (time-weighted, paginated)
- Journal Entries (micro-reflections)
- Longform Posts (creative essays)
- Photo Essays (multi-image with captions)
- Community Tags (discovery)
- Creator Pages (portfolio profiles)
- Threaded Comments (nested replies)

---

## 📊 PHASE BREAKDOWN

### **PHASE 1: Remove Legacy Features** (Week 1)
**Goal:** Clean slate - remove friends, public counts, complex privacy

**Backend Tasks:**
- Remove friend request routes & models
- Hide like counts from API responses
- Hide follower counts from user endpoints
- Simplify privacy to: Public, Followers, Private

**Frontend Tasks:**
- Remove Friends page
- Remove friend request UI
- Hide like/follower counts
- Update privacy selector (3 options only)

**Database:**
- Delete friend request documents
- Keep user/post data intact

**Testing:** Verify existing posts/users still work, no broken links

---

### **PHASE 2: Quiet Mode + Slow Feed** (Week 2)
**Goal:** Introduce calm UI and time-weighted feed

**Backend Tasks:**
- Add `quietMode` boolean to User schema
- Create time-weighted feed algorithm
- Add API toggle for Quiet Mode

**Frontend Tasks:**
- Design calm color palette
- Hide metrics conditionally (quietMode)
- Remove infinite scroll
- Add pagination with post age indicators
- Add Quiet Mode toggle in Settings

**Testing:** Verify feed loads correctly, pagination works, metrics hide properly

---

### **PHASE 3: Journaling + Longform Posts** (Week 3)
**Goal:** Add reflective content types

**Backend Tasks:**
- Add `postType` enum: standard, journal, longform, photoEssay
- Create journal entry endpoints (separate from main feed)
- Add rich text support for longform posts
- Remove character limits for longform type

**Frontend Tasks:**
- Build journal entry form with calm design
- Create rich text editor for longform posts
- Add "Journal" tab to user profiles
- Design reading-friendly longform layout

**Testing:** Verify journal posts separate from main feed, rich text saves correctly

---

### **PHASE 4: Community Tags + Discovery** (Week 4)
**Goal:** Tag-based discovery system

**Backend Tasks:**
- Create CommunityTag model
- Add `tags` array to Post schema
- Create tag filtering endpoints
- Add `featured` flag for admin curation
- Seed predefined tags

**Frontend Tasks:**
- Build tag picker UI
- Create "Explore by Tags" page
- Add clickable tag chips to posts
- Show featured posts section

**Predefined Tags:**
- #DeepThoughts
- #IntrovertsLounge
- #QueerLife
- #CreativeHub
- #Photography
- #MentalHealthCorner

**Testing:** Verify tag filtering, featured posts display, tag navigation

---

### **PHASE 5: Creator Pages + Photo Essays** (Week 5)
**Goal:** Portfolio-style profiles and visual storytelling

**Backend Tasks:**
- Add `isCreator`, `creatorBio`, `portfolio` to User schema
- Add `pinnedPosts` array to User schema
- Add `imageSet` with captions for photoEssay type
- Create pin/unpin endpoints

**Frontend Tasks:**
- Add "Enable Creator Mode" toggle in Settings
- Design portfolio-style profile layout
- Build pin/unpin UI for posts
- Create multi-image uploader with per-image captions
- Design gallery-style photo essay display

**Testing:** Verify creator profiles, pinned posts, photo essays render correctly

---

### **PHASE 6: Rebrand UI/UX Text** (Week 6)
**Goal:** Update all copy to reflect calm, creative values

**Tasks:**
- Update landing page: "A calm creative platform for LGBTQ+ introverts, deep thinkers & supportive allies"
- Update onboarding: Add ally toggle + guidelines
- Update navigation: Feed → Explore, Messages → Conversations
- Update prompts: "What's on your mind?" → "Share a thought..." / "What are you reflecting on?"
- Update buttons: "Share Post" → "Publish Reflection", "Like" → "Appreciate"
- Update empty states with calm, encouraging messages
- Add Settings sections: Quiet Mode, Creator Mode, Ally Mode
- Rewrite About/Help pages for new vision

**Testing:** Full UI audit, ensure all text reflects new brand

---

## 🗄️ DATABASE SCHEMA CHANGES

### **User Model Updates**
```javascript
// Add fields:
quietMode: Boolean (default: false)
isCreator: Boolean (default: false)
creatorBio: String
portfolio: [{ title, description, link }]
pinnedPosts: [ObjectId] (max 3)
isAlly: Boolean (default: false)

// Remove fields:
// (none - keep followers/following for internal use)
```

### **Post Model Updates**
```javascript
// Add fields:
postType: Enum ['standard', 'journal', 'longform', 'photoEssay']
tags: [String] (community tags)
featured: Boolean (default: false)
imageSet: [{ url, caption }] (for photoEssay)
richContent: String (for longform)

// Modify fields:
visibility: Enum ['public', 'followers', 'private'] // Remove 'custom'
```

### **New Models**
```javascript
// CommunityTag
{
  name: String (unique),
  slug: String,
  description: String,
  icon: String,
  postCount: Number,
  createdAt: Date
}
```

---

## 🔒 SECURITY CONSIDERATIONS

### **Keep All Existing Security:**
- ✅ 2FA (TOTP)
- ✅ Session/device tracking
- ✅ JWT + role-based auth
- ✅ Rate limiting
- ✅ Input sanitization
- ✅ File validation (Cloudinary)

### **New Security Needs:**
- Ally verification system (prevent abuse)
- Featured post moderation (admin only)
- Rich text sanitization (prevent XSS)

---

## 🧪 TESTING STRATEGY

### **After Each Phase:**
1. **Unit Tests:** Backend endpoints, data validation
2. **Integration Tests:** API → Database → Frontend
3. **Manual Testing:** UI/UX flows, edge cases
4. **User Acceptance:** Test with small group (if available)

### **Critical Test Cases:**
- Existing users can still log in
- Existing posts still display
- DMs still work after friends removal
- Privacy settings respected
- Quiet Mode toggles correctly
- Tags filter properly
- Creator profiles render
- Photo essays upload/display

---

## 📈 ROLLOUT STRATEGY

### **Option A: Phased Rollout (Recommended)**
- Deploy each phase to production sequentially
- Monitor for bugs between phases
- Gather user feedback
- Adjust next phase based on learnings

### **Option B: Staging Environment**
- Complete all 6 phases in staging
- Full QA testing
- Single production deployment
- Higher risk, but cleaner launch

**Recommendation:** Option A for lower risk

---

## 🚨 ROLLBACK PLAN

### **If Critical Issues Arise:**
1. **Database Backups:** Daily backups before each phase
2. **Git Branches:** Each phase in separate branch
3. **Feature Flags:** Toggle new features off if needed
4. **Rollback Procedure:**
   - Revert to previous Git commit
   - Restore database from backup
   - Clear Redis cache
   - Restart services

---

## 📞 NEXT STEPS

**Ready to begin?** Choose one:

1. **Start Phase 1 Now** - Begin removing legacy features
2. **Review Plan First** - Discuss any concerns or changes
3. **Create Backup** - Ensure database backup before starting

**Which would you like to do?**

