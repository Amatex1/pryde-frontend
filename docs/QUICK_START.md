# Quick Start - Socket Fixes

## ⚡ 3-Minute Integration

### Step 1: Add SocketProvider (1 min)

**File:** `src/App.jsx` or `src/main.jsx`

```jsx
import { SocketProvider } from './context/SocketContext';

// Wrap your app (must be INSIDE AuthProvider)
<AuthProvider>
  <SocketProvider>
    <YourApp />
  </SocketProvider>
</AuthProvider>
```

### Step 2: Test It (2 min)

1. Open browser console
2. Look for: `✅ Socket connected successfully!`
3. Send a test message
4. Check for: `✅ Message ACK received`

**Done!** Messages should now work.

---

## 🔍 Verify It's Working

Open browser console and run:

```javascript
// Should show socket object
window.socket

// Should return true
window.socket?.connected

// Should show health status
import { getConnectionHealth } from './utils/socket';
console.log(getConnectionHealth());
```

---

## 🐛 Quick Troubleshooting

### Messages not sending?

**Check:**
```javascript
const { isConnected, isReady } = useSocket();
console.log({ isConnected, isReady });
```

Both should be `true`. If not:
- Check backend is running
- Check CORS allows socket connections
- Check JWT token is valid

### Notifications not appearing?

**Check:**
```javascript
// Should see this event in console
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
});
```

If not firing:
- Check NotificationBell is mounted
- Check backend emits `notification:new`
- Check room join: `socket.emit('debug:rooms')`

---

## 📁 Files Created/Modified

### Created ✅
- `src/context/SocketContext.jsx` - Socket provider
- `SOCKET_FIX_SETUP.md` - Full integration guide
- `REALTIME_ISSUES_ANALYSIS.md` - Detailed analysis
- `QUICK_START.md` - This file

### Modified ✅
- `src/utils/socket.js` - Enhanced with retries, health monitoring, queue fixes

---

## 🎯 What Was Fixed

1. ✅ **Missing SocketContext** - Created it
2. ✅ **Message Queue** - Added fallback timer
3. ✅ **Health Monitoring** - Ping/pong every 15s
4. ✅ **Error Handling** - Retry up to 3 times

---

## 📖 Read More

- **Full Setup Guide:** `SOCKET_FIX_SETUP.md`
- **Issue Analysis:** `REALTIME_ISSUES_ANALYSIS.md`

---

**Ready to go!** Add the SocketProvider and you're done. 🚀
