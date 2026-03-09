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
 * QUIET MODE ENHANCEMENTS (All 10 Improvements):
 * 1. Scheduled/Automatic Quiet Hours
 * 2. Granular Content Filtering
 * 3. Enhanced "Calm Feed" Algorithm
 * 4. Visual Improvements (mute button, transitions, monochrome, hide stories)
 * 5. "Deep Quiet" Mode
 * 6. Smart Triggers
 * 7. Better User Feedback
 * 8. Persistence Improvements
 * 9. Accessibility
 * 10. Communication Features
 *
 * CURSOR CUSTOMIZATION adds:
 * - data-cursor: Optional cursor style (system, soft-rounded, calm-dot, high-contrast, reduced-motion)
 */

// PWA theme colors matching CSS variables
const THEME_COLORS = {
  light: '#F5F6FA', // --bg-page light mode
  dark: '#0F1021'   // --bg-page dark mode
};

// Default quiet mode enhancement settings
const DEFAULT_QUIET_SETTINGS = {
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietOnWorkFocus: false,
  quietContentFilter: 'all',
  quietHideViral: false,
  quietFollowedOnly: false,
  quietGentleTransitions: true,
  quietColorScheme: 'default',
  quietHideStories: false,
  quietDeepQuiet: false,
  quietDisableAnimations: false,
  quietMinimalUI: false,
  quietHideTrending: false,
  quietAutoTrigger: false,
  quietNegativeThreshold: 5,
  quietKeywordTriggers: [],
  quietShowHiddenCount: true,
  quietSessionOverride: false,
  quietFeedSettings: 'default',
  quietMessageSettings: 'default',
  quietHighContrast: false,
  quietHideMentions: false,
  quietMuteGroupSummary: false,
  quietReduceStoryNotifications: false,
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

  // Set data-theme attribute (default: dark) — always light or dark
  const theme = savedDarkMode === 'false' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  // Galaxy is an independent visual layer — does not touch data-theme
  // DEFAULT: Galaxy ON for new users (core identity: Dark + Galaxy)
  const savedGalaxy = localStorage.getItem('galaxyMode');
  if (savedGalaxy === null) {
    // New user — default to galaxy ON
    document.documentElement.setAttribute('data-galaxy', 'true');
    localStorage.setItem('galaxyMode', 'true');
  } else if (savedGalaxy === 'true') {
    document.documentElement.setAttribute('data-galaxy', 'true');
  } else {
    document.documentElement.removeAttribute('data-galaxy');
  }

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

  // QUIET MODE ENHANCEMENTS: Initialize all settings from localStorage
  initializeQuietEnhancements();

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
    galaxyMode: savedGalaxy !== 'false',
    quietMode: quietMode === 'true',
    quietVisuals: quietVisuals === 'true',
    quietWriting: quietWriting === 'true',
    quietMetrics: quietMetrics === 'true',
    cursorStyle: savedCursorStyle
  };
};

/**
 * Initialize all quiet mode enhancement settings
 */
const initializeQuietEnhancements = () => {
  // Initialize each enhancement setting from localStorage with defaults
  Object.keys(DEFAULT_QUIET_SETTINGS).forEach(key => {
    const localStorageKey = key;
    const defaultValue = DEFAULT_QUIET_SETTINGS[key];
    const savedValue = localStorage.getItem(localStorageKey);
    
    // For arrays, parse JSON; for others, use saved or default
    let value;
    if (Array.isArray(defaultValue)) {
      value = savedValue ? JSON.parse(savedValue) : defaultValue;
    } else {
      value = savedValue !== null ? savedValue : defaultValue;
    }
    
    // Apply to DOM based on setting type
    applyQuietEnhancementToDOM(key, value);
  });
};

