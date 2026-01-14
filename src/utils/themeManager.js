/**
 * GLOBAL THEME MANAGER
 * Centralized theme and quiet mode initialization
 * Sets data-theme and data-quiet attributes on root element
 *
 * QUIET MODE V2 adds sub-toggles:
 * - data-quiet-visuals: Calm visuals (motion, spacing, urgency)
 * - data-quiet-writing: Writing focus mode (distraction-free)
 * - data-quiet-metrics: Hide engagement metrics (likes, counts)
 *
 * CURSOR CUSTOMIZATION adds:
 * - data-cursor: Optional cursor style (system, soft-rounded, calm-dot, high-contrast, reduced-motion)
 */

// PWA theme colors matching CSS variables
const THEME_COLORS = {
  light: '#F5F6FA', // --bg-page light mode
  dark: '#0F1021'   // --bg-page dark mode
};

/**
 * Update PWA theme-color meta tag for mobile browser chrome
 * @param {string} theme - 'light' or 'dark'
 */
const updateThemeColorMeta = (theme) => {
  const color = THEME_COLORS[theme] || THEME_COLORS.dark;

  // Update all theme-color meta tags (there may be multiple with media queries)
  const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
  themeColorMetas.forEach(meta => {
    // Only update the one without media query, or remove media query approach
    if (!meta.getAttribute('media')) {
      meta.setAttribute('content', color);
    }
  });

  // If no theme-color meta without media query exists, create one
  if (!document.querySelector('meta[name="theme-color"]:not([media])')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }
};

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

  // 🔒 PWA FIX: Update theme-color meta for mobile browser chrome
  updateThemeColorMeta(theme);

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

  // CURSOR CUSTOMIZATION: Initialize cursor style from localStorage
  const savedCursorStyle = localStorage.getItem('cursorStyle') || 'system';
  if (savedCursorStyle !== 'system') {
    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && savedCursorStyle !== 'reduced-motion') {
      document.documentElement.setAttribute('data-cursor', 'reduced-motion');
    } else {
      document.documentElement.setAttribute('data-cursor', savedCursorStyle);
    }
  }

  return {
    theme,
    quietMode: quietMode === 'true',
    quietVisuals: quietVisuals === 'true',
    quietWriting: quietWriting === 'true',
    quietMetrics: quietMetrics === 'true',
    cursorStyle: savedCursorStyle
  };
};

/**
 * Set theme (light or dark)
 * @param {string} theme - 'light' or 'dark'
 */
export const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('darkMode', theme === 'dark' ? 'true' : 'false');

  // 🔒 PWA FIX: Update theme-color meta for mobile browser chrome
  updateThemeColorMeta(theme);

  // 📱 Update iOS status bar style
  let statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (statusBar) {
    statusBar.content = theme === 'dark' ? 'black-translucent' : 'default';
  }
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

  // CURSOR CUSTOMIZATION: Apply cursor style from user settings
  if (settings.cursorStyle) {
    setCursorStyle(settings.cursorStyle);
  }
};

// =========================================
// CURSOR CUSTOMIZATION
// Optional, accessibility-safe cursor styles
// =========================================

/**
 * Valid cursor style options
 */
const VALID_CURSOR_STYLES = ['system', 'soft-rounded', 'calm-dot', 'high-contrast', 'reduced-motion'];

/**
 * Set cursor style
 * @param {string} style - Cursor style name
 */
export const setCursorStyle = (style) => {
  if (!VALID_CURSOR_STYLES.includes(style)) {
    console.warn(`Invalid cursor style: ${style}`);
    style = 'system';
  }

  // Store preference
  localStorage.setItem('cursorStyle', style);

  // Apply to DOM - 'system' means no custom cursor
  if (style === 'system') {
    document.documentElement.removeAttribute('data-cursor');
  } else {
    // Check if user prefers reduced motion - auto-fallback to system
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && style !== 'reduced-motion') {
      // User prefers reduced motion but selected a visual cursor
      // Apply reduced-motion style instead
      document.documentElement.setAttribute('data-cursor', 'reduced-motion');
    } else {
      document.documentElement.setAttribute('data-cursor', style);
    }
  }
};

/**
 * Get current cursor style
 * @returns {string} - Current cursor style or 'system'
 */
export const getCursorStyle = () => {
  return localStorage.getItem('cursorStyle') || 'system';
};

/**
 * Get all available cursor styles with labels
 * @returns {Array} - Array of {value, label, description} objects
 */
export const getCursorStyleOptions = () => [
  {
    value: 'system',
    label: 'System default',
    description: 'Use your operating system cursor'
  },
  {
    value: 'soft-rounded',
    label: 'Soft rounded',
    description: 'Softer edges for long reading sessions'
  },
  {
    value: 'calm-dot',
    label: 'Calm dot',
    description: 'Small circular cursor for content areas'
  },
  {
    value: 'high-contrast',
    label: 'High contrast',
    description: 'Larger, high-contrast for better visibility'
  },
  {
    value: 'reduced-motion',
    label: 'Reduced motion',
    description: 'System cursor with no hover effects'
  }
];

/**
 * Initialize cursor style from localStorage
 * Called during app startup
 */
export const initializeCursorStyle = () => {
  const savedStyle = localStorage.getItem('cursorStyle') || 'system';
  setCursorStyle(savedStyle);
  return savedStyle;
};

// =========================================
// SYSTEM THEME DETECTION & DYNAMIC UPDATES
// Listens for OS dark/light mode changes
// =========================================

/**
 * Check if system prefers dark mode
 * @returns {boolean}
 */
export const isDarkModePreferred = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Initialize system theme listener - listens for OS theme changes
 * Call this on app mount for automatic theme updates
 * @returns {Function} cleanup function
 */
export const initThemeListener = () => {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Handle system theme changes (only if user is on 'auto' mode)
  const handleChange = (e) => {
    const themePreference = getThemePreference();
    if (themePreference === 'auto') {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      console.log(`[ThemeManager] System theme changed to ${newTheme}`);
    }
  };

  // Modern browsers
  if (darkModeQuery.addEventListener) {
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }
  // Legacy browsers
  else {
    darkModeQuery.addListener(handleChange);
    return () => darkModeQuery.removeListener(handleChange);
  }
};

/**
 * Get saved theme preference (light/dark/auto)
 * @returns {'light'|'dark'|'auto'}
 */
export const getThemePreference = () => {
  return localStorage.getItem('theme-preference') || 'auto';
};

/**
 * Set theme mode with preference storage
 * @param {'light'|'dark'|'auto'} mode
 */
export const setThemeMode = (mode) => {
  localStorage.setItem('theme-preference', mode);

  if (mode === 'auto') {
    const isDark = isDarkModePreferred();
    setTheme(isDark ? 'dark' : 'light');
  } else {
    setTheme(mode);
  }
};

/**
 * Update iOS status bar style based on theme
 * @param {boolean} isDarkMode
 */
export const updateiOSStatusBar = (isDarkMode) => {
  let statusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

  if (!statusBar) {
    statusBar = document.createElement('meta');
    statusBar.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(statusBar);
  }

  statusBar.content = isDarkMode ? 'black-translucent' : 'default';
};
