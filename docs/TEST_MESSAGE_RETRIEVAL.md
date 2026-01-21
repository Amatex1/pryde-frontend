# Test Message Retrieval

## Messages ARE in Database ✅

Just verified - 35 messages saved, latest from today (2026-01-14).

Sender: `69243d5a85208e791eee17a3`
Recipient: `6925007f6b6b3530900fee8f`

## Test REST API Directly

Open browser console while logged in and run:

```javascript
// Test 1: Get your conversations list
fetch('/api/messages/list', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Conversations:', data);
  console.log('Number of conversations:', data.length);
});

// Test 2: Get messages with specific user
// Replace USER_ID with the recipient ID from above
const recipientId = '6925007f6b6b3530900fee8f';

fetch(`/api/messages/${recipientId}`, {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log('Messages:', data);
  console.log('Number of messages:', data.length);
  console.log('First message:', data[0]);
  console.log('Last message:', data[data.length - 1]);
});
```

## Expected Results

### Conversations List
Should return array of conversations with:
- `otherUser` object (username, profilePhoto)
- `lastMessage` object
- `unreadCount` number

### Messages
Should return array of messages with:
- `_id`
- `sender` object (username, profilePhoto)
- `recipient` object
- `content` (decrypted)
- `createdAt`
- `read` boolean

## If No Messages Returned

Check:
1. **JWT token valid?**
   ```javascript
   localStorage.getItem('token')
   ```

2. **User ID correct?**
   ```javascript
   const token = localStorage.getItem('token');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Your user ID:', payload.userId);
   ```

3. **Backend logs?**
   - Should show: `📥 [GET /messages/:userId] Fetching conversation`
   - Should show: `📬 [GET /messages/:userId] Messages retrieved`

4. **Network tab?**
   - Check request URL
   - Check response status (should be 200)
   - Check response body

## Common Issues

### Issue: Empty array returned
**Cause:** Querying wrong user ID or user IDs don't match

**Fix:** Make sure you're using the EXACT user ID from the database:
- Sender: `69243d5a85208e791eee17a3`
- Recipient: `6925007f6b6b3530900fee8f`

### Issue: 401 Unauthorized
**Cause:** JWT token expired or invalid

**Fix:** Re-login and try again

### Issue: 403 Blocked
**Cause:** User is blocked

**Fix:** Check blocking status

## Test Socket Events

Once REST API works, test socket:

```javascript
// Import socket
import { getSocket } from './utils/socket';

const socket = getSocket();

// Listen for new messages
socket.on('message:new', (msg) => {
  console.log('🔔 New message received via socket:', msg);
});

// Listen for sent confirmation
socket.on('message:sent', (msg) => {
  console.log('✅ Message sent confirmation:', msg);
});

// Send a test message
socket.emit('send_message', {
  recipientId: '6925007f6b6b3530900fee8f',
  content: 'Test from socket',
  _tempId: 'temp_' + Date.now()
}, (response) => {
  console.log('ACK response:', response);
});
```

## Next Steps

1. **Run REST API tests above**
2. **Check if messages are returned**
3. **If not, check backend logs**
4. **Then test socket events**

The database has the messages - we just need to confirm the API is returning them correctly.
