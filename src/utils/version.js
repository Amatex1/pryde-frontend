/**
 * App Version Utility
 * Reads the version from environment variable set during build
 */

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev';

