/**
 * Socket.IO Diagnostic Tool
 * Run this in browser console to diagnose socket issues
 */

import { getSocket, isSocketConnected, isConnectionReady, getConnectionHealth, getMessageQueueLength } from './socket';
import logger from './logger';

export const runSocketDiagnostics = () => {
  console.log('🔍 SOCKET DIAGNOSTICS');
  console.log('='.repeat(60));

  // 1. Check socket instance
  const socket = getSocket();
  console.log('\n1️⃣ Socket Instance:');
  console.log('   Exists:', !!socket);
  console.log('   Type:', typeof socket);

  if (!socket) {
    console.error('   ❌ Socket is null/undefined!');
    console.log('   💡 Fix: Call initializeSocket(userId) first');
    return { critical: 'NO_SOCKET' };
  }

  // 2. Check connection status
  const isConnected = isSocketConnected();
  const isReady = isConnectionReady();
  console.log('\n2️⃣ Connection Status:');
  console.log('   Connected:', isConnected ? '✅' : '❌');
  console.log('   Ready (room joined):', isReady ? '✅' : '❌');
  console.log('   Socket ID:', socket.id || 'N/A');
  console.log('   Transport:', socket.io?.engine?.transport?.name || 'N/A');

  if (!isConnected) {
    console.error('   ❌ Socket not connected!');
    console.log('   💡 Fix: Check backend is running, CORS settings, JWT token');
    return { critical: 'NOT_CONNECTED' };
  }

  if (!isReady) {
    console.warn('   ⚠️ Socket connected but room not joined!');
    console.log('   💡 Fix: Waiting for room:joined event');
  }

  // 3. Check connection health
  const health = getConnectionHealth();
  console.log('\n3️⃣ Connection Health:');
  console.log('   Healthy:', health.isHealthy ? '✅' : '❌');
  console.log('   Last Pong:', new Date(health.lastPongTime).toLocaleTimeString());
  console.log('   Time Since Pong:', Math.round(health.timeSinceLastPong / 1000) + 's');

  // 4. Check message queue
  const queueLength = getMessageQueueLength();
  console.log('\n4️⃣ Message Queue:');
  console.log('   Queue Length:', queueLength);
  if (queueLength > 0) {
    console.warn(`   ⚠️ ${queueLength} messages queued!`);
    console.log('   💡 Messages will send when connection is ready');
  } else {
    console.log('   ✅ Queue is empty');
  }

  // 5. Check rooms
  console.log('\n5️⃣ Requesting Room Info...');
  socket.emit('debug:rooms', (rooms) => {
    if (!rooms) {
      console.log('   ⚠️ No room info received (server may not support debug:rooms)');
      return;
    }
    console.log('   Rooms joined:', rooms.rooms);
    console.log('   User ID:', rooms.userId);
    console.log('   Socket ID:', rooms.socketId);
    console.log('   Is Online:', rooms.isOnline ? '✅' : '❌');
  });

  // 6. Check event listeners
  console.log('\n6️⃣ Event Listeners:');
  const eventCounts = socket._callbacks ? Object.keys(socket._callbacks).length : 0;
  console.log('   Total listeners:', eventCounts);

  // Test if listeners are attached
  const testEvents = ['message:new', 'message:sent', 'notification:new', 'room:joined'];
  testEvents.forEach(event => {
    const hasListener = socket.hasListeners && socket.hasListeners(event);
    console.log(`   ${event}:`, hasListener ? '✅' : '❌');
  });

  // 7. Test ping
  console.log('\n7️⃣ Testing Ping...');
  socket.emit('ping', (response) => {
    if (response && response.status === 'ok') {
      console.log('   ✅ Ping successful!');
      console.log('   Response:', response);
    } else {
      console.error('   ❌ Ping failed or unexpected response');
    }
  });

  // 8. Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');

  const issues = [];
  const warnings = [];

  if (!socket) issues.push('Socket not initialized');
  if (!isConnected) issues.push('Socket not connected');
  if (!isReady) warnings.push('Room not joined (waiting for confirmation)');
  if (!health.isHealthy) warnings.push('Connection unhealthy');
  if (queueLength > 0) warnings.push(`${queueLength} messages queued`);

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ Everything looks good!');
  } else {
    if (issues.length > 0) {
      console.error('\n❌ CRITICAL ISSUES:');
      issues.forEach(issue => console.error(`   - ${issue}`));
    }
    if (warnings.length > 0) {
      console.warn('\n⚠️ WARNINGS:');
      warnings.forEach(warning => console.warn(`   - ${warning}`));
    }
  }

  console.log('\n💡 Next Steps:');
  if (!socket) {
    console.log('   1. Make sure SocketProvider is added to App.jsx');
    console.log('   2. Make sure you are logged in');
    console.log('   3. Check browser console for errors');
  } else if (!isConnected) {
    console.log('   1. Check if backend is running');
    console.log('   2. Check CORS settings allow socket connections');
    console.log('   3. Check JWT token is valid');
    console.log('   4. Check network tab for socket connection errors');
  } else if (!isReady) {
    console.log('   1. Wait 3 seconds for fallback timer');
    console.log('   2. Check backend emits room:joined event');
    console.log('   3. Try manually: socket.emit("join", userId)');
  } else {
    console.log('   1. Try sending a test message');
    console.log('   2. Check backend logs for message events');
    console.log('   3. Check if recipient is online');
  }

  console.log('='.repeat(60));

  return {
    socket: !!socket,
    connected: isConnected,
    ready: isReady,
    healthy: health.isHealthy,
    queueLength,
    issues,
    warnings
  };
};

// Expose to window for easy access in console
if (typeof window !== 'undefined') {
  window.runSocketDiagnostics = runSocketDiagnostics;
  console.log('💡 Socket diagnostics loaded! Run window.runSocketDiagnostics() in console');
}

export default runSocketDiagnostics;
