# PRYDE SOCIAL REFACTOR - TECHNICAL SPECIFICATION

## GOAL
Refactor Pryde into:
- A calm, queer-first creative platform for LGBTQ+ introverts, deep thinkers, and supportive allies
- With slow feed, journaling, longform posts, community tags, creator pages, and quiet-mode UX
- While preserving existing users and posts, but removing legacy "Facebook/Twitter clone" features

## GLOBAL CONSTRAINTS
- Keep existing users and posts
- Remove friend relationships, public like counts, public follower counts, group chats, and stories
- Keep 1-on-1 direct messages
- Keep follow/unfollow mechanism but hide counts
- Keep security features (2FA, JWT, roles, rate-limiting, sanitization, file validation)
- Pryde remains LGBTQ+ first, with optional respectful allies

---

## PHASE 1: REMOVE OLD FEATURES (FRIENDS, STORIES, GROUP CHATS, PUBLIC COUNTS)

### GOAL
Safely remove the old social graph and attention-driven features without breaking auth, posts, or DMs.

### TASKS

#### [DB / SCHEMA]
- Add migration to:
  - Drop or soft-deprecate FRIENDS table / friend relationships (or mark as legacy)
  - Drop GROUP_CHAT, GROUP_MESSAGES, STORIES, and any related tables
  - Add columns to POSTS or a related table for:
    - is_public_like_count_visible (default false)
  - Preserve internal like counts, but remove any fields used only for public display
  - Preserve FOLLOWERS table but:
    - Add flags for: show_follower_count (default false)
- Ensure foreign keys and constraints referencing friends, groups, stories are either removed or updated.

