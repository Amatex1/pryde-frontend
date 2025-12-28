/**
 * GLOBAL THEME MANAGER
 * Centralized theme and quiet mode initialization
 * Sets data-theme and data-quiet attributes on root element
 *
 * QUIET MODE V2 adds sub-toggles:
 * - data-quiet-visuals: Calm visuals (motion, spacing, urgency)
 * - data-quiet-writing: Writing focus mode (distraction-free)
 * - data-quiet-metrics: Hide engagement metrics (likes, counts)
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

  // QUIET MODE V2: Initialize sub-toggles from localStorage
  const quietVisuals = localStorage.getItem('quietVisuals') ?? 'true';
  const quietWriting = localStorage.getItem('quietWriting') ?? 'true';
  const quietMetrics = localStorage.getItem('quietMetrics') ?? 'false';

  // Only apply sub-toggles if quiet mode is enabled
  if (quietMode === 'true') {
    document.documentElement.setAttribute('data-quiet-visuals', quietVisuals);
    document.documentElement.setAttribute('data-quiet-writing', quietWriting);
    document.documentElement.setAttribute('data-quiet-metrics', quietMetrics);
  } else {
    // Remove sub-toggle attributes when quiet mode is off
    document.documentElement.removeAttribute('data-quiet-visuals');
    document.documentElement.removeAttribute('data-quiet-writing');
    document.documentElement.removeAttribute('data-quiet-metrics');
  }

  return {
    theme,
    quietMode: quietMode === 'true',
    quietVisuals: quietVisuals === 'true',
    quietWriting: quietWriting === 'true',
    quietMetrics: quietMetrics === 'true'
  };
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

  // QUIET MODE V2: Apply or remove sub-toggle attributes
  if (enabled) {
    // Apply sub-toggles from localStorage (with defaults)
    const quietVisuals = localStorage.getItem('quietVisuals') ?? 'true';
    const quietWriting = localStorage.getItem('quietWriting') ?? 'true';
    const quietMetrics = localStorage.getItem('quietMetrics') ?? 'false';

    document.documentElement.setAttribute('data-quiet-visuals', quietVisuals);
    document.documentElement.setAttribute('data-quiet-writing', quietWriting);
    document.documentElement.setAttribute('data-quiet-metrics', quietMetrics);
  } else {
    // Remove sub-toggle attributes when quiet mode is off
    document.documentElement.removeAttribute('data-quiet-visuals');
    document.documentElement.removeAttribute('data-quiet-writing');
    document.documentElement.removeAttribute('data-quiet-metrics');
  }
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
 * QUIET MODE V2: Set a specific sub-toggle
 * @param {string} toggle - 'visuals', 'writing', or 'metrics'
 * @param {boolean} enabled - Whether the toggle is enabled
 */
export const setQuietSubToggle = (toggle, enabled) => {
  const validToggles = ['visuals', 'writing', 'metrics'];
  if (!validToggles.includes(toggle)) {
    console.warn(`Invalid quiet mode toggle: ${toggle}`);
    return;
  }

  const key = `quiet${toggle.charAt(0).toUpperCase() + toggle.slice(1)}`;
  const attrName = `data-quiet-${toggle}`;
  const value = enabled ? 'true' : 'false';

  localStorage.setItem(key, value);

  // Only apply attribute if quiet mode is enabled
  if (document.documentElement.getAttribute('data-quiet') === 'true') {
    document.documentElement.setAttribute(attrName, value);
  }
};

/**
 * QUIET MODE V2: Get the state of a sub-toggle
 * @param {string} toggle - 'visuals', 'writing', or 'metrics'
 * @returns {boolean}
 */
export const getQuietSubToggle = (toggle) => {
  const validToggles = ['visuals', 'writing', 'metrics'];
  if (!validToggles.includes(toggle)) {
    console.warn(`Invalid quiet mode toggle: ${toggle}`);
    return false;
  }

  const key = `quiet${toggle.charAt(0).toUpperCase() + toggle.slice(1)}`;
  const defaults = { visuals: 'true', writing: 'true', metrics: 'false' };
  return (localStorage.getItem(key) ?? defaults[toggle]) === 'true';
};

/**
 * QUIET MODE V2: Get all quiet mode settings
 * @returns {Object} - All quiet mode settings
 */
export const getQuietModeSettings = () => {
  return {
    enabled: getQuietMode(),
    visuals: getQuietSubToggle('visuals'),
    writing: getQuietSubToggle('writing'),
    metrics: getQuietSubToggle('metrics')
  };
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

  const settings = user.privacySettings;
  if (!settings) return;

  // Apply quiet mode if user has it enabled
  if (settings.quietModeEnabled) {
    setQuietMode(true);
  }

  // QUIET MODE V2: Sync sub-toggles from backend
  if (settings.quietVisuals !== undefined) {
    localStorage.setItem('quietVisuals', settings.quietVisuals ? 'true' : 'false');
  }
  if (settings.quietWriting !== undefined) {
    localStorage.setItem('quietWriting', settings.quietWriting ? 'true' : 'false');
  }
  if (settings.quietMetrics !== undefined) {
    localStorage.setItem('quietMetrics', settings.quietMetrics ? 'true' : 'false');
  }

  // Re-apply quiet mode to ensure sub-toggles are set correctly
  if (settings.quietModeEnabled) {
    setQuietMode(true);
  }
};

