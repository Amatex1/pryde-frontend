# Debug Messages Not Showing

## Issue Summary
- Messages save to database ✅
- SocketProvider integrated ✅
- But messages disappear on refresh for sender
- Recipient doesn't receive messages

## Debug Steps

### Step 1: Check Socket Connection

Open browser console and run:

```javascript
window.runSocketDiagnostics()
```

Expected output should show:
- Socket Instance: ✅ true
- Connected: ✅ true
- Ready: ✅ true

### Step 2: Monitor Socket Events

Paste this in browser console BEFORE sending a message:

```javascript
// Get socket instance
const socket = window.socket;

// Monitor all message events
socket.on('message:sent', (msg) => {
  console.log('✅ RECEIVED message:sent:', msg);
  console.log('  Message ID:', msg._id);
  console.log('  From:', msg.sender._id);
  console.log('  To:', msg.recipient._id);
  console.log('  Content:', msg.content);
});

socket.on('message:new', (msg) => {
  console.log('📨 RECEIVED message:new:', msg);
  console.log('  Message ID:', msg._id);
  console.log('  From:', msg.sender._id);
  console.log('  To:', msg.recipient._id);
  console.log('  Content:', msg.content);
});

socket.on('message:error', (error) => {
  console.error('❌ RECEIVED message:error:', error);
});

console.log('✅ Event listeners added!');
```

### Step 3: Send a Test Message

1. Go to Messages page
2. Select a conversation
3. Type a message
4. Send it
5. Watch the console

**Expected console output:**

```
📤 Emitting send_message with ACK (attempt 1)
✅ RECEIVED message:sent: {_id: "...", sender: {...}, recipient: {...}, content: "..."}
✅ Message ACK received: {success: true, messageId: "..."}
```

If you're the RECIPIENT (on another device):
```
📨 RECEIVED message:new: {_id: "...", sender: {...}, recipient: {...}, content: "..."}
```

### Step 4: Check Message State

After sending, check React state:

```javascript
// This is harder - need to use React DevTools
// OR check the Messages component in React DevTools
// Look for "messages" state array
```

### Step 5: Check if Messages Page Re-fetches

Open Network tab in DevTools, then:
1. Send a message
2. Refresh the page
3. Check for API call: `GET /api/messages/USER_ID`
4. Check response - should include your sent message

## Common Issues & Fixes

### Issue 1: No socket events received

**Symptoms:**
- No `message:sent` event in console
- No `message:new` event in console

**Causes:**
1. Socket not connected
2. Socket listeners not attached
3. Backend not emitting events

**Debug:**
```javascript
// Check if socket has listeners
const socket = window.socket;
console.log('Socket listeners:', socket._callbacks);

// Should see $message:sent and $message:new
```

**Fix:**
- Check `window.runSocketDiagnostics()`
- Verify SocketProvider is in App.jsx
- Check backend logs for socket emissions

### Issue 2: `message:sent` received but message disappears on refresh

**Symptoms:**
- Message appears briefly after sending
- Disappears when you refresh
- NOT in database

**Cause:** Message not actually saving to database

**Debug:**
```bash
# Check database directly
cd pryde-backend/server
node << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));
  const messages = await Message.find().sort({ createdAt: -1 }).limit(5);
  console.log('Latest 5 messages:');
  messages.forEach((msg, i) => {
    console.log(i, msg._id, msg.content, msg.createdAt);
  });
  process.exit(0);
});
EOF
```

**Fix:**
- Check backend logs for save errors
- Check message validation
- Check for duplicate message IDs

### Issue 3: Message in database but not returned by API

**Symptoms:**
- Message in database (verified with node script)
- `GET /api/messages/:userId` returns empty array or missing message
- Message disappears on refresh

**Debug:**
```javascript
// Test API directly
const recipientId = 'PUT_RECIPIENT_ID_HERE';

fetch(`/api/messages/${recipientId}`, {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Messages from API:', data);
  console.log('Count:', data.length);
});
```

**Causes:**
1. Query filtering messages out
2. Deleted for user
3. Wrong sender/recipient IDs

**Fix:**
- Check backend query in `routes/messages.js:153`
- Check `deletedFor` array
- Verify sender/recipient IDs match

### Issue 4: Optimistic message not replaced

**Symptoms:**
- See temp message briefly
- Disappears when confirmed message arrives
- Duplicate messages

**Cause:** Optimistic UI reconciliation failing

**Debug:**
Check Messages.jsx line ~579 - `onMessageSent` handler

**Fix:**
- Check `_tempId` matches
- Check `_isOptimistic` flag
- Check array index logic

## Test Scenario

### As Sender:

1. Open Messages page
2. Select conversation with User B
3. Send message "Test 1"
4. **Check console:**
   - Should see: `✅ RECEIVED message:sent`
   - Message should appear in UI
5. **Refresh page**
   - Should call: `GET /api/messages/USER_B_ID`
   - Message should still be there

### As Recipient (User B):

1. Open Messages page
2. Select conversation with User A (sender)
3. **Check console:**
   - Should see: `📨 RECEIVED message:new`
   - Message "Test 1" should appear
4. **Refresh page**
   - Should call: `GET /api/messages/USER_A_ID`
   - Message should still be there

## Quick Diagnostic Script

Run this in console to check everything:

```javascript
(async () => {
  console.log('🔍 COMPREHENSIVE MESSAGE DEBUG\n');

  // 1. Check socket
  const socket = window.socket;
  console.log('1. Socket exists:', !!socket);
  console.log('   Connected:', socket?.connected);
  console.log('   Socket ID:', socket?.id);

  // 2. Check user
  const token = localStorage.getItem('token');
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('\n2. Current user ID:', payload.userId);

  // 3. Test API
  try {
    const response = await fetch('/api/messages/list', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const conversations = await response.json();
    console.log('\n3. Conversations count:', conversations.length);
    console.log('   First conversation:', conversations[0]);
  } catch (err) {
    console.error('\n3. API Error:', err);
  }

  // 4. Check socket health
  const health = await import('./utils/socket.js').then(m => m.getConnectionHealth());
  console.log('\n4. Socket health:', health);

  console.log('\n✅ Debug complete!');
})();
```

## If All Else Fails

1. **Check backend logs:**
   ```bash
   # In backend terminal, look for:
   # - Socket connection: "✅ User X joined room: user_X"
   # - Message save: "📤 [send_message] Emitting message"
   # - Socket emit: "✅ [send_message] Emitting to recipient's socket"
   ```

2. **Enable verbose logging:**
   Frontend: `localStorage.setItem('debug', 'true')`
   Backend: `DEBUG=* npm start`

3. **Clear all caches:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   // Then hard refresh (Ctrl+Shift+R)
   ```

4. **Test with curl:**
   ```bash
   # Get your token
   TOKEN="your_jwt_token_here"

   # Test message retrieval
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/messages/RECIPIENT_ID
   ```

---

**TL;DR:** Run `window.runSocketDiagnostics()` then send a message and watch console for events!