#### [BACKEND / API]
- Remove or deprecate endpoints:
  - /api/friends/*  (friend request, accept, decline, list friends, etc.)
  - /api/groups/*   (group chats, group feed)
  - /api/stories/*  (short-lived story content)
- Update like endpoints:
  - Keep POST /api/posts/:id/like and /unlike
  - Remove any response fields that include public like counts
- Update follow endpoints:
  - Keep POST /api/users/:id/follow and /unfollow
  - Do NOT return follower counts in any response
- Remove any websocket events tied to:
  - friend online/offline
  - group chat messages
  - stories
- Keep 1-on-1 DM endpoints and events intact.

#### [FRONTEND / UI]
- Remove:
  - Friends tab, friends list UI, and "Add Friend" buttons
  - Stories UI (story carousels, story bubbles, story upload components)
  - Group chat UI (group conversation list, group chat windows)
  - Public follower count display on profile, posts, or anywhere in the UI
  - Public like counts under posts (replace with subtle "Liked" state if needed)
- Ensure:
  - Profile pages no longer show "X Friends", "X Followers", "X Following"
  - Navigation no longer links to friends, groups, or stories

#### [MIGRATION / CLEANUP]
- Add a background task or script to:
  - Archive legacy tables (friends, groups, stories) if necessary
  - Log counts of records removed/archived for debugging

#### [ACCEPTANCE CRITERIA]
- App boots with no reference to friends, group chats, or stories in UI or API.
- Existing users can still:
  - Log in
  - Post
  - Comment
  - DM 1-on-1
- No page shows public like counts or follower counts.
- No client or server errors referencing removed features.

---

## PHASE 2: QUIET MODE + SLOW FEED

### GOAL
Introduce a calm UX and a slow, non-hyperactive feed.

### TASKS

#### [DB / SCHEMA]
- Add to USERS table:
  - quiet_mode_enabled (boolean, default false)
- Add to POSTS table:
  - promoted_until (nullable datetime) for temporary "featured/slow weighting"
  - created_at index optimized for chronological queries

#### [BACKEND / FEED LOGIC]
- Implement two feed endpoints:
  - GET /api/feed/global
    - Returns public posts in reverse chronological order with optional "slow weighting":
      - Primary sort: created_at DESC
      - Secondary: lightly boosted if promoted_until >= now
  - GET /api/feed/following
    - Returns posts only from users the current user follows
    - Same slow sorting logic
- Add optional query params:
  - ?tag=tagName (filter by Community Tag once Phase 4 is done)
  - ?before=timestamp (pagination)
- No algorithmic ranking for engagement; only time + optional manual promotion.

#### [BACKEND / USER SETTINGS]
- Endpoint:
  - PATCH /api/users/me/settings
    - Accepts quiet_mode_enabled toggle
- Include quiet_mode_enabled in /api/users/me response.

#### [FRONTEND / UI: QUIET MODE]
- Add a toggle in user settings:
  - "Quiet Mode" (with description: hide numbers, soften UI, reduce noise)
- When quiet_mode_enabled:
  - Hide:
    - like indicators
    - follower/following counts (already removed publicly; hide any remaining hints)
  - Use softer, less saturated theme variables (keep this simple: add a quiet CSS class/variant)
  - Reduce visual emphasis on notifications
- Ensure quiet mode is stored in user profile, not local-only.

#### [FRONTEND / UI: FEED]
- Implement:
  - Global feed page:
    - Uses /api/feed/global
    - Infinite or paginated scroll, but visually slow (larger posts, more whitespace)
  - Following feed page:
    - Uses /api/feed/following
- Provide top-level navigation:
  - "Global"
  - "Following"
- De-emphasize rapid scrolling and reaction buttons.

#### [ACCEPTANCE CRITERIA]
- User can enable Quiet Mode and see:
  - softer visual treatment
  - fewer visible metrics
- Global and Following feed endpoints work and are consumed by frontend.
- Feeds show posts in chronological order (with room for manual promotion later).
- No engagement-based feed logic is used.

---

## PHASE 3: JOURNALING + LONGFORM POSTS

### GOAL
Add personal journaling and longform creative posts so Pryde becomes a reflection/creative hub.

### TASKS

#### [DB / SCHEMA]
- Create JOURNALS table:
  - id
  - user_id (FK to USERS)
  - title (nullable, shorter text)
  - body (long text)
  - visibility: ENUM("public", "followers", "private")
  - created_at, updated_at
- Create LONGFORM_POSTS table (if not reusing POSTS):
  - id
  - user_id (FK)
  - title
  - body (long text / markdown)
  - cover_image (nullable)
  - visibility: ENUM("public", "followers", "private")
  - created_at, updated_at
- Alternatively: if reusing POSTS:
  - Add type ENUM("short", "journal", "longform")
  - Add body_long (for larger text)
  - For now, use separate JOURNALS and LONGFORM_POSTS tables (simpler mental model).

#### [BACKEND / API]
- Endpoints for journals:
  - POST /api/journals
  - GET /api/journals/me
  - GET /api/journals/user/:userId (respecting visibility)
  - PATCH /api/journals/:id
  - DELETE /api/journals/:id
- Endpoints for longform:
  - POST /api/longform
  - GET /api/longform/:id
  - GET /api/longform/user/:userId (respecting visibility)
  - PATCH /api/longform/:id
  - DELETE /api/longform/:id
- Add visibility enforcement middleware:
  - public: visible to everyone
  - followers: only followers
  - private: only owner

#### [FRONTEND / UI]
- Profile changes:
  - Add tabs:
    - Posts
    - Journal
    - Longform
- Journaling UI:
  - Simple text editor (title optional, body required)
  - Visibility dropdown: Public / Followers / Private
  - List user's journal entries with date and preview
- Longform UI:
  - Slightly richer editor:
    - Title
    - Body
    - Optional cover image
  - Visibility dropdown
  - Longform detail page with pleasant reading layout

#### [FEED INTEGRATION]
- Optionally:
  - Show public journal/longform entries in global/following feed with a distinct card style.
  - Mark them as "Journal Entry" or "Longform Story".

#### [ACCEPTANCE CRITERIA]
- User can:
  - Create, edit, delete journal entries with different visibility settings.
  - Create, view, and edit longform posts.
- Profile shows separate tabs for posts, journal, longform.
- Visibility rules respected for both journal and longform.

---

## PHASE 4: COMMUNITY TAGS + DISCOVERY

### GOAL
Replace groups and heavy social graph with gentle, tag-based discovery and browsing.

### TASKS

#### [DB / SCHEMA]
- Create TAGS table:
  - id
  - slug (unique, lowercase, e.g. "deepthoughts")
  - label (e.g. "Deep Thoughts")
  - description (optional)
- Create POST_TAGS table:
  - id
  - post_id
  - tag_id
- Optionally allow tags for journal/longform later (JOURNAL_TAGS, LONGFORM_TAGS).

#### [BACKEND / API]
- Endpoints:
  - GET /api/tags (list all visible tags)
  - GET /api/tags/:slug (returns tag details + metadata)
  - GET /api/tags/:slug/posts
    - Returns posts with that tag, sorted by created_at DESC
- Update post creation/edit endpoints:
  - Accept tags: [tagSlugs]
  - Create missing tags (if allowed) or restrict to predefined list
- Optionally:
  - GET /api/discovery/featured
    - Returns a curated list of:
      - featured posts
      - featured tags
      - featured creators

#### [FRONTEND / UI]
- On post creation/edit:
  - Add tag selector:
    - Multi-select dropdown or simple chips input
    - Suggested tags: #DeepThoughts, #IntrovertsLounge, #QueerLife, #CreativeHub, #Photography, #MentalHealthCorner
- Add "Community" or "Discover" page:
  - Lists core tags with descriptions
  - For each tag:
    - Link to tag feed page
- Tag feed pages:
  - /tags/:slug
  - Show posts with that tag in slow, chronological order
- Integrate tags into profile:
  - Show which tags a user posts in most frequently (optional, if easy).

#### [ACCEPTANCE CRITERIA]
- Users can tag their posts.
- Tags display on post cards.
- Clicking a tag navigates to a tag-specific feed.
- "Discover/Community" page shows key tags and provides navigation to them.

---

## PHASE 5: CREATOR PAGES + PHOTO ESSAYS

### GOAL
Make Pryde appealing to creators by giving them dedicated spaces and rich visual posts.

### TASKS

#### [DB / SCHEMA]
- Extend USERS table with creator fields:
  - is_creator (boolean, default false)
  - creator_tagline (short text)
  - creator_bio (longer text)
  - featured_post_ids (JSON array or separate FEATURED_POSTS table)
- Add PHOTO_ESSAYS table (or reuse POSTS with photo_essay flag):
  - id
  - user_id
  - title
  - description
  - visibility: ENUM("public", "followers", "private")
  - created_at, updated_at
- Add PHOTO_ESSAY_IMAGES table:
  - id
  - photo_essay_id
  - image_url
  - caption
  - sort_order

#### [BACKEND / API]
- Endpoints:
  - PATCH /api/users/me/creator
    - Set is_creator, creator_tagline, creator_bio, featured_post_ids
  - GET /api/creators/:userId
    - Return expanded profile info and featured content
- Photo Essays:
  - POST /api/photo-essays
  - GET /api/photo-essays/:id
  - GET /api/photo-essays/user/:userId
  - PATCH /api/photo-essays/:id
  - DELETE /api/photo-essays/:id

#### [FRONTEND / UI]
- Creator Profile:
  - Special layout when is_creator = true:
    - Banner area
    - Creator tagline and bio
    - Featured posts section
    - Tabs:
      - Posts
      - Journal
      - Longform
      - Photo Essays
- Photo Essay Creation:
  - UI to:
    - Add a title and description
    - Upload multiple images
    - Add caption per image
    - Drag to reorder images
  - Display them with:
    - vertical or gallery layout
    - captions under each image

#### [ACCEPTANCE CRITERIA]
- User can enable "creator mode" and customize tagline/bio.
- Creator profiles show featured posts and special layout.
- Users can create and view photo essays with multiple images and captions.
- Photo essays appear correctly on creator profiles.

---

## PHASE 6: REBRAND UI/UX TEXT + ALLY ONBOARDING

### GOAL
Align all language and onboarding with the calm, queer-first, introvert-friendly brand and add ally options.

### TASKS

#### [DB / SCHEMA]
- Extend USERS table:
  - identity_type ENUM("lgbtq", "ally") or:
    - is_ally (boolean, default false)
- Optionally:
  - onboarding_completed (boolean, default false)

#### [BACKEND / API]
- On signup:
  - Require user to select:
    - "I am LGBTQ+"
    - "I am a respectful ally"
  - Store identity_type or is_ally accordingly.
- Add endpoint:
  - GET /api/meta/brand-copy
    - (optional) return static text/snippets for frontend

#### [FRONTEND / ONBOARDING]
- New onboarding step:
  - Copy:
    - "Pryde is a calm, queer-first creative platform for LGBTQ+ introverts, deep thinkers, and supportive allies."
  - Question:
    - "How do you identify on Pryde?"
      - Option 1: "I am LGBTQ+"
      - Option 2: "I am an ally and agree to respect queer spaces"
  - If ally is selected:
    - Show a short "Ally Guidelines" modal (no harassment, no queerphobia, respect boundaries).
- Update all main UI text:
  - Remove references to "social media", "friends", "timeline"
  - Replace with:
    - "Home", "Community", "Journal", "Stories" (for longform), "Creators"
  - Emphasize:
    - calm
    - creative
    - reflective
    - safe
    - queer-first

#### [MARKETING COPY (BASIC)]
- Add tagline on landing page:
  - "A calm, queer-first creative platform for deep thinkers, introverts, and supportive allies."
- Short feature sections:
  - "Slow, meaningful feed"
  - "Journaling & longform stories"
  - "Creator pages for quiet, powerful voices"
  - "Built for LGBTQ+ safety and depth"

#### [ACCEPTANCE CRITERIA]
- New users go through updated onboarding and select LGBTQ+ vs Ally.
- UI copy reflects:
  - calm, creative, queer-first identity
- No leftover references to "friend requests", "stories" as 24h content, or "traditional social network" patterns.
- Existing users can set or update their identity (LGBTQ+ vs Ally) via settings.

---

## FINAL CHECKLIST BEFORE DEPLOY

- Run full automated tests and basic manual test pass for:
  - Auth, roles, 2FA
  - Posting, commenting, DMs
  - Journals, longform, tags, feeds
  - Quiet mode toggle
  - Creator mode, photo essays
  - Onboarding flow, LGBTQ+/Ally logic
- Verify no API endpoints reference removed features.
- Ensure no UI element leaks follower counts or like counts.
- Validate that slow feed, tags, and discovery are functional and stable.

---

**END TECHNICAL SPECIFICATION**

