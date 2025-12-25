/**
 * Mobile-First Debug Rules (DEV MODE ONLY)
 * 
 * 🔥 CRITICAL: Enforces mobile constraints in development
 * 
 * Mobile Reality:
 * - JS can pause at any time (backgrounding, low memory)
 * - Requests can fail once (network switches, airplane mode)
 * - State can reset mid-render (memory pressure)
 * - App can cold-boot repeatedly (iOS aggressive eviction)
 * 
 * This utility warns developers when code makes unsafe assumptions
 * that work on desktop but fail on mobile/PWA.
 */

import logger from './logger';

const isDev = import.meta.env.DEV;

/**
 * Warn if effect depends on uninterrupted execution
 * Mobile apps can be backgrounded at any time, pausing JS execution
 */
export function warnUninterruptedExecution(componentName, effectDescription) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${componentName}: Effect assumes uninterrupted execution`);
  logger.warn(`   Effect: ${effectDescription}`);
  logger.warn(`   Risk: Mobile apps can be backgrounded, pausing execution`);
  logger.warn(`   Fix: Use cleanup functions and resume detection`);
}

/**
 * Warn if auth state mutates without persistence
 * Mobile apps can be killed and restarted at any time
 */
export function warnAuthStateMutation(location, mutation) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${location}: Auth state mutation without persistence`);
  logger.warn(`   Mutation: ${mutation}`);
  logger.warn(`   Risk: State lost on app kill/restart`);
  logger.warn(`   Fix: Persist to localStorage/sessionStorage immediately`);
}

/**
 * Warn if UI assumes immediate network success
 * Mobile networks are unreliable (Wi-Fi ↔ cellular, tunnels, etc.)
 */
export function warnNetworkAssumption(componentName, assumption) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${componentName}: UI assumes immediate network success`);
  logger.warn(`   Assumption: ${assumption}`);
  logger.warn(`   Risk: Mobile networks fail frequently`);
  logger.warn(`   Fix: Show loading states, handle errors gracefully`);
}

/**
 * Warn if layout relies on fixed heights or overflow-hidden
 * Mobile viewports change constantly (keyboard, rotation, browser chrome)
 */
export function warnLayoutAssumption(componentName, assumption) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${componentName}: Layout assumes fixed viewport`);
  logger.warn(`   Assumption: ${assumption}`);
  logger.warn(`   Risk: Mobile viewports change (keyboard, rotation, chrome)`);
  logger.warn(`   Fix: Use flexible layouts (flex, grid, vh units with fallbacks)`);
}

/**
 * Warn if component fetches data before authReady
 * PWA can boot with stale auth state
 */
export function warnPrematureDataFetch(componentName, endpoint) {
  if (!isDev) return;
  
  const authReady = sessionStorage.getItem('authReady');
  if (authReady !== 'true') {
    logger.warn(`⚠️ [Mobile Risk] ${componentName}: Data fetch before authReady`);
    logger.warn(`   Endpoint: ${endpoint}`);
    logger.warn(`   Risk: PWA can boot with stale auth state`);
    logger.warn(`   Fix: Wait for authReady before fetching`);
  }
}

/**
 * Warn if effect has no cleanup function
 * Mobile apps are backgrounded frequently, causing memory leaks
 */
export function warnMissingCleanup(componentName, effectType) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${componentName}: Effect missing cleanup function`);
  logger.warn(`   Effect type: ${effectType}`);
  logger.warn(`   Risk: Memory leaks when app backgrounded`);
  logger.warn(`   Fix: Return cleanup function from useEffect`);
}

/**
 * Warn if localStorage/sessionStorage used without try-catch
 * Mobile browsers can disable storage in private mode
 */
export function warnUnsafeStorage(location, operation) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${location}: Unsafe storage operation`);
  logger.warn(`   Operation: ${operation}`);
  logger.warn(`   Risk: Storage can be disabled in private mode`);
  logger.warn(`   Fix: Wrap in try-catch`);
}

/**
 * Warn if component assumes synchronous state updates
 * React state updates are async, mobile makes this more obvious
 */
export function warnSyncStateAssumption(componentName, assumption) {
  if (!isDev) return;
  
  logger.warn(`⚠️ [Mobile Risk] ${componentName}: Assumes synchronous state updates`);
  logger.warn(`   Assumption: ${assumption}`);
  logger.warn(`   Risk: State updates are async, race conditions on mobile`);
  logger.warn(`   Fix: Use functional setState or useEffect dependencies`);
}

/**
 * Detect if app is running in PWA mode
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Detect if app is running on mobile
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Log mobile environment info (dev mode only)
 */
export function logMobileEnvironment() {
  if (!isDev) return;
  
  logger.debug('📱 [Mobile Environment]');
  logger.debug(`   PWA mode: ${isPWA()}`);
  logger.debug(`   Mobile device: ${isMobile()}`);
  logger.debug(`   User agent: ${navigator.userAgent}`);
  logger.debug(`   Viewport: ${window.innerWidth}x${window.innerHeight}`);
  logger.debug(`   Connection: ${navigator.connection?.effectiveType || 'unknown'}`);
  logger.debug(`   Online: ${navigator.onLine}`);
}

