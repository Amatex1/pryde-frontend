/**
 * Quiet Mode Utility Functions
 * DEPRECATED: Use themeManager.js instead
 * This file is kept for backward compatibility
 */

import { setQuietMode, applyUserTheme } from './themeManager';

/**
 * Apply quiet mode to the document
 * @param {boolean} isActive - Whether quiet mode should be active
 * @deprecated Use setQuietMode from themeManager.js instead
 */
export const applyQuietMode = (isActive) => {
  setQuietMode(isActive);
};

/**
 * Initialize quiet mode on app startup
 * @param {Object} user - User object with privacy settings
 * @deprecated Use applyUserTheme from themeManager.js instead
 */
export const initializeQuietMode = (user) => {
  if (!user || !user.privacySettings) {
    return;
  }

  const quietModeEnabled = user.privacySettings.quietModeEnabled || false;
  setQuietMode(quietModeEnabled);

  return quietModeEnabled;
};

