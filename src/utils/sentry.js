/**
 * Sentry error monitoring — production only, privacy-safe
 *
 * Rules:
 * - Only runs when VITE_SENTRY_DSN is set AND we are in production
 * - Never sends PII (no email, no username, no message content)
 * - User context is userId only
 * - All request bodies and cookies are redacted before sending
 */
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

const SENSITIVE_HEADER_KEYS = [
  'authorization', 'cookie', 'x-csrf-token', 'x-refresh-token',
  'set-cookie', 'x-auth-token'
];

function redactHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers;
  const safe = {};
  for (const [key, value] of Object.entries(headers)) {
    safe[key] = SENSITIVE_HEADER_KEYS.includes(key.toLowerCase()) ? '[redacted]' : value;
  }
  return safe;
}

export function initSentry() {
  if (!SENTRY_DSN || import.meta.env.DEV) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',

    // 10% of transactions for performance monitoring — low overhead
    tracesSampleRate: 0.1,

    // Privacy filter — runs before every event is sent
    beforeSend(event) {
      if (event.request) {
        // Redact sensitive headers
        if (event.request.headers) {
          event.request.headers = redactHeaders(event.request.headers);
        }
        // Never send request body (may contain passwords, message content)
        if (event.request.data !== undefined) {
          event.request.data = '[redacted]';
        }
        // Never send cookies
        if (event.request.cookies !== undefined) {
          event.request.cookies = '[redacted]';
        }
      }

      // Strip extra context keys that could carry PII
      if (event.user) {
        const { id } = event.user;
        event.user = id ? { id } : null;
      }

      return event;
    },
  });
}

/**
 * Set authenticated user context.
 * Only sends userId — never email or username.
 */
export function setSentryUser(userId) {
  if (!SENTRY_DSN || import.meta.env.DEV) return;
  Sentry.setUser(userId ? { id: String(userId) } : null);
}

/**
 * Manually capture an exception with optional context tags.
 * Safe to call even if Sentry is not initialised.
 */
export function captureException(error, tags) {
  if (!SENTRY_DSN || import.meta.env.DEV) return;
  Sentry.captureException(error, tags ? { tags } : undefined);
}

export { Sentry };
