/**
 * Emergency Recovery Utilities
 * 
 * 🔥 CRITICAL: Emergency controls for broken PWA deployments
 * 
 * Features:
 * - Disable service worker
 * - Clear all caches
 * - Force full reload (no cache)
 * - Unregister service worker
 * 
 * This allows instant recovery from broken PWA deployments.
 */

import logger from './logger';

/**
 * Disable PWA and force full reload
 *
 * This is the nuclear option - clears everything and reloads
 */
export async function disablePWAAndReload(message = 'PWA disabled - reloading...') {
  // 🔥 LOOP PROTECTION: Prevent infinite reload loops
  const reloadCount = parseInt(sessionStorage.getItem('emergencyReloadCount') || '0', 10);
  const lastReloadTime = parseInt(sessionStorage.getItem('lastEmergencyReload') || '0', 10);
  const now = Date.now();

  // Reset counter if last reload was more than 5 minutes ago
  if (now - lastReloadTime > 300000) {
    sessionStorage.setItem('emergencyReloadCount', '0');
  }

  // If we've reloaded 3+ times in 5 minutes, STOP
  if (reloadCount >= 3) {
    logger.error('[Emergency Recovery] 🚨 RELOAD LOOP DETECTED - ABORTING');
    logger.error(`   Reloaded ${reloadCount} times in the last 5 minutes`);
    logger.error(`   Reason: ${message}`);
    alert('App is stuck in a reload loop. Please clear your browser cache manually or contact support.');
    return;
  }

  // Increment reload counter
  sessionStorage.setItem('emergencyReloadCount', String(reloadCount + 1));
  sessionStorage.setItem('lastEmergencyReload', String(now));

  logger.warn('[Emergency Recovery] 🔥 Disabling PWA and forcing reload');
  logger.warn(`   Reason: ${message}`);
  logger.warn(`   Reload count: ${reloadCount + 1}/3`);

  try {
    // Step 1: Unregister all service workers
    await unregisterAllServiceWorkers();

    // Step 2: Clear all caches
    await clearAllCaches();

    // Step 3: Clear all storage
    clearAllStorage();

    // Step 4: Show message to user
    showEmergencyMessage(message);

    // Step 5: Force reload (no cache)
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  } catch (error) {
    logger.error('[Emergency Recovery] Failed to disable PWA:', error);

    // Force reload anyway
    window.location.reload(true);
  }
}

/**
 * Force reload with cache clear
 *
 * Less aggressive than disablePWAAndReload - keeps service worker
 */
export async function forceReloadWithCacheClear(message = 'Updating app...') {
  // 🔥 LOOP PROTECTION: Prevent infinite reload loops
  const reloadCount = parseInt(sessionStorage.getItem('emergencyReloadCount') || '0', 10);
  const lastReloadTime = parseInt(sessionStorage.getItem('lastEmergencyReload') || '0', 10);
  const now = Date.now();

  // Reset counter if last reload was more than 5 minutes ago
  if (now - lastReloadTime > 300000) {
    sessionStorage.setItem('emergencyReloadCount', '0');
  }

  // If we've reloaded 3+ times in 5 minutes, STOP
  if (reloadCount >= 3) {
    logger.error('[Emergency Recovery] 🚨 RELOAD LOOP DETECTED - ABORTING');
    logger.error(`   Reloaded ${reloadCount} times in the last 5 minutes`);
    logger.error(`   Reason: ${message}`);
    alert('App is stuck in a reload loop. Please clear your browser cache manually or contact support.');
    return;
  }

  // Increment reload counter
  sessionStorage.setItem('emergencyReloadCount', String(reloadCount + 1));
  sessionStorage.setItem('lastEmergencyReload', String(now));

  logger.warn('[Emergency Recovery] 🔄 Forcing reload with cache clear');
  logger.warn(`   Reason: ${message}`);
  logger.warn(`   Reload count: ${reloadCount + 1}/3`);

  try {
    // Step 1: Clear all caches
    await clearAllCaches();

    // Step 2: Show message to user
    showEmergencyMessage(message);

    // Step 3: Force reload (no cache)
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  } catch (error) {
    logger.error('[Emergency Recovery] Failed to clear caches:', error);

    // Force reload anyway
    window.location.reload(true);
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    logger.debug('[Emergency Recovery] Service workers not supported');
    return;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    logger.info(`[Emergency Recovery] Unregistering ${registrations.length} service workers...`);
    
    for (const registration of registrations) {
      await registration.unregister();
      logger.debug(`[Emergency Recovery] Unregistered service worker: ${registration.scope}`);
    }
    
    logger.info('[Emergency Recovery] ✅ All service workers unregistered');
  } catch (error) {
    logger.error('[Emergency Recovery] Failed to unregister service workers:', error);
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  if (!('caches' in window)) {
    logger.debug('[Emergency Recovery] Cache API not supported');
    return;
  }
  
  try {
    const cacheNames = await caches.keys();
    
    logger.info(`[Emergency Recovery] Clearing ${cacheNames.length} caches...`);
    
    await Promise.all(
      cacheNames.map(name => {
        logger.debug(`[Emergency Recovery] Deleting cache: ${name}`);
        return caches.delete(name);
      })
    );
    
    logger.info('[Emergency Recovery] ✅ All caches cleared');
  } catch (error) {
    logger.error('[Emergency Recovery] Failed to clear caches:', error);
  }
}

/**
 * Clear all storage (localStorage, sessionStorage, IndexedDB)
 */
export function clearAllStorage() {
  try {
    logger.info('[Emergency Recovery] Clearing all storage...');
    
    // Clear localStorage
    localStorage.clear();
    logger.debug('[Emergency Recovery] localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    logger.debug('[Emergency Recovery] sessionStorage cleared');
    
    // Clear IndexedDB (if supported)
    if ('indexedDB' in window) {
      // Note: Can't easily clear all IndexedDB databases
      // This would require knowing database names
      logger.debug('[Emergency Recovery] IndexedDB not cleared (requires database names)');
    }
    
    logger.info('[Emergency Recovery] ✅ Storage cleared');
  } catch (error) {
    logger.error('[Emergency Recovery] Failed to clear storage:', error);
  }
}

/**
 * Show emergency message to user
 */
function showEmergencyMessage(message) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Create message box
  const messageBox = document.createElement('div');
  messageBox.style.cssText = `
    background: white;
    padding: 32px;
    border-radius: 12px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  
  messageBox.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #333;">Updating App</h2>
    <p style="margin: 0; color: #666; font-size: 14px;">${message}</p>
    <div style="margin-top: 24px;">
      <div style="width: 100%; height: 4px; background: #eee; border-radius: 2px; overflow: hidden;">
        <div style="width: 100%; height: 100%; background: #6C5CE7; animation: loading 1s ease-in-out infinite;"></div>
      </div>
    </div>
  `;
  
  overlay.appendChild(messageBox);
  document.body.appendChild(overlay);
  
  // Add loading animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes loading {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Check if emergency recovery is needed
 * 
 * This checks for common signs of a broken PWA state
 */
export function isEmergencyRecoveryNeeded() {
  try {
    // Check 1: Can we access localStorage?
    localStorage.getItem('test');
    
    // Check 2: Is the DOM in a valid state?
    if (!document.body) {
      return true;
    }
    
    // Check 3: Are there any critical errors in sessionStorage?
    const criticalError = sessionStorage.getItem('criticalError');
    if (criticalError) {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('[Emergency Recovery] Error checking recovery status:', error);
    return true;
  }
}

