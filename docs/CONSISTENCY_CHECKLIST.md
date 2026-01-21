# Pre-Deploy Consistency Checklist

**MANDATORY: Complete this checklist before EVERY deploy.**

If any checkbox fails → **BLOCK DEPLOY**.

---

## 🔄 Real-Time Sync Verification

For EACH feature modified in this deploy:

### Posts
- [ ] Create → visible instantly without refresh
- [ ] Update → persists after refresh  
- [ ] Delete → never reappears
- [ ] Other users see changes via socket in real time
- [ ] Socket events: `post_created`, `post_updated`, `post_deleted`

### Comments
- [ ] Add → appears instantly (via socket, not optimistic)
- [ ] Edit → persists after refresh
- [ ] Delete → never reappears, replies also deleted
- [ ] Socket events: `comment_added`, `comment_updated`, `comment_deleted`

### Reactions (Posts & Comments)
- [ ] Add → updates count and emoji instantly
- [ ] Remove → decrements correctly
- [ ] Toggle → switches between emojis properly
- [ ] Rollback on error (comment reactions)

### Messages
- [ ] Send → appears in both sender and recipient views
- [ ] Edit → updates for all participants
- [ ] Delete → removed for sender (not recipient unless unsent)
- [ ] Socket confirmation before clearing input

### Profile
- [ ] Photo update → visible immediately
- [ ] Cover update → visible immediately
- [ ] Bio/settings → persist after refresh

### Friends
- [ ] Add request → updates pending count
- [ ] Accept → updates friend count immediately (no refetch)
- [ ] Remove → updates friend count immediately (no refetch)
- [ ] Other user notified via socket

---

## 🧱 Mutation Pattern Verification

For EACH mutation handler:

- [ ] Saves previous state BEFORE optimistic update
- [ ] API call is ALWAYS made (no UI-only mutations)
- [ ] State reconciled with API response on success
- [ ] Rollback executed on error
- [ ] Error message shown to user

---

## 🚨 Dev Console Verification

Before deploying, run the app in development mode and verify:

- [ ] Zero `[CONSISTENCY]` warnings in console
- [ ] Zero `[MUTATION VIOLATION]` errors in console
- [ ] No "Non-persistent UI mutation" warnings
- [ ] No orphaned pending mutations (5-second timeout)

---

## 🔍 Manual Testing Checklist

### Refresh Test (CRITICAL)
For each modified feature:

1. Perform the action (create/update/delete)
2. IMMEDIATELY refresh the page
3. Verify the action persisted
4. If data reverted → **BLOCK DEPLOY**

### Multi-Tab Test
1. Open app in two browser tabs
2. Perform action in Tab A
3. Verify Tab B sees the change via socket (no refresh)

### Offline/Error Test
1. Simulate network failure mid-action
2. Verify optimistic update is rolled back
3. Verify error message is shown

---

## 📋 Code Review Checklist

- [ ] No `setState` for destructive actions without API call
- [ ] No `fetchData()` calls to see changes (use socket or API response)
- [ ] All socket events use constants from `socketEvents.js`
- [ ] New mutations use `useMutation` hook or follow pattern
- [ ] `withOptimisticUpdate` used for complex state changes

---

## ✅ Sign-Off

| Checker | Date | Build/Commit | Pass/Fail |
|---------|------|--------------|-----------|
|         |      |              |           |

**Deploy only if ALL checks pass.**

---

## Quick Reference: Standard Mutation Pattern

```javascript
const handleMutation = async (data) => {
  // 1. Save state for rollback
  const savedState = currentState;
  
  // 2. Optimistic update (optional)
  setState(optimisticValue);
  
  try {
    // 3. API call
    const response = await api.mutate(data);
    
    // 4. Reconcile with response
    setState(response.data);
    
  } catch (error) {
    // 5. Rollback on error
    setState(savedState);
    showError(error.message);
  }
};
```

---

## Socket Event Constants

Import from: `src/constants/socketEvents.js`

```javascript
import SOCKET_EVENTS from '../constants/socketEvents';

// Usage
socket.on(SOCKET_EVENTS.POST.CREATED, handlePostCreated);
socket.on(SOCKET_EVENTS.COMMENT.ADDED, handleCommentAdded);
```