/**
 * Apply a quiet mode enhancement setting to the DOM
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
const applyQuietEnhancementToDOM = (key, value) => {
  const root = document.documentElement;
  const isQuietMode = root.getAttribute('data-quiet') === 'true';
  
  if (!isQuietMode) {
    // Only apply enhancements when quiet mode is enabled
    return;
  }

  switch (key) {
    // IMPROVEMENT 1: Scheduled/Automatic Quiet Hours
    case 'quietHoursEnabled':
    case 'quietHoursStart':
    case 'quietHoursEnd':
    case 'quietOnWorkFocus':
      // These are logic-based, handled in checkQuietHoursSchedule()
      break;

    // IMPROVEMENT 2: Granular Content Filtering
    case 'quietContentFilter':
      root.setAttribute('data-quiet-content-filter', value);
      break;
    case 'quietHideViral':
      root.setAttribute('data-quiet-hide-viral', String(value));
      break;
    case 'quietFollowedOnly':
      root.setAttribute('data-quiet-followed-only', String(value));
      break;

    // IMPROVEMENT 4: Visual Improvements
    case 'quietGentleTransitions':
      root.setAttribute('data-quiet-gentle-transitions', String(value));
      break;
    case 'quietColorScheme':
      root.setAttribute('data-quiet-color-scheme', value);
      break;
    case 'quietHideStories':
      root.setAttribute('data-quiet-hide-stories', String(value));
      break;

    // IMPROVEMENT 5: Deep Quiet Mode
    case 'quietDeepQuiet':
      root.setAttribute('data-quiet-deep', String(value));
      break;
    case 'quietDisableAnimations':
      root.setAttribute('data-quiet-no-animations', String(value));
      break;
    case 'quietMinimalUI':
      root.setAttribute('data-quiet-minimal-ui', String(value));
      break;
    case 'quietHideTrending':
      root.setAttribute('data-quiet-hide-trending', String(value));
      break;

    // IMPROVEMENT 7: Better User Feedback
    case 'quietShowHiddenCount':
      root.setAttribute('data-quiet-show-hidden-count', String(value));
      break;
    case 'quietSessionOverride':
      // This is a runtime flag, not persistent
      break;

    // IMPROVEMENT 8: Persistence & Context
    case 'quietFeedSettings':
      root.setAttribute('data-quiet-feed', value);
      break;
    case 'quietMessageSettings':
      root.setAttribute('data-quiet-messages', value);
      break;

    // IMPROVEMENT 9: Accessibility
    case 'quietHighContrast':
      root.setAttribute('data-quiet-high-contrast', String(value));
      break;

    // IMPROVEMENT 10: Communication Features
    case 'quietHideMentions':
      root.setAttribute('data-quiet-hide-mentions', String(value));
      break;
    case 'quietMuteGroupSummary':
      root.setAttribute('data-quiet-mute-group-summary', String(value));
      break;
    case 'quietReduceStoryNotifications':
      root.setAttribute('data-quiet-reduce-story-notifs', String(value));
      break;
  }
};

/**
 * Set a quiet mode enhancement setting
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
export const setQuietEnhancement = (key, value) => {
  if (!(key in DEFAULT_QUIET_SETTINGS)) {
    console.warn(`Invalid quiet mode enhancement: ${key}`);
    return;
  }

  // Store in localStorage
  const localStorageKey = key;
  if (Array.isArray(value)) {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  } else {
    localStorage.setItem(localStorageKey, String(value));
  }

  // Apply to DOM if quiet mode is enabled
  const isQuietMode = document.documentElement.getAttribute('data-quiet') === 'true';
  if (isQuietMode) {
    applyQuietEnhancementToDOM(key, value);
  }
};

/**
 * Get a quiet mode enhancement setting
 * @param {string} key - Setting key
 * @returns {any} - Setting value
 */
export const getQuietEnhancement = (key) => {
  if (!(key in DEFAULT_QUIET_SETTINGS)) {
    console.warn(`Invalid quiet mode enhancement: ${key}`);
    return DEFAULT_QUIET_SETTINGS[key];
  }

  const localStorageKey = key;
  const defaultValue = DEFAULT_QUIET_SETTINGS[key];
  const savedValue = localStorage.getItem(localStorageKey);

  if (savedValue === null) {
    return defaultValue;
  }

  if (Array.isArray(defaultValue)) {
    try {
      return JSON.parse(savedValue);
    } catch {
      return defaultValue;
    }
  }

  // Convert string booleans to actual booleans
  if (typeof defaultValue === 'boolean') {
    return savedValue === 'true';
  }

  // Convert string numbers to actual numbers
  if (typeof defaultValue === 'number') {
    return Number(savedValue);
  }

  return savedValue;
};

/**
 * Get all quiet mode enhancement settings
 * @returns {Object} - All enhancement settings
 */
export const getAllQuietEnhancements = () => {
  const settings = {};
  Object.keys(DEFAULT_QUIET_SETTINGS).forEach(key => {
    settings[key] = getQuietEnhancement(key);
  });
  return settings;
};

/**
 * IMPROVEMENT 1: Check if current time is within quiet hours
 * @returns {boolean} - True if within quiet hours
 */
