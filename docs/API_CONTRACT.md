# Pryde Social - API & Feature Contract

> **Generated**: 2026-01-19  
> **Audit Mode**: This document is based ONLY on implemented code, not planned features.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users & Profiles](#2-users--profiles)
3. [Posts & Feed](#3-posts--feed)
4. [Comments](#4-comments)
5. [Reactions](#5-reactions)
6. [Messages (DMs)](#6-messages-dms)
7. [Notifications](#7-notifications)
8. [Follow System](#8-follow-system)
9. [Groups](#9-groups)
10. [Events](#10-events)
11. [Bookmarks](#11-bookmarks)
12. [Search](#12-search)
13. [Badges](#13-badges)
14. [Privacy & Blocks](#14-privacy--blocks)
15. [Reports](#15-reports)
16. [Upload](#16-upload)
17. [Admin](#17-admin)
18. [Socket Events](#18-socket-events)
19. [Mismatch & Risk Notes](#19-mismatch--risk-notes)

---

## 1. Authentication

### Feature Overview
JWT-based authentication with httpOnly refresh token cookies. Supports email/password login, 2FA (TOTP), passkeys (WebAuthn), and session management.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | Public | Create new account |
| `/api/auth/login` | POST | Public | Login with email/password |
| `/api/auth/status` | GET | Required | Check auth status, get user data |
| `/api/auth/logout` | POST | Required | Logout current session |
| `/api/auth/logout-all` | POST | Required | Logout all sessions |
| `/api/auth/forgot-password` | POST | Public | Request password reset email |
| `/api/auth/reset-password` | POST | Public | Reset password with token |
| `/api/auth/change-password` | POST | Required | Change password (logged in) |
| `/api/auth/verify-email` | GET | Public | Verify email with token |
| `/api/auth/resend-verification` | POST | Required | Resend verification email |
| `/api/auth/deactivate` | POST | Required | Deactivate account |
| `/api/auth/reactivate` | POST | Public | Reactivate deactivated account |
| `/api/refresh` | POST | Cookie | Refresh access token |

**2FA Routes** (`/api/2fa`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/setup` | POST | Required | Generate 2FA secret & QR code |
| `/verify` | POST | Required | Verify and enable 2FA |
| `/disable` | POST | Required | Disable 2FA |
| `/validate` | POST | Public | Validate 2FA code during login |

**Passkey Routes** (`/api/passkey`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/register-start` | POST | Required | Start passkey registration |
| `/register-finish` | POST | Required | Complete passkey registration |
| `/login-start` | POST | Public | Start passkey login |
| `/login-finish` | POST | Public | Complete passkey login |
| `/list` | GET | Required | List user's passkeys |
| `/:credentialId` | DELETE | Required | Remove a passkey |

**Session Routes** (`/api/sessions`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/` | GET | Required | List active sessions |
| `/:sessionId` | DELETE | Required | Revoke specific session |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/context/AuthContext.jsx` | Central auth state, token refresh, cross-tab sync |
| `src/utils/api.js` | Axios client with CSRF, 401 refresh logic |
| `src/utils/apiClient.js` | Fetch-based client with deduplication |
| `src/utils/auth.js` | Token storage helpers |
| `src/pages/Login.jsx` | Login form |
| `src/pages/Register.jsx` | Registration form |
| `src/pages/ForgotPassword.jsx` | Password reset request |
| `src/pages/ResetPassword.jsx` | Password reset form |
| `src/pages/VerifyEmail.jsx` | Email verification |
| `src/pages/SecuritySettings.jsx` | 2FA and passkey management |

### Data Contract

**Login Request**:
```json
{ "email": "string", "password": "string", "twoFactorCode?": "string" }
```

**Login Response**:
```json
{
  "success": true,
  "accessToken": "string",
  "refreshToken": "string",
  "user": { "id", "username", "email", "displayName", "profilePhoto", "role", ... }
}
```

**Auth Status Response**:
```json
{
  "isAuthenticated": true,
  "user": { "id", "username", "email", "displayName", ... },
  "emailVerified": true
}
```

### Cross-Layer Mapping

| Frontend | Backend |
|----------|---------|
| `AuthContext.login()` | `POST /api/auth/login` |
| `AuthContext.logout()` | `POST /api/auth/logout` |
| `AuthContext.checkAuth()` | `GET /api/auth/status` |
| `api.post('/refresh')` | `POST /api/refresh` |

---

## 2. Users & Profiles

### Feature Overview
User profiles with display names, pronouns, bio, photos, social links, and privacy settings.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/users/me` | GET | Required | Get current user profile |
| `/api/users/me` | PUT | Required | Update current user profile |
| `/api/users/:id` | GET | Required | Get user by ID or username |
| `/api/users/search` | GET | Required | Search users by username/displayName |
| `/api/users/:id/followers` | GET | Required | Get user's followers |
| `/api/users/:id/following` | GET | Required | Get users they follow |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Profile.jsx` | Profile page |
| `src/features/profile/ProfileController.jsx` | Profile orchestration |
| `src/features/profile/ProfileHeader.jsx` | Profile header display |
| `src/components/EditProfileModal.jsx` | Profile editing |
| `src/pages/Followers.jsx` | Followers list |
| `src/pages/Following.jsx` | Following list |

### Data Contract

**User Object**:
```json
{
  "_id": "string",
  "username": "string",
  "displayName": "string",
  "nickname": "string",
  "pronouns": "string",
  "bio": "string",
  "profilePhoto": "string",
  "coverPhoto": "string",
  "location": "string",
  "website": "string",
  "socialLinks": { "twitter": "", "instagram": "", ... },
  "isVerified": false,
  "badges": ["badge_id_1", "badge_id_2"],
  "followersCount": 0,
  "followingCount": 0,
  "isPrivate": false
}
```

---

## 3. Posts & Feed

### Feature Overview
Posts with text, media (images/videos/GIFs), polls, content warnings, and visibility controls. Separate global feed and following feed.

### Backend Implementation

**Posts Routes** (`/api/posts`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/` | GET | Required | Get posts (paginated, excludes group posts) |
| `/` | POST | Required | Create new post |
| `/:id` | GET | Required | Get single post |
| `/:id` | PUT | Required | Update post (author only) |
| `/:id` | DELETE | Required | Delete post (author only) |
| `/:id/pin` | POST | Required | Pin post to profile |
| `/:id/unpin` | POST | Required | Unpin post |
| `/user/:userId` | GET | Required | Get user's posts |

**Feed Routes** (`/api/feed`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/global` | GET | Required | Global feed (public posts) |
| `/following` | GET | Required | Following feed (posts from followed users) |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Feed.jsx` | Main feed page |
| `src/features/feed/FeedController.jsx` | Feed orchestration |
| `src/features/feed/FeedStream.jsx` | Post stream display |
| `src/pages/FollowingFeed.jsx` | Following-only feed |
| `src/components/PostHeader.jsx` | Post header with author info |
| `src/components/Poll.jsx` | Poll display/voting |

### Data Contract

**Post Object**:
```json
{
  "_id": "string",
  "author": { "_id", "username", "displayName", "profilePhoto" },
  "content": "string",
  "media": [{ "url": "string", "type": "image|video" }],
  "visibility": "public|followers|private",
  "reactions": { "❤️": 5, "😂": 3 },
  "commentCount": 0,
  "groupId": null,
  "createdAt": "ISO date"
}
```

---

## 4. Comments

### Feature Overview
Threaded comments on posts with nested replies and reactions.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/posts/:postId/comments` | GET | Required | Get comments for post |
| `/api/posts/:postId/comments` | POST | Required | Add comment to post |
| `/api/comments/:commentId` | PUT | Required | Edit comment |
| `/api/comments/:commentId` | DELETE | Required | Delete comment |
| `/api/comments/:commentId/replies` | GET | Required | Get replies to comment |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/components/CommentThread.jsx` | Comment display with threading |

---

## 5. Reactions

### Feature Overview
Universal emoji reaction system for posts and comments.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/reactions` | POST | Required | Add/update/remove reaction |
| `/api/reactions/:targetType/:targetId` | GET | Optional | Get reactions for target |

**Approved Reactions**: `❤️`, `😂`, `😮`, `😢`, `😡`, `👍`, `👎`, `🔥`, `💯`, `🎉`

### Frontend Integration

| File | Usage |
|------|-------|
| `src/components/ReactionButton.jsx` | Reaction picker/display |
| `src/components/ReactionDetailsModal.jsx` | Who reacted modal |

---

## 6. Messages (DMs)

### Feature Overview
Real-time direct messaging with encryption at rest, typing indicators, and read receipts.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/messages/list` | GET | Required | Get conversation list |
| `/api/messages/conversation/:userId` | GET | Required | Get messages with user |
| `/api/messages/unread/counts` | GET | Required | Get unread message counts |
| `/api/messages/:messageId/read` | PUT | Required | Mark message as read |

**Socket Events**: `send_message`, `message:new`, `message:sent`, `typing`, `user_typing`

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Messages.jsx` | Messages page |
| `src/features/messages/MessagesController.jsx` | Message orchestration |
| `src/features/messages/ConversationList.jsx` | Conversation sidebar |
| `src/features/messages/MessageThread.jsx` | Message display |
| `src/hooks/useUnreadMessages.js` | Unread count singleton |
| `src/utils/socket.js` | Socket.IO client |

---

## 7. Notifications

### Feature Overview
Real-time notifications for social interactions. Separated into SOCIAL (bell icon) and MESSAGE (messages badge) types.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/notifications` | GET | Required | Get notifications (supports `category` filter) |
| `/api/notifications/unread-count` | GET | Required | Get unread notification count |
| `/api/notifications/:id/read` | PUT | Required | Mark notification as read |
| `/api/notifications/read-all` | PUT | Required | Mark all as read |

**Socket Events**: `notification:new`, `notification:read`

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Notifications.jsx` | Notifications page |
| `src/components/Navbar.jsx` | Bell icon with unread count |
| `src/constants/notificationTypes.js` | Type definitions |

---

## 8. Follow System

### Feature Overview
Follow/unfollow users with support for private accounts (follow requests).

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/follow/:userId` | POST | Required | Follow user (or send request if private) |
| `/api/follow/:userId` | DELETE | Required | Unfollow user |
| `/api/follow/requests` | GET | Required | Get pending follow requests |
| `/api/follow/requests/:requestId/accept` | POST | Required | Accept follow request |
| `/api/follow/requests/:requestId/reject` | POST | Required | Reject follow request |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Profile.jsx` | Follow button on profiles |
| `src/pages/Followers.jsx` | Followers list |
| `src/pages/Following.jsx` | Following list |

---

## 9. Groups

### Feature Overview
Community groups with posts, membership, moderation, and notification settings.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/groups` | GET | Required | List groups |
| `/api/groups` | POST | Required | Create group |
| `/api/groups/:id` | GET | Required | Get group details |
| `/api/groups/:id` | PUT | Required | Update group (admin only) |
| `/api/groups/:id` | DELETE | Required | Delete group (owner only) |
| `/api/groups/:id/join` | POST | Required | Join group |
| `/api/groups/:id/leave` | POST | Required | Leave group |
| `/api/groups/:id/posts` | GET | Required | Get group posts |
| `/api/groups/:id/posts` | POST | Required | Create post in group |
| `/api/groups/:id/members` | GET | Required | Get group members |
| `/api/groups/:id/notification-settings` | GET/PUT | Required | Notification preferences |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Groups.jsx` | Group detail page |
| `src/pages/GroupsList.jsx` | Groups listing |
| `src/features/groups/GroupDetailController.jsx` | Group orchestration |
| `src/features/groups/GroupFeed.jsx` | Group post feed |
| `src/features/groups/GroupHeader.jsx` | Group header |

---

## 10. Events

### Feature Overview
Calendar events with RSVP functionality.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/events` | GET | Required | List events (supports filters) |
| `/api/events` | POST | Required | Create event |
| `/api/events/:id` | GET | Required | Get event details |
| `/api/events/:id` | PUT | Required | Update event |
| `/api/events/:id` | DELETE | Required | Delete event |
| `/api/events/:id/rsvp` | POST | Required | RSVP to event |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Events.jsx` | Events calendar page |

---

## 11. Bookmarks

### Feature Overview
Save posts for later viewing.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/bookmarks` | GET | Required | Get bookmarked posts |
| `/api/bookmarks/:postId` | POST | Required | Bookmark a post |
| `/api/bookmarks/:postId` | DELETE | Required | Remove bookmark |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Bookmarks.jsx` | Bookmarks page |

---

## 12. Search

### Feature Overview
Global search for users and posts. Message search within DMs.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/search` | GET | Required | Search users and posts |
| `/api/search/messages` | GET | Required | Search within DMs |
| `/api/search/my-posts` | GET | Required | Search own posts/journals/longforms |
| `/api/search/hashtag/:tag` | GET | Required | **DEPRECATED** (returns 410) |
| `/api/search/trending` | GET | Required | **DEPRECATED** (returns 410) |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Search.jsx` | Search page |
| `src/components/ProfilePostSearch.jsx` | Profile post search |

---

## 13. Badges

### Feature Overview
User badges (automatic and manual) displayed on profiles.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/badges` | GET | Required | List all badge definitions |
| `/api/badges/explain` | GET | Public | Badge system explanation |
| `/api/badges/user/:userId` | GET | Required | Get user's badges |
| `/api/badges/assign` | POST | Admin | Assign badge to user |
| `/api/badges/revoke` | POST | Admin | Revoke badge from user |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/hooks/useBadges.js` | Badge fetching/caching |
| `src/components/TieredBadgeDisplay.jsx` | Badge display component |

---

## 14. Privacy & Blocks

### Feature Overview
Privacy settings and user blocking.

### Backend Implementation

**Privacy Routes** (`/api/privacy`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/settings` | GET | Required | Get privacy settings |
| `/settings` | PATCH | Required | Update privacy settings |
| `/blocked-users` | GET | Required | Get blocked users list |
| `/block` | POST | Required | Block a user |
| `/block/:userId` | DELETE | Required | Unblock a user |

**Blocks Routes** (`/api/blocks`):
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/` | GET | Required | Get blocked users |
| `/` | POST | Required | Block a user |
| `/check/:identifier` | GET | Required | Check if user is blocked |
| `/:userId` | DELETE | Required | Unblock a user |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/PrivacySettings.jsx` | Privacy settings page |

### Data Contract

**Privacy Settings**:
```json
{
  "profileVisibility": "public|followers",
  "whoCanMessage": "everyone|followers|none",
  "quietModeEnabled": false,
  "hideBadges": false,
  "defaultPostVisibility": "public|followers"
}
```

---

## 15. Reports

### Feature Overview
Report users, posts, comments, or messages for moderation.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/reports` | POST | Required | Submit a report |
| `/api/reports/my-reports` | GET | Required | Get user's submitted reports |
| `/api/reports/:id` | GET | Required | Get report details |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/components/ReportModal.jsx` | Report submission modal |

---

## 16. Upload

### Feature Overview
File uploads for images, videos, and audio. Uses GridFS for storage.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/upload` | POST | Required | Upload single file |
| `/api/upload/multiple` | POST | Required | Upload multiple files |
| `/api/upload/file/:filename` | GET | Public | Serve uploaded file |
| `/api/upload/voice` | POST | Required | Upload voice note |

**Limits**: 10MB per file, allowed types: JPEG, PNG, GIF, WebP, MP4, WebM, MP3, WAV

### Frontend Integration

| File | Usage |
|------|-------|
| `src/utils/uploadWithProgress.js` | Upload with progress tracking |
| `src/utils/compressImage.js` | Client-side image compression |

---

## 17. Admin

### Feature Overview
Admin dashboard for platform management, user moderation, and analytics.

### Backend Implementation

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/admin/stats` | GET | Admin | Platform statistics |
| `/api/admin/users` | GET | Admin | List users with filters |
| `/api/admin/users/:id` | GET | Admin | Get user details |
| `/api/admin/users/:id/suspend` | POST | Admin | Suspend user |
| `/api/admin/users/:id/unsuspend` | POST | Admin | Unsuspend user |
| `/api/admin/users/:id/ban` | POST | Admin | Ban user |
| `/api/admin/users/:id/unban` | POST | Admin | Unban user |
| `/api/admin/reports` | GET | Admin | Get pending reports |
| `/api/admin/reports/:id/resolve` | POST | Admin | Resolve report |

### Frontend Integration

| File | Usage |
|------|-------|
| `src/pages/Admin.jsx` | Admin dashboard |

---

## 18. Socket Events

### Feature Overview
Real-time communication via Socket.IO for messages, notifications, presence, and typing indicators.

### Connection

**URL**: `wss://pryde-backend.onrender.com` (or `VITE_SOCKET_URL`)

**Authentication**: JWT token in `auth.token` handshake parameter

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ room: "user_{userId}" }` | Join personal room |
| `send_message` | `{ recipientId, content, voiceNote?, contentWarning?, _tempId }` | Send DM |
| `typing` | `{ recipientId, isTyping, userId }` | Typing indicator |
| `get_online_users` | `{}` | Request online users list |
| `ping` | `{}` | Connection health check |
| `echo` | `any` | Debug echo test |
| `debug:rooms` | `{}` | Get socket room info |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:joined` | `{ room, userId, socketId }` | Room join confirmation |
| `message:new` | `{ message object }` | New message received |
| `message:sent` | `{ message object }` | Sent message confirmation |
| `user_typing` | `{ userId, isTyping }` | User typing indicator |
| `online_users` | `[userId1, userId2, ...]` | List of online users |
| `presence:update` | `{ userId, online }` | User online/offline |
| `notification:new` | `{ notification object }` | New notification |
| `notification:read` | `{ notificationId }` | Notification marked read |
| `pong` | `{ status, userId, timestamp }` | Ping response |
| `auth_error` | `{ message }` | Authentication failed |
| `reaction_added` | `{ targetType, targetId, reactions, userId }` | Reaction added |
| `reaction_removed` | `{ targetType, targetId, reactions, userId }` | Reaction removed |

### Frontend Socket Client

**File**: `src/utils/socket.js`

**Features**:
- Zombie connection detection (auto-reconnect after 2 missed pings)
- Pre-flight ping test before sending messages
- Message queue for offline/reconnecting states
- Health monitoring with `timeSinceLastPong`

---

## 19. Mismatch & Risk Notes

### Backend Routes Without Clear Frontend Usage

| Route | Notes |
|-------|-------|
| `/api/journals/*` | Journal feature exists but may have limited UI |
| `/api/longform/*` | Longform posts feature exists but may have limited UI |
| `/api/photo-essays/*` | Photo essays feature exists but may have limited UI |
| `/api/circles/*` | Small Circles feature (Life-Signal) |
| `/api/resonance/*` | Resonance Signals feature (Life-Signal) |
| `/api/prompts/*` | Reflection Prompts feature (Life-Signal) |
| `/api/collections/*` | Personal Collections feature (Life-Signal) |
| `/api/presence/*` | Soft Presence States feature (Life-Signal) |
| `/api/global-chat/*` | Global chat (Lounge) feature |
| `/api/groupchats/*` | Group chat feature |
| `/api/friends/*` | Legacy friends system (kept for backward compatibility) |

### Deprecated Endpoints (Return 410 Gone)

| Route | Removed Date | Notes |
|-------|--------------|-------|
| `/api/search/hashtag/:tag` | 2025-12-26 | Hashtag search removed |
| `/api/search/trending` | 2025-12-26 | Trending hashtags removed |
| `/api/tags/*` | Phase 2B | Tags deprecated, replaced by Groups |

### Field Naming Consistency

| Context | Backend Field | Frontend Field | Status |
|---------|---------------|----------------|--------|
| User ID | `_id` | `id` or `_id` | ⚠️ Mixed usage |
| Author | `author` | `author` | ✅ Consistent |
| Reactions | `reactions` (object) | `reactions` (object) | ✅ Consistent |
| Timestamps | `createdAt`, `updatedAt` | Same | ✅ Consistent |

### Auth/Permission Notes

| Middleware | Description |
|------------|-------------|
| `auth` | Requires valid JWT token |
| `requireActiveUser` | Requires `isActive: true` |
| `requireEmailVerification` | Requires verified email |
| `adminAuth` | Requires admin role |
| `checkPermission(perm)` | Requires specific admin permission |

### Rate Limiters

| Limiter | Applied To |
|---------|------------|
| `globalLimiter` | All requests |
| `loginLimiter` | `/api/auth/login` |
| `signupLimiter` | `/api/auth/register` |
| `postLimiter` | Post creation |
| `messageLimiter` | Message sending |
| `commentLimiter` | Comment creation |
| `searchLimiter` | Search endpoints |
| `reactionLimiter` | Reaction endpoints |
| `uploadLimiter` | File uploads |
| `reportLimiter` | Report submission |

### Known Issues / Risks

1. **Zombie Socket Connections**: Fixed with ping-based detection and auto-reconnect
2. **Message Encryption**: Messages encrypted at rest, decrypted on read
3. **Group Post Isolation**: Group posts (`groupId !== null`) excluded from global feeds
4. **Private Account Handling**: Follow requests required for private accounts
5. **CSRF Protection**: All state-changing requests require `X-XSRF-TOKEN` header

---

## Appendix: Route Mounting Summary

```javascript
// server/server.js route mounting (lines 423-485)
app.use('/api/auth', authRoutes);
app.use('/api/refresh', refreshRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/friends', friendsRoutes);  // Legacy
app.use('/api/follow', followRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/journals', journalsRoutes);
app.use('/api/longform', longformRoutes);
app.use('/api/tags', tagsRoutes);  // Deprecated
app.use('/api/groups', groupsRoutes);
app.use('/api/photo-essays', photoEssaysRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/groupchats', groupChatsRoutes);
app.use('/api/global-chat', globalChatRoutes);
app.use('/api/push', pushNotificationsRouter);
app.use('/api/reports', reportsRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api', commentsRoutes);  // Handles /posts/:postId/comments
app.use('/api/reactions', reactionsRoutes);
app.use('/api/passkey', passkeyRoutes);
app.use('/api/badges', badgesRoutes);
// Life-Signal Features
app.use('/api/prompts', promptsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/resonance', resonanceRoutes);
app.use('/api/circles', circlesRoutes);
app.use('/api/presence', presenceRoutes);
```
## Domain: User / Authentication

### Guarantees
- Passwords are always bcrypt-hashed before persistence
- comparePassword() provides authoritative credential checking
- Login attempts are counted and lockoutUntil is set when thresholds are hit
- toJSON() removes sensitive fields before public use
- Schema defaults ensure declared fields exist after persistence
- The exported User model always includes instance methods

### Non-Guarantees / Unsafe Assumptions
- Login attempt tracking is NOT race-free
- Lockout enforcement is NOT atomic under concurrency
- bcrypt rounds are hard-coded and not environment-aware
- No format or strength validation is enforced at schema level
- Usernames are NOT guaranteed unique
- pre-save hooks are NOT guarded against bcrypt failures
- Raw Mongoose documents may still expose sensitive fields

---

*End of API Contract Document*
