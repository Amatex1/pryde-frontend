/**
 * GLOBAL THEME MANAGER
 * Centralized theme and quiet mode initialization
 * Sets data-theme and data-quiet attributes on root element
 */

/**
 * Initialize theme attributes on document root
 * Called on app startup to ensure proper theme state
 */
export const initializeTheme = () => {
  const savedDarkMode = localStorage.getItem('darkMode');
  const savedQuietMode = localStorage.getItem('quietMode');

  // Set data-theme attribute (default: dark)
  const theme = savedDarkMode === 'false' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  // Set data-quiet attribute (default: false)
  const quietMode = savedQuietMode === 'true' ? 'true' : 'false';
  document.documentElement.setAttribute('data-quiet', quietMode);

  return { theme, quietMode: quietMode === 'true' };
};

/**
 * Set theme (light or dark)
 * @param {string} theme - 'light' or 'dark'
 */
export const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');
};

/**
 * Toggle theme between light and dark
 * @returns {string} - New theme value
 */
export const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  return newTheme;
};

/**
 * Set quiet mode
 * @param {boolean} enabled - Whether quiet mode is enabled
 */
export const setQuietMode = (enabled) => {
  const value = enabled ? 'true' : 'false';
  document.documentElement.setAttribute('data-quiet', value);
  localStorage.setItem('quietMode', value);
};

/**
 * Toggle quiet mode
 * @returns {boolean} - New quiet mode state
 */
export const toggleQuietMode = () => {
  const current = document.documentElement.getAttribute('data-quiet') === 'true';
  const newValue = !current;
  setQuietMode(newValue);
  return newValue;
};

/**
 * Get current theme
 * @returns {string} - 'light' or 'dark'
 */
export const getTheme = () => {
  return document.documentElement.getAttribute('data-theme') || 'dark';
};

/**
 * Get current quiet mode state
 * @returns {boolean}
 */
export const getQuietMode = () => {
  return document.documentElement.getAttribute('data-quiet') === 'true';
};

/**
 * Apply theme from user settings
 * @param {Object} user - User object with privacy settings
 */
export const applyUserTheme = (user) => {
  if (!user) return;

  // Apply quiet mode if user has it enabled
  if (user.privacySettings?.quietModeEnabled) {
    setQuietMode(true);
  }

  // Note: Dark mode is handled separately by localStorage
  // This function only syncs quiet mode from backend
};

