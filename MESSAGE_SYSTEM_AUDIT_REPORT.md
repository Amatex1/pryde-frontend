# 🔍 MESSAGE SYSTEM AUDIT REPORT

**Date:** January 14, 2026  
**Issue:** Messages not being received from PC (@amatex) to Mobile/PWA (@test)

---

## 🚨 **CRITICAL BUGS FOUND & FIXED:**

### **1. ✅ FIXED: Duplicate Messages Not Decrypting**

**Problem:**
- Line 771 in `server.js` used `.lean()` on duplicate message query
- `.lean()` returns plain JavaScript object (skips Mongoose methods)
- `toJSON()` method never called → encrypted messages not decrypted
- Recipients received encrypted hex strings

**Fix:**
- Removed `.lean()` from duplicate message query
- Now properly calls `toJSON()` which decrypts messages

**Impact:** **CRITICAL** - This could cause messages to appear as hex strings

---

### **2. ✅ ADDED: Comprehensive Logging**

**Added logging for:**
- Message details before emitting (content preview, IDs)
- Recipient socket lookup (online status, socket ID)
- All socket room emissions (user rooms + direct sockets)
- User room joins on connection
- Online users count

**Purpose:** Diagnose why messages aren't reaching mobile/PWA users

---

## 📊 **MESSAGE FLOW ANALYSIS:**

### **Backend Flow (server.js):**

```
1. Client emits 'send_message' event
   ↓
2. Validate data (recipientId, content/attachment)
   ↓
3. Sanitize content (XSS prevention)
   ↓
4. Create message with deduplication
   ↓
5. Save to MongoDB
   ↓
6. Populate sender/recipient
   ↓
7. Emit to recipient:
   - Direct socket (if online): io.to(recipientSocketId)
   - User room: io.to(`user_${recipientId}`)
   ↓
8. Emit confirmation to sender:
   - Direct socket: socket.emit('message:sent')
   - User room: io.to(`user_${senderId}`)
   ↓
9. Create notification (background)
```

### **Frontend Flow (Messages.jsx):**

```
1. User types message
   ↓
2. Click send button
   ↓
3. Call socketSendMessage() from socket.js
   ↓
4. Emit 'send_message' event with:
   - recipientId
   - content
   - attachment (optional)
   ↓
5. Listen for 'message:sent' (confirmation)
   ↓
6. Listen for 'message:new' (incoming messages)
   ↓
7. Update UI with new message
```

---

## 🔍 **POTENTIAL ISSUES TO CHECK:**

### **1. Socket Connection Issues**

**Symptoms:**
- Messages not received on mobile/PWA
- Works on PC but not mobile

**Possible Causes:**
- Mobile not connecting to Socket.IO
- Mobile not joining `user_${userId}` room
- Socket disconnecting on mobile

**How to Check:**
1. Open mobile browser console
2. Look for: `🔌 User connected: ${userId}`
3. Look for: `✅ User ${userId} joined room: user_${userId}`
4. Check if socket stays connected

---

### **2. User ID Mismatch**

**Symptoms:**
- Messages sent but not received
- No errors in console

**Possible Causes:**
- Recipient ID incorrect
- User ID from JWT doesn't match database ID

**How to Check:**
1. Send message from PC to mobile
2. Check backend logs for:
   ```
   📡 [send_message] Recipient socket lookup:
   recipientId: <ID>
   recipientSocketId: <SOCKET_ID or NOT_ONLINE>
   ```
3. Verify recipientId matches mobile user's ID

---

### **3. Socket Room Subscription**

**Symptoms:**
- Direct socket emission works
- User room emission doesn't work

**Possible Causes:**
- User not joining `user_${userId}` room
- Room name mismatch

**How to Check:**
1. Check backend logs on mobile connection:
   ```
   ✅ User ${userId} joined room: user_${userId}
   ```
2. Check if room name matches emission:
   ```
   📡 [send_message] Emitting to recipient's user room: user_${recipientId}
   ```

---

### **4. Message Listener Not Set Up**

**Symptoms:**
- Backend emits message
- Frontend doesn't receive it

**Possible Causes:**
- `onNewMessage()` listener not attached
- Listener removed prematurely
- Socket not initialized

**How to Check:**
1. Open mobile console
2. Look for: `🎧 Setting up message socket listeners`
3. Verify `message:new` listener is attached

---

## 🧪 **TESTING INSTRUCTIONS:**

### **Step 1: Wait for Backend Deploy**
- Wait 2-3 minutes for Render to deploy
- Check Render logs for successful deployment

### **Step 2: Test PC → Mobile**

**On PC (@amatex):**
1. Open https://prydeapp.com/messages
2. Select @test user
3. Send message: "Test from PC"
4. Check browser console for:
   ```
   📤 Emitting send_message
   ```

**On Mobile (@test):**
1. Open https://prydeapp.com/messages
2. Open browser console (Chrome DevTools)
3. Look for:
   ```
   📨 Received new_message event
   ✅ Message is for selected chat, adding to messages
   ```

### **Step 3: Check Backend Logs**

Go to Render dashboard → pryde-backend → Logs

Look for:
```
📨 [send_message] Received from user <AMATEX_ID>
✅ [send_message] Validated, creating message
📤 [send_message] Emitting message: { messageId, sender, recipient }
📡 [send_message] Recipient socket lookup: { recipientId, recipientSocketId }
✅ [send_message] Emitting to recipient's socket: <SOCKET_ID>
📡 [send_message] Emitting to recipient's user room: user_<TEST_ID>
```

### **Step 4: Check Mobile Connection**

**On Mobile (@test):**
1. Open browser console
2. Look for:
   ```
   🔌 Connecting socket
   🔌 Socket connected successfully
   ```
3. Check if socket stays connected (no disconnect messages)

---

## 📝 **WHAT TO REPORT:**

After testing, please provide:

1. **Backend Logs:**
   - Copy the full log output when sending a message
   - Include recipient socket lookup section

2. **Mobile Console:**
   - Screenshot or copy console output
   - Include any errors or warnings

3. **PC Console:**
   - Screenshot or copy console output when sending

4. **Symptoms:**
   - Does message appear on PC?
   - Does message appear on mobile?
   - Does message persist after refresh?

---

## ✅ **EXPECTED BEHAVIOR:**

**When working correctly:**

1. PC sends message
2. Backend logs show:
   - Message received
   - Message saved
   - Emitting to recipient socket
   - Emitting to recipient user room
3. Mobile receives message instantly
4. Message appears in chat
5. Message persists after refresh

---

**Next:** Deploy backend and test with the instructions above. Report findings!

