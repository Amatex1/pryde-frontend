/**
 * Messaging Debug Script
 * 
 * Paste this into browser console to debug DM and timestamp issues
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Try sending a DM
 * 5. Check console for detailed logs
 */

(async function debugMessaging() {
  console.log('🔍 Starting messaging debug...');
  console.log('');

  // Import socket utilities
  let socket;
  try {
    const socketModule = await import('./src/utils/socket.js');
    socket = socketModule.getSocket();
  } catch (error) {
    console.error('❌ Failed to import socket module:', error);
    console.log('💡 Try: const socket = window.socket');
    socket = window.socket;
  }

  // Check 1: Socket Connection
  console.log('=== SOCKET CONNECTION ===');
  console.log('Socket exists:', !!socket);
  console.log('Socket connected:', socket?.connected);
  console.log('Socket ID:', socket?.id);
  console.log('Socket transport:', socket?.io?.engine?.transport?.name);
  console.log('');

  // Check 2: Current Time
  console.log('=== TIME CHECK ===');
  const now = new Date();
  console.log('Browser time (local):', now.toString());
  console.log('Browser time (UTC):', now.toISOString());
  console.log('Browser timezone offset:', now.getTimezoneOffset(), 'minutes');
  console.log('');

  // Check 3: Socket Event Listeners
  console.log('=== SOCKET LISTENERS ===');
  if (socket) {
    const events = ['message:new', 'message:sent', 'new_message', 'message_sent'];
    events.forEach(event => {
      const count = socket.listeners(event).length;
      console.log(`${event}: ${count} listener(s)`, count > 0 ? '✅' : '⚠️');
    });
  }
  console.log('');

  // Check 4: Add Debug Listeners
  console.log('=== ADDING DEBUG LISTENERS ===');
  if (socket) {
    // Listen for DM events
    socket.on('message:new', (msg) => {
      console.log('📨 [message:new] Received:', {
        id: msg._id,
        from: msg.sender?.username,
        to: msg.recipient?.username,
        content: msg.content?.substring(0, 50),
        createdAt: msg.createdAt,
        createdAtParsed: new Date(msg.createdAt).toISOString(),
        timeDiff: Date.now() - new Date(msg.createdAt).getTime(),
        timeDiffMinutes: Math.floor((Date.now() - new Date(msg.createdAt).getTime()) / 60000)
      });
    });

    socket.on('message:sent', (msg) => {
      console.log('✅ [message:sent] Confirmed:', {
        id: msg._id,
        to: msg.recipient?.username,
        createdAt: msg.createdAt,
        createdAtParsed: new Date(msg.createdAt).toISOString()
      });
    });

    // Listen for Lounge events
    socket.on('global_message:new', (msg) => {
      console.log('🌍 [global_message:new] Received:', {
        id: msg._id,
        from: msg.author?.username,
        text: msg.text?.substring(0, 50),
        createdAt: msg.createdAt,
        createdAtParsed: new Date(msg.createdAt).toISOString(),
        timeDiff: Date.now() - new Date(msg.createdAt).getTime(),
        timeDiffMinutes: Math.floor((Date.now() - new Date(msg.createdAt).getTime()) / 60000)
      });
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('❌ [error] Socket error:', error);
    });

    console.log('✅ Debug listeners added!');
  } else {
    console.error('❌ Socket not available');
  }
  console.log('');

  // Check 5: Test Message Timestamp Formatting
  console.log('=== TIMESTAMP FORMATTING TEST ===');
  const testDates = [
    new Date(), // Now
    new Date(Date.now() - 60000), // 1 minute ago
    new Date(Date.now() - 3600000), // 1 hour ago
    new Date(Date.now() - 86400000), // 1 day ago
    new Date(Date.now() + 86400000), // 1 day in future (should show negative)
  ];

  testDates.forEach((date, i) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let formatted;
    if (diffMins < 1) formatted = 'Just now';
    else if (diffMins < 60) formatted = `${diffMins}m ago`;
    else if (diffHours < 24) formatted = `${diffHours}h ago`;
    else formatted = `${diffDays}d ago`;

    console.log(`Test ${i + 1}:`, {
      date: date.toISOString(),
      diffMs,
      diffMins,
      formatted
    });
  });
  console.log('');

  // Instructions
  console.log('=== NEXT STEPS ===');
  console.log('1. Try sending a DM');
  console.log('2. Watch console for [message:new] or [message:sent] events');
  console.log('3. Check if timeDiffMinutes is correct');
  console.log('4. If timeDiffMinutes is ~1440 (1 day), server clock is off');
  console.log('');
  console.log('💡 To stop debug listeners, refresh the page');
})();

