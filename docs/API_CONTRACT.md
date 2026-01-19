# Pryde Social - API & Feature Contract

> **Generated**: 2026-01-19
> **Audit Mode**: This document is based ONLY on implemented code, not planned features.

## Repository Roots

| Label | Path |
|-------|------|
| **Backend** | `F:\Desktop\pryde-backend\` |
| **Frontend** | `F:\Desktop\pryde-frontend\` |

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

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\auth.js` | Main auth routes |
| `F:\Desktop\pryde-backend\server\routes\twoFactor.js` | 2FA routes |
| `F:\Desktop\pryde-backend\server\routes\passkey.js` | WebAuthn passkey routes |
| `F:\Desktop\pryde-backend\server\routes\sessions.js` | Session management |
| `F:\Desktop\pryde-backend\server\routes\refresh.js` | Token refresh |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\User.js` | User schema with auth fields |
| `F:\Desktop\pryde-backend\server\models\SecurityLog.js` | Security event logging |

**Middleware (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\middleware\auth.js` | JWT verification |
| `F:\Desktop\pryde-backend\server\middleware\csrf.js` | CSRF protection |
| `F:\Desktop\pryde-backend\server\middleware\rateLimiter.js` | Rate limiting |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\tokenUtils.js` | Token generation/validation |
| `F:\Desktop\pryde-backend\server\utils\cookieUtils.js` | Cookie handling |
| `F:\Desktop\pryde-backend\server\utils\passkeyUtils.js` | WebAuthn utilities |
| `F:\Desktop\pryde-backend\server\utils\emailService.js` | Email sending |

**Routes**:
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

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\context\AuthContext.jsx` | Central auth state, token refresh, cross-tab sync |
| `F:\Desktop\pryde-frontend\src\utils\api.js` | Axios client with CSRF, 401 refresh logic |
| `F:\Desktop\pryde-frontend\src\utils\apiClient.js` | Fetch-based client with deduplication |
| `F:\Desktop\pryde-frontend\src\utils\auth.js` | Token storage helpers |
| `F:\Desktop\pryde-frontend\src\utils\authBootstrap.js` | Auth initialization |
| `F:\Desktop\pryde-frontend\src\utils\authLifecycle.js` | Auth state lifecycle |
| `F:\Desktop\pryde-frontend\src\pages\Login.jsx` | Login form |
| `F:\Desktop\pryde-frontend\src\pages\Register.jsx` | Registration form |
| `F:\Desktop\pryde-frontend\src\pages\ForgotPassword.jsx` | Password reset request |
| `F:\Desktop\pryde-frontend\src\pages\ResetPassword.jsx` | Password reset form |
| `F:\Desktop\pryde-frontend\src\pages\VerifyEmail.jsx` | Email verification |
| `F:\Desktop\pryde-frontend\src\pages\SecuritySettings.jsx` | 2FA and passkey management |
| `F:\Desktop\pryde-frontend\src\components\PasskeyLogin.jsx` | Passkey login UI |
| `F:\Desktop\pryde-frontend\src\components\PasskeyManager.jsx` | Passkey management UI |
| `F:\Desktop\pryde-frontend\src\components\PasskeySetup.jsx` | Passkey setup UI |
| `F:\Desktop\pryde-frontend\src\components\security\TwoFactorSetup.jsx` | 2FA setup UI |
| `F:\Desktop\pryde-frontend\src\components\security\SessionManagement.jsx` | Session management UI |

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

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\context\AuthContext.jsx` | `F:\Desktop\pryde-backend\server\routes\auth.js` | `POST /api/auth/login` |
| `F:\Desktop\pryde-frontend\src\context\AuthContext.jsx` | `F:\Desktop\pryde-backend\server\routes\auth.js` | `POST /api/auth/logout` |
| `F:\Desktop\pryde-frontend\src\context\AuthContext.jsx` | `F:\Desktop\pryde-backend\server\routes\auth.js` | `GET /api/auth/status` |
| `F:\Desktop\pryde-frontend\src\utils\api.js` | `F:\Desktop\pryde-backend\server\routes\refresh.js` | `POST /api/refresh` |
| `F:\Desktop\pryde-frontend\src\components\security\TwoFactorSetup.jsx` | `F:\Desktop\pryde-backend\server\routes\twoFactor.js` | `/api/2fa/*` |
| `F:\Desktop\pryde-frontend\src\components\PasskeyManager.jsx` | `F:\Desktop\pryde-backend\server\routes\passkey.js` | `/api/passkey/*` |
| `F:\Desktop\pryde-frontend\src\components\security\SessionManagement.jsx` | `F:\Desktop\pryde-backend\server\routes\sessions.js` | `/api/sessions/*` |

---

## 2. Users & Profiles

### Feature Overview
User profiles with display names, pronouns, bio, photos, social links, and privacy settings.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\users.js` | User profile routes |
| `F:\Desktop\pryde-backend\server\routes\profileSlug.js` | Custom profile URL slugs |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\User.js` | User schema |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/users/me` | GET | Required | Get current user profile |
| `/api/users/me` | PUT | Required | Update current user profile |
| `/api/users/:id` | GET | Required | Get user by ID or username |
| `/api/users/search` | GET | Required | Search users by username/displayName |
| `/api/users/:id/followers` | GET | Required | Get user's followers |
| `/api/users/:id/following` | GET | Required | Get users they follow |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | Profile page |
| `F:\Desktop\pryde-frontend\src\features\profile\ProfileController.jsx` | Profile orchestration |
| `F:\Desktop\pryde-frontend\src\features\profile\ProfileHeader.jsx` | Profile header display |
| `F:\Desktop\pryde-frontend\src\components\EditProfileModal.jsx` | Profile editing |
| `F:\Desktop\pryde-frontend\src\components\ProfileUrlSetting.jsx` | Custom URL setting |
| `F:\Desktop\pryde-frontend\src\pages\Followers.jsx` | Followers list |
| `F:\Desktop\pryde-frontend\src\pages\Following.jsx` | Following list |

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

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | `F:\Desktop\pryde-backend\server\routes\users.js` | `GET /api/users/:id` |
| `F:\Desktop\pryde-frontend\src\components\EditProfileModal.jsx` | `F:\Desktop\pryde-backend\server\routes\users.js` | `PUT /api/users/me` |
| `F:\Desktop\pryde-frontend\src\pages\Followers.jsx` | `F:\Desktop\pryde-backend\server\routes\users.js` | `GET /api/users/:id/followers` |
| `F:\Desktop\pryde-frontend\src\pages\Following.jsx` | `F:\Desktop\pryde-backend\server\routes\users.js` | `GET /api/users/:id/following` |

---

## 3. Posts & Feed

### Feature Overview
Posts with text, media (images/videos/GIFs), polls, content warnings, and visibility controls. Separate global feed and following feed.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\posts.js` | Post CRUD operations |
| `F:\Desktop\pryde-backend\server\routes\feed.js` | Feed endpoints |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Post.js` | Post schema |

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

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Feed.jsx` | Main feed page |
| `F:\Desktop\pryde-frontend\src\features\feed\FeedController.jsx` | Feed orchestration |
| `F:\Desktop\pryde-frontend\src\features\feed\FeedStream.jsx` | Post stream display |
| `F:\Desktop\pryde-frontend\src\pages\FollowingFeed.jsx` | Following-only feed |
| `F:\Desktop\pryde-frontend\src\components\PostHeader.jsx` | Post header with author info |
| `F:\Desktop\pryde-frontend\src\components\Poll.jsx` | Poll display/voting |
| `F:\Desktop\pryde-frontend\src\components\PollCreator.jsx` | Poll creation |
| `F:\Desktop\pryde-frontend\src\components\PinnedPostBadge.jsx` | Pinned post indicator |

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

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Feed.jsx` | `F:\Desktop\pryde-backend\server\routes\feed.js` | `GET /api/feed/global` |
| `F:\Desktop\pryde-frontend\src\pages\FollowingFeed.jsx` | `F:\Desktop\pryde-backend\server\routes\feed.js` | `GET /api/feed/following` |
| `F:\Desktop\pryde-frontend\src\pages\Feed.jsx` | `F:\Desktop\pryde-backend\server\routes\posts.js` | `POST /api/posts` |
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | `F:\Desktop\pryde-backend\server\routes\posts.js` | `GET /api/posts/user/:userId` |

---

## 4. Comments

### Feature Overview
Threaded comments on posts with nested replies and reactions.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\comments.js` | Comment routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Comment.js` | Comment schema |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/posts/:postId/comments` | GET | Required | Get comments for post |
| `/api/posts/:postId/comments` | POST | Required | Add comment to post |
| `/api/comments/:commentId` | PUT | Required | Edit comment |
| `/api/comments/:commentId` | DELETE | Required | Delete comment |
| `/api/comments/:commentId/replies` | GET | Required | Get replies to comment |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\components\CommentThread.jsx` | Comment display with threading |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\components\CommentThread.jsx` | `F:\Desktop\pryde-backend\server\routes\comments.js` | `GET /api/posts/:postId/comments` |
| `F:\Desktop\pryde-frontend\src\components\CommentThread.jsx` | `F:\Desktop\pryde-backend\server\routes\comments.js` | `POST /api/posts/:postId/comments` |

---

## 5. Reactions

### Feature Overview
Universal emoji reaction system for posts and comments.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\reactions.js` | Reaction routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Reaction.js` | Reaction schema |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\reactionCache.js` | Reaction caching |
| `F:\Desktop\pryde-backend\server\utils\reactionAnalytics.js` | Reaction analytics |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/reactions` | POST | Required | Add/update/remove reaction |
| `/api/reactions/:targetType/:targetId` | GET | Optional | Get reactions for target |

**Approved Reactions**: `❤️`, `😂`, `😮`, `😢`, `😡`, `👍`, `👎`, `🔥`, `💯`, `🎉`

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\components\ReactionButton.jsx` | Reaction picker/display |
| `F:\Desktop\pryde-frontend\src\components\ReactionDetailsModal.jsx` | Who reacted modal |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\components\ReactionButton.jsx` | `F:\Desktop\pryde-backend\server\routes\reactions.js` | `POST /api/reactions` |
| `F:\Desktop\pryde-frontend\src\components\ReactionDetailsModal.jsx` | `F:\Desktop\pryde-backend\server\routes\reactions.js` | `GET /api/reactions/:targetType/:targetId` |

---

## 6. Messages (DMs)

### Feature Overview
Real-time direct messaging with encryption at rest, typing indicators, and read receipts.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\messages.js` | Message REST routes |
| `F:\Desktop\pryde-backend\server\server.js` (lines 650-950) | Socket handlers |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Message.js` | Message schema with encryption |
| `F:\Desktop\pryde-backend\server\models\Conversation.js` | Conversation schema |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\encryption.js` | Message encryption/decryption |
| `F:\Desktop\pryde-backend\server\utils\messageDeduplication.js` | Message deduplication |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/messages/list` | GET | Required | Get conversation list |
| `/api/messages/conversation/:userId` | GET | Required | Get messages with user |
| `/api/messages/unread/counts` | GET | Required | Get unread message counts |
| `/api/messages/:messageId/read` | PUT | Required | Mark message as read |

**Socket Events**: `send_message`, `message:new`, `message:sent`, `typing`, `user_typing`

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Messages.jsx` | Messages page |
| `F:\Desktop\pryde-frontend\src\features\messages\MessagesController.jsx` | Message orchestration |
| `F:\Desktop\pryde-frontend\src\features\messages\ConversationList.jsx` | Conversation sidebar |
| `F:\Desktop\pryde-frontend\src\features\messages\MessageThread.jsx` | Message display |
| `F:\Desktop\pryde-frontend\src\components\MessageBubble.jsx` | Message bubble component |
| `F:\Desktop\pryde-frontend\src\components\MessageInput.jsx` | Message input component |
| `F:\Desktop\pryde-frontend\src\components\MessageSearch.jsx` | Message search |
| `F:\Desktop\pryde-frontend\src\components\TypingIndicator.jsx` | Typing indicator |
| `F:\Desktop\pryde-frontend\src\components\VoiceRecorder.jsx` | Voice note recording |
| `F:\Desktop\pryde-frontend\src\hooks\useUnreadMessages.js` | Unread count singleton |
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | Socket.IO client |
| `F:\Desktop\pryde-frontend\src\layouts\MessagesLayout.jsx` | Messages layout |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route / Event |
|---------------|--------------|-------------------|
| `F:\Desktop\pryde-frontend\src\features\messages\ConversationList.jsx` | `F:\Desktop\pryde-backend\server\routes\messages.js` | `GET /api/messages/list` |
| `F:\Desktop\pryde-frontend\src\features\messages\MessageThread.jsx` | `F:\Desktop\pryde-backend\server\routes\messages.js` | `GET /api/messages/conversation/:userId` |
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | `F:\Desktop\pryde-backend\server\server.js` | Socket: `send_message` |
| `F:\Desktop\pryde-frontend\src\hooks\useUnreadMessages.js` | `F:\Desktop\pryde-backend\server\routes\messages.js` | `GET /api/messages/unread/counts` |

---

## 7. Notifications

### Feature Overview
Real-time notifications for social interactions. Separated into SOCIAL (bell icon) and MESSAGE (messages badge) types.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\notifications.js` | Notification routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Notification.js` | Notification schema |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\notificationEmitter.js` | Notification creation/emission |
| `F:\Desktop\pryde-backend\server\utils\notificationBatching.js` | Notification batching |
| `F:\Desktop\pryde-backend\server\utils\notificationDeduplication.js` | Notification deduplication |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/notifications` | GET | Required | Get notifications (supports `category` filter) |
| `/api/notifications/unread-count` | GET | Required | Get unread notification count |
| `/api/notifications/:id/read` | PUT | Required | Mark notification as read |
| `/api/notifications/read-all` | PUT | Required | Mark all as read |

**Socket Events**: `notification:new`, `notification:read`

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Notifications.jsx` | Notifications page |
| `F:\Desktop\pryde-frontend\src\components\Navbar.jsx` | Bell icon with unread count |
| `F:\Desktop\pryde-frontend\src\components\NotificationBell.jsx` | Notification bell component |
| `F:\Desktop\pryde-frontend\src\constants\notificationTypes.js` | Type definitions |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Notifications.jsx` | `F:\Desktop\pryde-backend\server\routes\notifications.js` | `GET /api/notifications` |
| `F:\Desktop\pryde-frontend\src\components\Navbar.jsx` | `F:\Desktop\pryde-backend\server\routes\notifications.js` | `GET /api/notifications/unread-count` |

---

## 8. Follow System

### Feature Overview
Follow/unfollow users with support for private accounts (follow requests).

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\follow.js` | Follow routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\FollowRequest.js` | Follow request schema |
| `F:\Desktop\pryde-backend\server\models\User.js` | User schema (followers/following arrays) |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/follow/:userId` | POST | Required | Follow user (or send request if private) |
| `/api/follow/:userId` | DELETE | Required | Unfollow user |
| `/api/follow/requests` | GET | Required | Get pending follow requests |
| `/api/follow/requests/:requestId/accept` | POST | Required | Accept follow request |
| `/api/follow/requests/:requestId/reject` | POST | Required | Reject follow request |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | Follow button on profiles |
| `F:\Desktop\pryde-frontend\src\pages\Followers.jsx` | Followers list |
| `F:\Desktop\pryde-frontend\src\pages\Following.jsx` | Following list |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | `F:\Desktop\pryde-backend\server\routes\follow.js` | `POST /api/follow/:userId` |
| `F:\Desktop\pryde-frontend\src\pages\Profile.jsx` | `F:\Desktop\pryde-backend\server\routes\follow.js` | `DELETE /api/follow/:userId` |

---

## 9. Groups

### Feature Overview
Community groups with posts, membership, moderation, and notification settings.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\groups.js` | Group routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Group.js` | Group schema |
| `F:\Desktop\pryde-backend\server\models\GroupModerationLog.js` | Group moderation log |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\groupPermissions.js` | Group permission helpers |

**Routes**:
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

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Groups.jsx` | Group detail page |
| `F:\Desktop\pryde-frontend\src\pages\GroupsList.jsx` | Groups listing |
| `F:\Desktop\pryde-frontend\src\features\groups\GroupDetailController.jsx` | Group orchestration |
| `F:\Desktop\pryde-frontend\src\features\groups\GroupFeed.jsx` | Group post feed |
| `F:\Desktop\pryde-frontend\src\features\groups\GroupHeader.jsx` | Group header |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\GroupsList.jsx` | `F:\Desktop\pryde-backend\server\routes\groups.js` | `GET /api/groups` |
| `F:\Desktop\pryde-frontend\src\pages\Groups.jsx` | `F:\Desktop\pryde-backend\server\routes\groups.js` | `GET /api/groups/:id` |
| `F:\Desktop\pryde-frontend\src\features\groups\GroupFeed.jsx` | `F:\Desktop\pryde-backend\server\routes\groups.js` | `GET /api/groups/:id/posts` |

---

## 10. Events

### Feature Overview
Calendar events with RSVP functionality.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\events.js` | Event routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Event.js` | Event schema |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/events` | GET | Required | List events (supports filters) |
| `/api/events` | POST | Required | Create event |
| `/api/events/:id` | GET | Required | Get event details |
| `/api/events/:id` | PUT | Required | Update event |
| `/api/events/:id` | DELETE | Required | Delete event |
| `/api/events/:id/rsvp` | POST | Required | RSVP to event |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Events.jsx` | Events calendar page |
| `F:\Desktop\pryde-frontend\src\components\EventRSVP.jsx` | RSVP component |
| `F:\Desktop\pryde-frontend\src\components\EventAttendees.jsx` | Attendees display |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Events.jsx` | `F:\Desktop\pryde-backend\server\routes\events.js` | `GET /api/events` |
| `F:\Desktop\pryde-frontend\src\components\EventRSVP.jsx` | `F:\Desktop\pryde-backend\server\routes\events.js` | `POST /api/events/:id/rsvp` |

---

## 11. Bookmarks

### Feature Overview
Save posts for later viewing.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\bookmarks.js` | Bookmark routes |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/bookmarks` | GET | Required | Get bookmarked posts |
| `/api/bookmarks/:postId` | POST | Required | Bookmark a post |
| `/api/bookmarks/:postId` | DELETE | Required | Remove bookmark |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Bookmarks.jsx` | Bookmarks page |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Bookmarks.jsx` | `F:\Desktop\pryde-backend\server\routes\bookmarks.js` | `GET /api/bookmarks` |

---

## 12. Search

### Feature Overview
Global search for users and posts. Message search within DMs.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\search.js` | Search routes |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/search` | GET | Required | Search users and posts |
| `/api/search/messages` | GET | Required | Search within DMs |
| `/api/search/my-posts` | GET | Required | Search own posts/journals/longforms |
| `/api/search/hashtag/:tag` | GET | Required | **DEPRECATED** (returns 410) |
| `/api/search/trending` | GET | Required | **DEPRECATED** (returns 410) |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Search.jsx` | Search page |
| `F:\Desktop\pryde-frontend\src\components\GlobalSearch.jsx` | Global search component |
| `F:\Desktop\pryde-frontend\src\components\ProfilePostSearch.jsx` | Profile post search |
| `F:\Desktop\pryde-frontend\src\components\MessageSearch.jsx` | Message search |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Search.jsx` | `F:\Desktop\pryde-backend\server\routes\search.js` | `GET /api/search` |
| `F:\Desktop\pryde-frontend\src\components\MessageSearch.jsx` | `F:\Desktop\pryde-backend\server\routes\search.js` | `GET /api/search/messages` |
| `F:\Desktop\pryde-frontend\src\components\ProfilePostSearch.jsx` | `F:\Desktop\pryde-backend\server\routes\search.js` | `GET /api/search/my-posts` |

---

## 13. Badges

### Feature Overview
User badges (automatic and manual) displayed on profiles.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\badges.js` | Badge routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Badge.js` | Badge schema |
| `F:\Desktop\pryde-backend\server\models\BadgeAssignmentLog.js` | Badge assignment log |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\populateBadges.js` | Badge resolution helper |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/badges` | GET | Required | List all badge definitions |
| `/api/badges/explain` | GET | Public | Badge system explanation |
| `/api/badges/user/:userId` | GET | Required | Get user's badges |
| `/api/badges/assign` | POST | Admin | Assign badge to user |
| `/api/badges/revoke` | POST | Admin | Revoke badge from user |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\hooks\useBadges.js` | Badge fetching/caching |
| `F:\Desktop\pryde-frontend\src\components\TieredBadgeDisplay.jsx` | Badge display component |
| `F:\Desktop\pryde-frontend\src\components\BadgeContainer.jsx` | Badge container |
| `F:\Desktop\pryde-frontend\src\components\BadgeSettings.jsx` | Badge settings |
| `F:\Desktop\pryde-frontend\src\components\UserBadge.jsx` | User badge display |
| `F:\Desktop\pryde-frontend\src\utils\badgeTiers.js` | Badge tier utilities |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\hooks\useBadges.js` | `F:\Desktop\pryde-backend\server\routes\badges.js` | `GET /api/badges` |
| `F:\Desktop\pryde-frontend\src\components\TieredBadgeDisplay.jsx` | `F:\Desktop\pryde-backend\server\routes\badges.js` | `GET /api/badges/user/:userId` |

---

## 14. Privacy & Blocks

### Feature Overview
Privacy settings and user blocking.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\privacy.js` | Privacy routes |
| `F:\Desktop\pryde-backend\server\routes\blocks.js` | Block routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Block.js` | Block schema |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\blockHelper.js` | Block checking helpers |

**Middleware (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\middleware\privacy.js` | Privacy enforcement |

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

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\PrivacySettings.jsx` | Privacy settings page |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\PrivacySettings.jsx` | `F:\Desktop\pryde-backend\server\routes\privacy.js` | `GET /api/privacy/settings` |
| `F:\Desktop\pryde-frontend\src\pages\PrivacySettings.jsx` | `F:\Desktop\pryde-backend\server\routes\privacy.js` | `PATCH /api/privacy/settings` |

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

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\reports.js` | Report routes |
| `F:\Desktop\pryde-backend\server\routes\bugReports.js` | Bug report routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\Report.js` | Report schema |
| `F:\Desktop\pryde-backend\server\models\BugReport.js` | Bug report schema |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/reports` | POST | Required | Submit a report |
| `/api/reports/my-reports` | GET | Required | Get user's submitted reports |
| `/api/reports/:id` | GET | Required | Get report details |

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\components\ReportModal.jsx` | Report submission modal |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\components\ReportModal.jsx` | `F:\Desktop\pryde-backend\server\routes\reports.js` | `POST /api/reports` |

---

## 16. Upload

### Feature Overview
File uploads for images, videos, and audio. Uses GridFS for storage.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\upload.js` | Upload routes |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\TempMedia.js` | Temporary media schema |

**Middleware (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\middleware\imageProcessing.js` | Image processing/EXIF stripping |

**Routes**:
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/upload` | POST | Required | Upload single file |
| `/api/upload/multiple` | POST | Required | Upload multiple files |
| `/api/upload/file/:filename` | GET | Public | Serve uploaded file |
| `/api/upload/voice` | POST | Required | Upload voice note |

**Limits**: 10MB per file, allowed types: JPEG, PNG, GIF, WebP, MP4, WebM, MP3, WAV

### Frontend Integration

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\utils\uploadWithProgress.js` | Upload with progress tracking |
| `F:\Desktop\pryde-frontend\src\utils\compressImage.js` | Client-side image compression |
| `F:\Desktop\pryde-frontend\src\components\VoiceRecorder.jsx` | Voice note recording |
| `F:\Desktop\pryde-frontend\src\components\GifPicker.jsx` | GIF picker |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\utils\uploadWithProgress.js` | `F:\Desktop\pryde-backend\server\routes\upload.js` | `POST /api/upload` |
| `F:\Desktop\pryde-frontend\src\components\VoiceRecorder.jsx` | `F:\Desktop\pryde-backend\server\routes\upload.js` | `POST /api/upload/voice` |

---

## 17. Admin

### Feature Overview
Admin dashboard for platform management, user moderation, and analytics.

### Backend Implementation

**Route Definition Files (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\routes\admin.js` | Main admin routes |
| `F:\Desktop\pryde-backend\server\routes\adminDebug.js` | Admin debug routes |
| `F:\Desktop\pryde-backend\server\routes\adminHealth.js` | Admin health routes |
| `F:\Desktop\pryde-backend\server\routes\adminPosts.js` | Admin post management |
| `F:\Desktop\pryde-backend\server\routes\adminEscalation.js` | Admin escalation |

**Models (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\models\AdminActionLog.js` | Admin action log |
| `F:\Desktop\pryde-backend\server\models\AdminEscalationToken.js` | Escalation tokens |
| `F:\Desktop\pryde-backend\server\models\ModerationSettings.js` | Moderation settings |

**Middleware (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\middleware\adminAuth.js` | Admin authentication |
| `F:\Desktop\pryde-backend\server\middleware\requireAdminEscalation.js` | Escalation requirement |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\securityLogger.js` | Security logging |

**Routes**:
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

**Frontend Caller Files**:
| File | Usage |
|------|-------|
| `F:\Desktop\pryde-frontend\src\pages\Admin.jsx` | Admin dashboard |
| `F:\Desktop\pryde-frontend\src\utils\roleHelpers.js` | Role checking utilities |
| `F:\Desktop\pryde-frontend\src\components\RoleRoute.jsx` | Role-based routing |

### Cross-Layer Mapping

| Frontend File | Backend File | API Route |
|---------------|--------------|-----------|
| `F:\Desktop\pryde-frontend\src\pages\Admin.jsx` | `F:\Desktop\pryde-backend\server\routes\admin.js` | `GET /api/admin/stats` |
| `F:\Desktop\pryde-frontend\src\pages\Admin.jsx` | `F:\Desktop\pryde-backend\server\routes\admin.js` | `GET /api/admin/users` |

---

## 18. Socket Events

### Feature Overview
Real-time communication via Socket.IO for messages, notifications, presence, and typing indicators.

### Backend Implementation

**Server File (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\server.js` (lines 650-950) | Socket.IO handlers |

**Utils (Backend)**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-backend\server\utils\emitValidated.js` | Validated socket emission |

### Frontend Implementation

**Frontend Files**:
| File | Description |
|------|-------------|
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | Socket.IO client with zombie detection |
| `F:\Desktop\pryde-frontend\src\utils\socketHelpers.js` | Socket helper utilities |
| `F:\Desktop\pryde-frontend\src\utils\socketDiagnostics.js` | Socket diagnostics |
| `F:\Desktop\pryde-frontend\src\utils\emitValidated.js` | Validated socket emission |
| `F:\Desktop\pryde-frontend\src\context\SocketContext.jsx` | Socket React context |
| `F:\Desktop\pryde-frontend\src\constants\socketEvents.js` | Socket event constants |
| `F:\Desktop\pryde-frontend\src\config\api.js` | Socket URL configuration |

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

### Cross-Layer Mapping

| Frontend File | Backend File | Socket Event |
|---------------|--------------|--------------|
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | `F:\Desktop\pryde-backend\server\server.js` | `send_message` |
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | `F:\Desktop\pryde-backend\server\server.js` | `typing` |
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | `F:\Desktop\pryde-backend\server\server.js` | `join` |
| `F:\Desktop\pryde-frontend\src\utils\socket.js` | `F:\Desktop\pryde-backend\server\server.js` | `ping` |
| `F:\Desktop\pryde-frontend\src\context\SocketContext.jsx` | `F:\Desktop\pryde-backend\server\server.js` | `message:new` |
| `F:\Desktop\pryde-frontend\src\context\SocketContext.jsx` | `F:\Desktop\pryde-backend\server\server.js` | `notification:new` |
| `F:\Desktop\pryde-frontend\src\hooks\useOnlineUsers.js` | `F:\Desktop\pryde-backend\server\server.js` | `online_users` |

### Frontend Socket Client Features

**File**: `F:\Desktop\pryde-frontend\src\utils\socket.js`

**Features**:
- Zombie connection detection (auto-reconnect after 2 missed pings)
- Pre-flight ping test before sending messages
- Message queue for offline/reconnecting states
- Health monitoring with `timeSinceLastPong`

---

## 19. Mismatch & Risk Notes

### Backend Routes Without Clear Frontend Usage

| Backend Route File | Route Prefix | Notes |
|--------------------|--------------|-------|
| `F:\Desktop\pryde-backend\server\routes\journals.js` | `/api/journals/*` | Journal feature exists but may have limited UI |
| `F:\Desktop\pryde-backend\server\routes\longform.js` | `/api/longform/*` | Longform posts feature exists but may have limited UI |
| `F:\Desktop\pryde-backend\server\routes\photoEssays.js` | `/api/photo-essays/*` | Photo essays feature exists but may have limited UI |
| `F:\Desktop\pryde-backend\server\routes\circles.js` | `/api/circles/*` | Small Circles feature (Life-Signal) |
| `F:\Desktop\pryde-backend\server\routes\resonance.js` | `/api/resonance/*` | Resonance Signals feature (Life-Signal) |
| `F:\Desktop\pryde-backend\server\routes\prompts.js` | `/api/prompts/*` | Reflection Prompts feature (Life-Signal) |
| `F:\Desktop\pryde-backend\server\routes\collections.js` | `/api/collections/*` | Personal Collections feature (Life-Signal) |
| `F:\Desktop\pryde-backend\server\routes\presence.js` | `/api/presence/*` | Soft Presence States feature (Life-Signal) |
| `F:\Desktop\pryde-backend\server\routes\globalChat.js` | `/api/global-chat/*` | Global chat (Lounge) feature |
| `F:\Desktop\pryde-backend\server\routes\groupChats.js` | `/api/groupchats/*` | Group chat feature |
| `F:\Desktop\pryde-backend\server\routes\friends.js` | `/api/friends/*` | Legacy friends system (kept for backward compatibility) |
| `F:\Desktop\pryde-backend\server\routes\drafts.js` | `/api/drafts/*` | Draft management |
| `F:\Desktop\pryde-backend\server\routes\invites.js` | `/api/invites/*` | Invite system |
| `F:\Desktop\pryde-backend\server\routes\recoveryContacts.js` | `/api/recovery-contacts/*` | Account recovery |
| `F:\Desktop\pryde-backend\server\routes\safeMode.js` | `/api/safe-mode/*` | Safe mode feature |
| `F:\Desktop\pryde-backend\server\routes\stabilityControls.js` | `/api/stability/*` | Stability controls |
| `F:\Desktop\pryde-backend\server\routes\loginApproval.js` | `/api/login-approval/*` | Login approval |

### Deprecated Endpoints (Return 410 Gone)

| Backend Route File | Route | Removed Date | Notes |
|--------------------|-------|--------------|-------|
| `F:\Desktop\pryde-backend\server\routes\search.js` | `/api/search/hashtag/:tag` | 2025-12-26 | Hashtag search removed |
| `F:\Desktop\pryde-backend\server\routes\search.js` | `/api/search/trending` | 2025-12-26 | Trending hashtags removed |
| `F:\Desktop\pryde-backend\server\routes\tags.js` | `/api/tags/*` | Phase 2B | Tags deprecated, replaced by Groups |

### Field Naming Consistency

| Context | Backend Field | Frontend Field | Status |
|---------|---------------|----------------|--------|
| User ID | `_id` | `id` or `_id` | ⚠️ Mixed usage |
| Author | `author` | `author` | ✅ Consistent |
| Reactions | `reactions` (object) | `reactions` (object) | ✅ Consistent |
| Timestamps | `createdAt`, `updatedAt` | Same | ✅ Consistent |

### Auth/Permission Middleware (Backend)

| Middleware File | Middleware | Description |
|-----------------|------------|-------------|
| `F:\Desktop\pryde-backend\server\middleware\auth.js` | `auth` | Requires valid JWT token |
| `F:\Desktop\pryde-backend\server\middleware\requireActiveUser.js` | `requireActiveUser` | Requires `isActive: true` |
| `F:\Desktop\pryde-backend\server\middleware\requireEmailVerification.js` | `requireEmailVerification` | Requires verified email |
| `F:\Desktop\pryde-backend\server\middleware\adminAuth.js` | `adminAuth` | Requires admin role |
| `F:\Desktop\pryde-backend\server\middleware\requireAdminEscalation.js` | `requireAdminEscalation` | Requires escalated privileges |
| `F:\Desktop\pryde-backend\server\middleware\systemAccountGuard.js` | `systemAccountGuard` | Protects system accounts |

### Rate Limiters (Backend)

**File**: `F:\Desktop\pryde-backend\server\middleware\rateLimiter.js`

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

## Appendix A: Route Mounting Summary

**File**: `F:\Desktop\pryde-backend\server\server.js` (lines 423-485)

```javascript
// Core routes
app.use('/api/auth', authRoutes);          // F:\Desktop\pryde-backend\server\routes\auth.js
app.use('/api/refresh', refreshRoutes);    // F:\Desktop\pryde-backend\server\routes\refresh.js
app.use('/api/users', usersRoutes);        // F:\Desktop\pryde-backend\server\routes\users.js
app.use('/api/friends', friendsRoutes);    // F:\Desktop\pryde-backend\server\routes\friends.js (Legacy)
app.use('/api/follow', followRoutes);      // F:\Desktop\pryde-backend\server\routes\follow.js
app.use('/api/posts', postsRoutes);        // F:\Desktop\pryde-backend\server\routes\posts.js
app.use('/api/feed', feedRoutes);          // F:\Desktop\pryde-backend\server\routes\feed.js
app.use('/api/journals', journalsRoutes);  // F:\Desktop\pryde-backend\server\routes\journals.js
app.use('/api/longform', longformRoutes);  // F:\Desktop\pryde-backend\server\routes\longform.js
app.use('/api/tags', tagsRoutes);          // F:\Desktop\pryde-backend\server\routes\tags.js (Deprecated)
app.use('/api/groups', groupsRoutes);      // F:\Desktop\pryde-backend\server\routes\groups.js
app.use('/api/photo-essays', photoEssaysRoutes);  // F:\Desktop\pryde-backend\server\routes\photoEssays.js
app.use('/api/upload', uploadRoutes);      // F:\Desktop\pryde-backend\server\routes\upload.js
app.use('/api/notifications', notificationsRoutes);  // F:\Desktop\pryde-backend\server\routes\notifications.js
app.use('/api/messages', messagesRoutes);  // F:\Desktop\pryde-backend\server\routes\messages.js
app.use('/api/groupchats', groupChatsRoutes);  // F:\Desktop\pryde-backend\server\routes\groupChats.js
app.use('/api/global-chat', globalChatRoutes);  // F:\Desktop\pryde-backend\server\routes\globalChat.js
app.use('/api/push', pushNotificationsRouter);  // F:\Desktop\pryde-backend\server\routes\pushNotifications.js
app.use('/api/reports', reportsRoutes);    // F:\Desktop\pryde-backend\server\routes\reports.js
app.use('/api/blocks', blocksRoutes);      // F:\Desktop\pryde-backend\server\routes\blocks.js
app.use('/api/admin', adminRoutes);        // F:\Desktop\pryde-backend\server\routes\admin.js
app.use('/api/search', searchRoutes);      // F:\Desktop\pryde-backend\server\routes\search.js
app.use('/api/2fa', twoFactorRoutes);      // F:\Desktop\pryde-backend\server\routes\twoFactor.js
app.use('/api/sessions', sessionsRoutes);  // F:\Desktop\pryde-backend\server\routes\sessions.js
app.use('/api/privacy', privacyRoutes);    // F:\Desktop\pryde-backend\server\routes\privacy.js
app.use('/api/bookmarks', bookmarksRoutes);  // F:\Desktop\pryde-backend\server\routes\bookmarks.js
app.use('/api/events', eventsRoutes);      // F:\Desktop\pryde-backend\server\routes\events.js
app.use('/api/drafts', draftsRoutes);      // F:\Desktop\pryde-backend\server\routes\drafts.js
app.use('/api', commentsRoutes);           // F:\Desktop\pryde-backend\server\routes\comments.js
app.use('/api/reactions', reactionsRoutes);  // F:\Desktop\pryde-backend\server\routes\reactions.js
app.use('/api/passkey', passkeyRoutes);    // F:\Desktop\pryde-backend\server\routes\passkey.js
app.use('/api/badges', badgesRoutes);      // F:\Desktop\pryde-backend\server\routes\badges.js

// Life-Signal Features
app.use('/api/prompts', promptsRoutes);    // F:\Desktop\pryde-backend\server\routes\prompts.js
app.use('/api/collections', collectionsRoutes);  // F:\Desktop\pryde-backend\server\routes\collections.js
app.use('/api/resonance', resonanceRoutes);  // F:\Desktop\pryde-backend\server\routes\resonance.js
app.use('/api/circles', circlesRoutes);    // F:\Desktop\pryde-backend\server\routes\circles.js
app.use('/api/presence', presenceRoutes);  // F:\Desktop\pryde-backend\server\routes\presence.js
```

---

## Appendix B: Model Files Summary

**Directory**: `F:\Desktop\pryde-backend\server\models\`

| Model File | Description |
|------------|-------------|
| `User.js` | User schema with auth, profile, badges |
| `Post.js` | Post schema with groupId isolation |
| `Comment.js` | Comment schema with threading |
| `Message.js` | Message schema with encryption |
| `Conversation.js` | Conversation schema |
| `Notification.js` | Notification schema |
| `Group.js` | Group schema |
| `Event.js` | Event schema |
| `Badge.js` | Badge definition schema |
| `Block.js` | Block relationship schema |
| `Report.js` | Report schema |
| `Reaction.js` | Reaction schema |
| `FollowRequest.js` | Follow request schema |
| `Journal.js` | Journal entry schema |
| `Longform.js` | Longform post schema |
| `PhotoEssay.js` | Photo essay schema |
| `Draft.js` | Draft schema |
| `Circle.js` | Small Circle schema |
| `Collection.js` | Personal Collection schema |
| `Resonance.js` | Resonance Signal schema |
| `ReflectionPrompt.js` | Reflection Prompt schema |
| `GlobalMessage.js` | Global chat message schema |
| `GroupChat.js` | Group chat schema |
| `Invite.js` | Invite schema |
| `SecurityLog.js` | Security event log |
| `AdminActionLog.js` | Admin action log |

---

## Appendix C: Frontend Directory Structure Summary

**Directory**: `F:\Desktop\pryde-frontend\src\`

| Directory | Description |
|-----------|-------------|
| `context/` | React contexts (AuthContext, SocketContext) |
| `pages/` | Page components |
| `components/` | Reusable UI components |
| `features/` | Feature modules (feed, messages, groups, profile) |
| `hooks/` | Custom React hooks |
| `utils/` | Utility functions (api, socket, auth) |
| `config/` | Configuration (api.js, platformFlags.js) |
| `constants/` | Constants (notificationTypes, socketEvents) |
| `layouts/` | Layout components |
| `styles/` | CSS stylesheets |
| `state/` | State management |

---

## Appendix D: Domain Guarantees

### User / Authentication Domain

**Backend File**: `F:\Desktop\pryde-backend\server\models\User.js`

**Guarantees**:
- Passwords are always bcrypt-hashed before persistence
- comparePassword() provides authoritative credential checking
- Login attempts are counted and lockoutUntil is set when thresholds are hit
- toJSON() removes sensitive fields before public use
- Schema defaults ensure declared fields exist after persistence
- The exported User model always includes instance methods

**Non-Guarantees / Unsafe Assumptions**:
- Login attempt tracking is NOT race-free
- Lockout enforcement is NOT atomic under concurrency
- bcrypt rounds are hard-coded and not environment-aware
- No format or strength validation is enforced at schema level
- Usernames are NOT guaranteed unique
- pre-save hooks are NOT guarded against bcrypt failures
- Raw Mongoose documents may still expose sensitive fields

---

*End of API Contract Document*