export const isInQuietHours = () => {
  const enabled = getQuietEnhancement('quietHoursEnabled');
  if (!enabled) return false;

  const start = getQuietEnhancement('quietHoursStart');
  const end = getQuietEnhancement('quietHoursEnd');

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  // Handle overnight schedules (e.g., 22:00 - 08:00)
  if (endTime < startTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
};

/**
 * IMPROVEMENT 6: Smart Triggers - Check keyword triggers
 * @param {string} content - Content to check
 * @returns {boolean} - True if content triggers quiet mode
 */
export const checkKeywordTriggers = (content) => {
  const triggers = getQuietEnhancement('quietKeywordTriggers');
  if (!triggers || triggers.length === 0) return false;

  const lowerContent = content.toLowerCase();
  return triggers.some(keyword => lowerContent.includes(keyword.toLowerCase()));
};

/**
 * IMPROVEMENT 7: Session override - temporarily disable quiet mode
 * @returns {boolean} - New quiet mode state
 */
let sessionOverrideActive = false;
export const toggleSessionQuietOverride = () => {
  sessionOverrideActive = !sessionOverrideActive;
  localStorage.setItem('quietSessionOverride', String(sessionOverrideActive));
  
  if (sessionOverrideActive) {
    // Temporarily disable quiet mode for this session
    document.documentElement.setAttribute('data-quiet-session-override', 'true');
  } else {
    document.documentElement.removeAttribute('data-quiet-session-override');
  }
  
  return getQuietMode();
};

/**
 * Check if session override is active
 * @returns {boolean}
 */
export const isSessionOverrideActive = () => {
  return localStorage.getItem('quietSessionOverride') === 'true';
};

/**
 * Initialize text density from localStorage
 * Called early on app startup to prevent flash of wrong density
 */
export const initTextDensity = () => {
  const savedDensity = localStorage.getItem('textDensity') || 'cozy';
  document.body.setAttribute('data-density', savedDensity);
  return savedDensity;
};

/**
 * Set text density (compact or cozy)
 * @param {string} density - 'compact' or 'cozy'
 */
export const setTextDensity = (density) => {
  document.body.setAttribute('data-density', density);
  localStorage.setItem('textDensity', density);
};

/**
 * Get current text density
 * @returns {string} - Current density value
 */
export const getTextDensity = () => {
  return document.body.getAttribute('data-density') || 'cozy';
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
 * Show a gentle DOM-based toast when Quiet Mode activates.
 * Uses the existing .toast / .toast-quiet CSS classes.
 * Called only on the off → on transition.
 */
const showQuietModeToast = () => {
  // Avoid duplicate toasts
  const existing = document.querySelector('.toast-quiet');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast toast-quiet';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML =
    '<span class="toast-icon" aria-hidden="true">🍃</span>' +
    '<span class="toast-message">Quiet Mode is on. Take your time.</span>' +
    '<button class="toast-close" aria-label="Close notification">&times;</button>';

  // Allow manual dismiss
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

  document.body.appendChild(toast);

  // Auto-remove after 4.5 s
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4500);
};

/**
 * Set quiet mode
 * @param {boolean} enabled - Whether quiet mode is enabled
 */
export const setQuietMode = (enabled) => {
  const wasEnabled = document.documentElement.getAttribute('data-quiet') === 'true';
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

    // Apply all quiet mode enhancements to DOM
    initializeQuietEnhancements();

    // Show gentle confirmation only on off → on transition
    if (!wasEnabled) {
      showQuietModeToast();
    }
  } else {
    // Dismiss any lingering "Quiet Mode is on" toast
    document.querySelector('.toast-quiet')?.remove();
    // Remove sub-toggle attributes when quiet mode is off
    document.documentElement.removeAttribute('data-quiet-visuals');
    document.documentElement.removeAttribute('data-quiet-writing');
    document.documentElement.removeAttribute('data-quiet-metrics');
    
    // Remove all quiet enhancement attributes
    removeAllQuietEnhancementAttributes();
  }
};

/**
 * Remove all quiet mode enhancement attributes from DOM
 */
