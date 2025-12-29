/**
 * Console Signal Lock
 *
 * Production:
 * - console.error → always visible (critical issues)
 * - console.warn  → always visible (important warnings)
 * - console.log   → silenced (no noise in prod)
 * - console.info  → silenced
 *
 * Development:
 * - console.error → always visible
 * - console.warn  → always visible
 * - console.log   → ONLY if prefixed with "[Pryde]"
 * - console.info  → silenced
 */

export function setupDevConsole() {
  const isProd = import.meta.env.PROD || process.env.NODE_ENV === "production";
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === "development";

  const originalLog = console.log.bind(console);
  const originalInfo = console.info.bind(console);

  if (isProd) {
    // Production: silence all non-critical console output
    console.log = () => {
      /* silenced in production */
    };
    console.info = () => {
      /* silenced in production */
    };
    // console.warn and console.error remain active
    return;
  }

  if (isDev) {
    // Development: only show [Pryde] prefixed logs
    console.log = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].startsWith("[Pryde]")
      ) {
        originalLog(...args);
      }
    };

    console.info = () => {
      /* silenced intentionally */
    };
  }
}

/**
 * Production Console Guard
 * Alias for backward compatibility
 */
export function guardProdConsole() {
  setupDevConsole();
}

