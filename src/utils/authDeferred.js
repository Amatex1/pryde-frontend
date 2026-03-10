import api from './api';
import { abortAllRequests, clearCache } from './apiClient';
import { cleanupAuthLifecycle } from './authLifecycle';
import { clearAllDrafts } from './draftStore';
import { clearAllEntities } from './mutationGuard';
import { disconnectSocketForLogout } from './socket';
import { refreshAccessToken } from './tokenRefresh';

export async function runPreTokenClearLogoutWork() {
  try {
    abortAllRequests();
    console.log('✅ Aborted in-flight requests');
  } catch (error) {
    console.debug('No abort function available');
  }

  try {
    disconnectSocketForLogout();
    console.log('✅ Socket disconnected');
  } catch (error) {
    console.debug('Socket disconnect skipped');
  }

  try {
    cleanupAuthLifecycle();
    console.log('✅ Auth lifecycle stopped');
  } catch (error) {
    console.debug('Auth lifecycle cleanup skipped');
  }

  try {
    await api.post('/auth/logout').catch((err) => {
      console.warn('Backend logout request failed:', err.message);
    });
    console.log('✅ Backend logout called (cookie should be cleared)');
  } catch (error) {
    console.debug('Backend logout skipped');
  }
}

export function runPostTokenClearLogoutWork() {
  try {
    clearCache();
    console.log('✅ API cache cleared');
  } catch (error) {
    console.debug('Cache clear skipped');
  }

  try {
    clearAllDrafts();
    console.log('✅ Draft data cleared');
  } catch (error) {
    console.error('Failed to clear drafts:', error);
  }

  try {
    clearAllEntities();
    console.log('✅ Mutation guard cleared');
  } catch (error) {
    console.error('Failed to clear mutation guard:', error);
  }
}

export async function refreshBeforeUpdateWithSingleFlight() {
  try {
    const accessToken = await refreshAccessToken();

    if (accessToken) {
      console.log('✅ Token refreshed before update via global single-flight');
    } else {
      console.warn('⚠️ Token refresh returned null before update');
    }
  } catch (err) {
    console.warn('⚠️ Token refresh failed during update:', err.message);
  }
}