const removeAllQuietEnhancementAttributes = () => {
  const root = document.documentElement;
  const attributesToRemove = [
    'data-quiet-content-filter',
    'data-quiet-hide-viral',
    'data-quiet-followed-only',
    'data-quiet-gentle-transitions',
    'data-quiet-color-scheme',
    'data-quiet-hide-stories',
    'data-quiet-deep',
    'data-quiet-no-animations',
    'data-quiet-minimal-ui',
    'data-quiet-hide-trending',
    'data-quiet-show-hidden-count',
    'data-quiet-feed',
    'data-quiet-messages',
    'data-quiet-high-contrast',
    'data-quiet-hide-mentions',
    'data-quiet-mute-group-summary',
    'data-quiet-reduce-story-notifs',
    'data-quiet-session-override',
  ];
  
  attributesToRemove.forEach(attr => {
    root.removeAttribute(attr);
  });
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
    metrics: getQuietSubToggle('metrics'),
    // Include all enhancements
    ...getAllQuietEnhancements()
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

// =========================================
// GALAXY MODE
// Isolated visual layer via data-galaxy attr
// Does NOT touch data-theme (light/dark)
// Does NOT touch data-quiet
// =========================================

/**
 * Get galaxy mode state from localStorage
 * @returns {boolean}
 */
export const getGalaxyMode = () => {
  return localStorage.getItem('galaxyMode') === 'true';
};

/**
 * Set galaxy mode on or off
 * Galaxy uses data-galaxy="true" — data-theme stays as light/dark
 * @param {boolean} enabled
 */
export const setGalaxyMode = (enabled) => {
  localStorage.setItem('galaxyMode', enabled ? 'true' : 'false');
  if (enabled) {
    document.documentElement.setAttribute('data-galaxy', 'true');
  } else {
    document.documentElement.removeAttribute('data-galaxy');
  }
};

/**
 * Toggle galaxy mode
 * @returns {boolean} - New galaxy mode state
 */
export const toggleGalaxyMode = () => {
  const current = getGalaxyMode();
  const newValue = !current;
  setGalaxyMode(newValue);
  return newValue;
};

/**
 * Apply theme from user settings
 * @param {Object} user - User object with privacy settings
 */
export const applyUserTheme = (user) => {
  console.log('[ThemeManager] applyUserTheme called with user:', user ? { 
    hasPrivacySettings: !!user.privacySettings, 
    privacySettings: user.privacySettings 
  } : 'null');

  if (!user) {
    console.log('[ThemeManager] applyUserTheme: user is null, returning');
    return;
  }

  const settings = user.privacySettings;
  if (!settings) {
    console.log('[ThemeManager] applyUserTheme: privacySettings is missing, returning');
    return;
  }

  console.log('[ThemeManager] applyUserTheme: settings found:', settings);

  // THEME PERSISTENCE: Restore theme and galaxy from backend so Safari/cross-device
  // doesn't reset to defaults when localStorage is cleared
  if (settings.theme === 'light' || settings.theme === 'dark') {
    console.log('[ThemeManager] applyUserTheme: Applying theme:', settings.theme);
    setTheme(settings.theme);
    localStorage.setItem('darkMode', settings.theme === 'dark' ? 'true' : 'false');
  } else {
    console.log('[ThemeManager] applyUserTheme: No theme in settings, settings.theme =', settings.theme);
  }
  
  if (typeof settings.galaxyMode === 'boolean') {
    console.log('[ThemeManager] applyUserTheme: Applying galaxyMode:', settings.galaxyMode);
    setGalaxyMode(settings.galaxyMode);
  } else {
    console.log('[ThemeManager] applyUserTheme: No galaxyMode in settings, settings.galaxyMode =', settings.galaxyMode, 'typeof:', typeof settings.galaxyMode);
  }

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

  // QUIET MODE ENHANCEMENTS: Sync all enhancement settings from backend
  syncQuietEnhancementsFromBackend(settings);

  // Re-apply quiet mode to ensure sub-toggles are set correctly
  if (settings.quietModeEnabled) {
    setQuietMode(true);
  }

  // CURSOR CUSTOMIZATION: Apply cursor style from user settings
  if (settings.cursorStyle) {
    setCursorStyle(settings.cursorStyle);
  }
};

/**
 * Sync all quiet mode enhancement settings from backend
 * @param {Object} settings - User privacy settings from backend
 */
const syncQuietEnhancementsFromBackend = (settings) => {
  const enhancementKeys = Object.keys(DEFAULT_QUIET_SETTINGS);
  
  enhancementKeys.forEach(key => {
    if (settings[key] !== undefined) {
      let value = settings[key];
      
      // Store in localStorage
      if (Array.isArray(value)) {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    }
  });
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

