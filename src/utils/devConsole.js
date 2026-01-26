/**
 * Console Signal Lock - PRODUCTION CLEAN
 *
 * ALL ENVIRONMENTS:
 * - console.error → always visible (critical issues for Render/Vercel logs)
 * - console.warn  → always visible (important warnings for Render/Vercel logs)
 * - console.log   → SILENCED (no noise in browser DevTools)
 * - console.info  → SILENCED
 * - console.debug → SILENCED
 *
 * Debugging should be done via:
 * - Render logs (backend)
 * - Vercel logs (frontend build/deploy)
 * - console.error/warn for critical issues only
 */

let isInitialized = false;

export function setupDevConsole() {
  // Prevent double initialization
  if (isInitialized) return;
  isInitialized = true;

  // Silence console.log, console.info, console.debug in ALL environments
  // Only console.error and console.warn remain for critical issues
  console.log = () => {
    /* silenced - use Render/Vercel logs for debugging */
  };
  console.info = () => {
    /* silenced - use Render/Vercel logs for debugging */
  };
  console.debug = () => {
    /* silenced - use Render/Vercel logs for debugging */
  };

  // console.warn and console.error remain active for critical issues
}

/**
 * Production Console Guard
 * Alias for backward compatibility
 */
export function guardProdConsole() {
  setupDevConsole();
}

