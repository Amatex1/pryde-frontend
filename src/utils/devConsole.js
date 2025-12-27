/**
 * Dev Console Signal Lock
 *
 * Rules (development only):
 * - console.error → always visible
 * - console.warn  → always visible
 * - console.log   → ONLY if prefixed with "[Pryde]"
 * - console.info  → silenced
 */

export function setupDevConsole() {
  if (process.env.NODE_ENV !== "development") return;

  const originalLog = console.log.bind(console);
  const originalInfo = console.info.bind(console);

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

