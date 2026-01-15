# Socket.IO Fix Setup Guide

## Overview
This guide explains how to integrate the 4 critical fixes for your realtime messaging and notification system.

---

## ✅ Completed Fixes

### 1. **SocketContext Created** ✓
**File:** `src/context/SocketContext.jsx`

**What it does:**
- Provides a single Socket.IO instance across your entire app
- Manages connection state (connected, ready, healthy)
- Tracks online users automatically
- Handles reconnection logic
- Exposes socket to all child components

### 2. **Message Queue Processing Fixed** ✓
**File:** `src/utils/socket.js`

**What it does:**
- Added fallback timer (3 seconds) to process queued messages even if `room:joined` event is missed
- Prevents messages from getting stuck in queue forever
- Ensures messages are delivered even during flaky connections

### 3. **Connection Health Monitoring** ✓
**File:** `src/utils/socket.js`

**What it does:**
- Sends ping every 15 seconds to verify connection
- Automatically reconnects if no pong received within 30 seconds
- Exposes connection health status via `getConnectionHealth()`
- Starts automatically when socket connects
- Stops when socket disconnects

### 4. **Error Handling & Retries** ✓
**File:** `src/utils/socket.js`

**What it does:**
- Retries failed messages up to 3 times with exponential backoff
- 10-second timeout for ACK responses
- Retries on specific error codes (VALIDATION_ERROR, SEND_MESSAGE_ERROR)
- Notifies callback of queued status
- Comprehensive error responses

---

## 🚀 Integration Steps

### Step 1: Wrap App with SocketProvider

**File:** `src/App.jsx` or `src/index.jsx`

```jsx
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        {/* Your app components */}
      </SocketProvider>
    </AuthProvider>
  );
}
```

**⚠️ IMPORTANT:** `SocketProvider` must be inside `AuthProvider` because it depends on auth context.

---

### Step 2: Update Components Using Socket

Replace direct socket imports with the new `useSocket` hook:

#### Before:
```jsx
import { getSocket } from '../utils/socket';

function MyComponent() {
  const socket = getSocket();
  // ...
}
```

#### After:
```jsx
import { useSocket } from '../context/SocketContext';

function MyComponent() {
  const { socket, isConnected, isReady, onlineUsers } = useSocket();
  // ...
}
```

---

### Step 3: Update MessagesController

**File:** `src/features/messages/MessagesController.jsx`

The controller already imports `useSocket` from SocketContext (line 25), but now it will actually work since the context exists!

No changes needed - it should work automatically once you add the SocketProvider.

---

### Step 4: Use Error Handling in Message Sending

Update components that send messages to handle errors and retries:

```jsx
import { sendMessage } from '../utils/socket';

const handleSendMessage = () => {
  sendMessage(
    {
      recipientId: selectedUserId,
      content: messageText,
      _tempId: `temp_${Date.now()}`
    },
    (response) => {
      if (response.success) {
        console.log('✅ Message sent successfully');
        setMessageText('');
      } else if (response.queued) {
        console.log('📬 Message queued - will send when online');
        // Show "sending..." indicator
      } else if (response.error) {
        console.error('❌ Failed to send:', response.message);
        // Show error toast to user
        alert(`Failed to send message: ${response.message}`);
      }
    }
  );
};
```

---

### Step 5: Display Connection Status (Optional)

Add a connection indicator to your UI:

```jsx
import { useSocket } from '../context/SocketContext';

function ConnectionIndicator() {
  const { isConnected, isReady, connectionHealth } = useSocket();

  if (!isConnected) {
    return <div className="offline-badge">Offline - Reconnecting...</div>;
  }

  if (!isReady) {
    return <div className="connecting-badge">Connecting...</div>;
  }

  if (connectionHealth && !connectionHealth.isHealthy) {
    return <div className="warning-badge">Connection Issues</div>;
  }

  return <div className="online-badge">Connected</div>;
}
```

---

## 🔍 Debugging

### Check Connection Health

Open browser console and run:

```javascript
// Access socket directly
window.socket

// Check if connected
window.socket?.connected

// Get health status
import { getConnectionHealth } from './utils/socket';
console.log(getConnectionHealth());
```

### Monitor Message Queue

```javascript
import { getMessageQueueLength } from './utils/socket';
console.log('Messages in queue:', getMessageQueueLength());
```

### Enable Debug Logging

The socket utility already logs extensively. Check browser console for:
- `✅ Socket connected successfully!`
- `✅ Room joined:`
- `📤 Emitting send_message with ACK`
- `✅ Message ACK received`
- `🏓 Pong received, connection healthy`

---

## 🐛 Common Issues & Solutions

### Issue: "useSocket must be used within a SocketProvider"

**Solution:** Make sure you wrapped your app with `<SocketProvider>` as shown in Step 1.

---

### Issue: Messages still not sending

**Check:**
1. Is socket connected? `const { isConnected } = useSocket()`
2. Is room joined? `const { isReady } = useSocket()`
3. Are messages queued? Check `getMessageQueueLength()`
4. Check browser console for errors

---

### Issue: Notifications disappearing on refresh

**Root cause:** React state is lost on refresh. Notifications are only stored in memory.

**Solution:** The notification bell already refetches from the API on mount (NotificationBell.jsx:53). Make sure the backend is persisting notifications to the database.

---

### Issue: Messages sent to wrong user

**Check:**
1. Verify `recipientId` is correct
2. Check server logs for room join events
3. Verify user rooms: `socket.emit('debug:rooms')` (backend supports this)

---

## 📊 Monitoring in Production

### Health Check Endpoint

The socket utility exposes health status:

```javascript
import { getConnectionHealth } from './utils/socket';

setInterval(() => {
  const health = getConnectionHealth();
  if (!health.isHealthy) {
    // Log to error tracking service (Sentry, etc.)
    console.error('Socket unhealthy:', health);
  }
}, 30000); // Check every 30 seconds
```

---

## 🎯 Testing Checklist

After integration, test these scenarios:

- [ ] Send a message - should appear immediately
- [ ] Receive a message - should appear in real-time
- [ ] Disconnect internet - messages should queue
- [ ] Reconnect internet - queued messages should send
- [ ] Refresh page - messages should persist (from database)
- [ ] Send message to offline user - should save to DB and deliver on reconnect
- [ ] Notifications appear in bell icon
- [ ] Notifications persist after refresh
- [ ] Connection indicator shows correct status

---

## 🔧 Advanced Configuration

### Customize Retry Settings

Edit `src/utils/socket.js`:

```javascript
export const sendMessage = (data, callback, retryCount = 0) => {
    const MAX_RETRIES = 5; // Change from 3 to 5
    const RETRY_DELAY = 2000; // Change from 1000ms to 2000ms
    // ...
}
```

### Customize Health Check Interval

Edit `src/utils/socket.js`:

```javascript
const PING_INTERVAL = 30000; // Change from 15s to 30s
const PONG_TIMEOUT = 60000; // Change from 30s to 60s
```

---

## 📝 Migration Notes

### Breaking Changes
None - these are additive fixes.

### Backward Compatibility
- Existing socket calls still work
- Old event listeners still work
- No database migrations needed

---

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check backend logs for socket events
3. Verify JWT token is valid
4. Check CORS settings allow socket connections
5. Verify backend room join handler is working

---

## ✨ Next Steps

After integration:

1. **Test thoroughly** - Use the testing checklist above
2. **Monitor errors** - Check logs for failed messages
3. **Optimize** - Adjust retry/timeout settings based on your needs
4. **Add UI feedback** - Show connection status, sending indicators, etc.

---

**Status:** All 4 fixes completed and ready for integration! 🎉
