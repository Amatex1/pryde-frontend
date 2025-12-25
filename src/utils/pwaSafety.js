/**
 * PWA Safety & Observability Layer
 * 
 * 🔥 CRITICAL: Emergency controls for PWA stability
 * 
 * Features:
 * - Remote kill-switch via /api/version/status
 * - Frontend ↔ Backend version pinning
 * - Emergency cache clearing
 * - Force reload on version mismatch
 * 
 * This allows instant recovery from broken PWA deployments
 * without redeploying the frontend.
 */

import { API_BASE_URL } from '../config/api';
import logger from './logger';

// Frontend version (injected at build time)
export const FRONTEND_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';

// Version status cache (to avoid hammering the endpoint)
let versionStatusCache = null;
let versionStatusCacheTime = 0;
const VERSION_STATUS_CACHE_TTL = 60000; // 1 minute

/**
 * Fetch version status from backend
 * 
 * @returns {Promise<{pwaEnabled: boolean, minFrontendVersion: string, forceReload: boolean, message: string, backendVersion: string}>}
 */
export async function fetchVersionStatus() {
  const now = Date.now();
  
  // Return cached status if still valid
  if (versionStatusCache && (now - versionStatusCacheTime) < VERSION_STATUS_CACHE_TTL) {
    logger.debug('[PWA Safety] Using cached version status');
    return versionStatusCache;
  }
  
  try {
    logger.debug('[PWA Safety] Fetching version status from backend...');
    
    const response = await fetch(`${API_BASE_URL}/version/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Frontend-Version': FRONTEND_VERSION
      },
      // Don't send credentials for version check
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`Version status fetch failed: ${response.status}`);
    }
    
    const status = await response.json();
    
    // Cache the status
    versionStatusCache = status;
    versionStatusCacheTime = now;
    
    logger.info('[PWA Safety] Version status:', status);
    
    return status;
  } catch (error) {
    logger.error('[PWA Safety] Failed to fetch version status:', error);
    
    // Return safe defaults on error (allow app to continue)
    return {
      pwaEnabled: true,
      minFrontendVersion: '0.0.0',
      forceReload: false,
      message: null,
      backendVersion: 'unknown'
    };
  }
}

/**
 * Check if PWA is enabled via kill-switch
 * 
 * @returns {Promise<boolean>}
 */
export async function isPWAEnabled() {
  const status = await fetchVersionStatus();
  return status.pwaEnabled !== false;
}

/**
 * Check if frontend version is compatible with backend
 * 
 * @returns {Promise<{compatible: boolean, reason: string|null}>}
 */
export async function checkVersionCompatibility() {
  const status = await fetchVersionStatus();
  
  // If no minimum version specified, assume compatible
  if (!status.minFrontendVersion) {
    return { compatible: true, reason: null };
  }
  
	  // Compare versions (simple string comparison for now)
	  // TODO: Use semver library for proper version comparison
	  const currentVersion = FRONTEND_VERSION;
	  const minVersion = status.minFrontendVersion;
	  
	  if (currentVersion === 'dev') {
	    // Dev builds always compatible
	    return { compatible: true, reason: null };
	  }
	  
	  // If either version is not in simple semver format (x.y.z), skip strict check
	  // This prevents false "incompatible" results when using date-based versions
	  const semverRegex = /^\d+(?:\.\d+)*$/;
	  if (!semverRegex.test(currentVersion) || !semverRegex.test(minVersion)) {
	    logger.warn('[PWA Safety] Non-semver version format detected; skipping strict compatibility check', {
	      currentVersion,
	      minVersion
	    });
	    return { compatible: true, reason: null };
	  }
	  
	  // Simple version comparison (assumes x.y.z format)
	  const isCompatible = compareVersions(currentVersion, minVersion) >= 0;
  
  if (!isCompatible) {
    return {
      compatible: false,
      reason: `Frontend version ${currentVersion} is below minimum required version ${minVersion}`
    };
  }
  
  return { compatible: true, reason: null };
}

/**
 * Execute PWA safety checks on app boot
 * 
 * This should be called BEFORE auth bootstrap
 * 
 * @returns {Promise<{safe: boolean, action: string, message: string|null}>}
 */
export async function executePWASafetyChecks() {
  logger.info('[PWA Safety] 🛡️ Executing PWA safety checks...');
  
  try {
    const status = await fetchVersionStatus();
    
    // Check 1: PWA Kill-Switch
    if (status.pwaEnabled === false) {
      logger.warn('[PWA Safety] 🔥 PWA is DISABLED via kill-switch');
      return {
        safe: false,
        action: 'disable_pwa',
        message: status.message || 'PWA is currently disabled for maintenance'
      };
    }
    
    // Check 2: Force Reload
    if (status.forceReload === true) {
      logger.warn('[PWA Safety] 🔄 Force reload requested by backend');
      return {
        safe: false,
        action: 'force_reload',
        message: status.message || 'App update required - reloading...'
      };
    }
    
    // Check 3: Version Compatibility
    const versionCheck = await checkVersionCompatibility();
    if (!versionCheck.compatible) {
      logger.warn('[PWA Safety] ⚠️ Version incompatibility detected');
      return {
        safe: false,
        action: 'version_mismatch',
        message: status.message || versionCheck.reason
      };
    }
    
    logger.info('[PWA Safety] ✅ All safety checks passed');
    return {
      safe: true,
      action: null,
      message: null
    };
  } catch (error) {
    logger.error('[PWA Safety] Safety checks failed:', error);
    
    // On error, allow app to continue (fail open)
    return {
      safe: true,
      action: null,
      message: null
    };
  }
}

/**
 * Compare two semantic versions
 * 
 * @param {string} v1 - Version 1 (e.g., "1.2.3")
 * @param {string} v2 - Version 2 (e.g., "1.2.0")
 * @returns {number} - 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

export { compareVersions };

