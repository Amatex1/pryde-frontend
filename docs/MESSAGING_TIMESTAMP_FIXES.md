# 🐛 Messaging & Timestamp Issues - Diagnosis & Fixes

**Date:** January 14, 2026
**Issues:**
1. ❌ DMs not coming through
2. ⏱️ Lounge messages very delayed
3. 🕐 All messages timestamped "1 day ago"

---

## ✅ **UPDATE: Socket Events Are CORRECT!**

**Backend emits:** `message:new` and `message:sent` ✅
**Frontend listens to:** `message:new` and `message:sent` ✅

The socket event names were already fixed in Phase R unification. The issue must be elsewhere.

---

## 🔍 **NEW DIAGNOSIS:**

### **Possible Causes for DM Issues:**

1. **Socket not connected** - Check browser console for connection errors
2. **Authentication failing** - JWT token expired or invalid
3. **User rooms not joined** - Backend not joining users to `user_${userId}` rooms
4. **Message encryption failing** - Encryption errors preventing message save
5. **Database connection issues** - MongoDB timeout or connection pool exhausted

### **Possible Causes for Timestamp Issues:**

1. **Browser timezone mismatch** - Client showing wrong timezone
2. **Server sending wrong dates** - Check if `createdAt` is correct in database
3. **Date parsing error** - Frontend parsing ISO dates incorrectly
4. **Clock drift** - Server clock is off by 1 day

---

### **Issue 2: Timestamp Calculation Bug**

All timestamps show "1 day ago" because the date calculation is using the wrong timezone or the server is sending dates in the future.

**Possible causes:**
1. Server timezone mismatch
2. Client timezone mismatch  
3. Date parsing error
4. Server clock drift

---

### **Issue 3: Lounge Performance**

Lounge messages are delayed due to:
1. Database save operations blocking socket emission
2. Encryption overhead
3. Notification processing blocking response

---

## ✅ **FIXES TO APPLY:**

### **Fix 1: Update Socket Event Names (Frontend)**

**File:** `src/utils/socket.js`

Change:
```javascript
// OLD (WRONG)
socket.on("message_sent", callback);
socket.on("new_message", callback);

// NEW (CORRECT)
socket.on("message:sent", callback);
socket.on("message:new", callback);
```

---

### **Fix 2: Check Server Timezone**

**Backend:** Ensure all dates are saved in UTC and sent to frontend in ISO format.

**File:** `server/models/Message.js`

Verify timestamps are created correctly:
```javascript
createdAt: { type: Date, default: Date.now }
```

---

### **Fix 3: Debug Timestamp Display**

**Frontend:** Add logging to see what dates are being received.

**File:** `src/pages/Lounge.jsx` (line 527)

Add debug logging:
```javascript
const formatTime = (date) => {
  console.log('🕐 Formatting date:', date, 'Type:', typeof date);
  const messageDate = new Date(date);
  console.log('🕐 Parsed date:', messageDate.toISOString());
  const now = new Date();
  console.log('🕐 Current time:', now.toISOString());
  const diffMs = now - messageDate;
  console.log('🕐 Difference (ms):', diffMs);
  // ... rest of function
};
```

---

## 🚀 **IMMEDIATE DEBUGGING STEPS:**

### **Step 1: Check Socket Connection** (2 minutes)
Open browser console and run:
```javascript
const socket = window.socket || (await import('./src/utils/socket.js')).getSocket();
console.log('Socket connected:', socket?.connected);
console.log('Socket ID:', socket?.id);
```

### **Step 2: Test DM Sending** (3 minutes)
1. Open browser console on BOTH sender and recipient browsers
2. Add this listener on RECIPIENT:
```javascript
const socket = window.socket || (await import('./src/utils/socket.js')).getSocket();
socket.on('message:new', (msg) => {
  console.log('📨 RECIPIENT: Received message:new:', msg);
});
```
3. Send a DM from SENDER
4. Check if recipient console shows the message

### **Step 3: Debug Timestamps** (5 minutes)
Open browser console and run:
```javascript
// Check current time
console.log('Browser time:', new Date().toISOString());

// Check a message timestamp
const msg = document.querySelector('.message-time');
console.log('Message time text:', msg?.textContent);
```

### **Step 4: Check Backend Logs** (2 minutes)
1. Go to Render dashboard: https://dashboard.render.com
2. Open `pryde-backend` service
3. Click "Logs" tab
4. Send a DM and watch for errors

---

## 🔧 **TESTING CHECKLIST:**

- [ ] DMs send and receive instantly
- [ ] Lounge messages appear within 1 second
- [ ] Timestamps show "Just now" for new messages
- [ ] Timestamps show correct relative time (1m, 5m, 1h, etc.)
- [ ] No console errors related to socket events

---

## 📝 **NOTES:**

- The backend was updated to use `message:new` and `message:sent` (Phase R unification)
- The frontend still uses old event names `new_message` and `message_sent`
- This is why DMs don't work - the events don't match!

---

---

## 🛠️ **QUICK DEBUG TOOL:**

I've created a debug script: `debug-messaging.js`

**How to use:**
1. Open your site in browser
2. Open browser console (F12)
3. Copy and paste the contents of `debug-messaging.js`
4. Press Enter
5. Try sending a DM or Lounge message
6. Watch console for detailed logs

The script will show:
- ✅ Socket connection status
- ✅ Current browser time vs server time
- ✅ Active socket listeners
- ✅ Real-time message events with timestamps
- ✅ Timestamp calculation test

---

## 📊 **EXPECTED RESULTS:**

### **If DMs are working:**
```
📨 [message:new] Received: {
  id: "abc123",
  from: "sender_username",
  to: "recipient_username",
  timeDiffMinutes: 0  // Should be 0 or very small
}
```

### **If timestamps are correct:**
```
Test 1: { formatted: "Just now" }  // For current time
Test 2: { formatted: "1m ago" }    // For 1 minute ago
Test 3: { formatted: "1h ago" }    // For 1 hour ago
Test 4: { formatted: "1d ago" }    // For 1 day ago
```

### **If timestamps are broken:**
```
Test 1: { formatted: "1d ago" }  // ❌ WRONG! Should be "Just now"
timeDiffMinutes: 1440            // ❌ This means server is 1 day ahead
```

---

**Next:** Run the debug script and share the console output!

