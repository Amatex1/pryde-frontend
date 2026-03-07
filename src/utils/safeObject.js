/**
 * Safe Object Utilities
 * 
 * These utilities provide defensive wrappers around Object methods to prevent
 * runtime crashes when null or undefined values are passed.
 * 
 * Usage:
 *   import { safeValues, safeKeys, safeEntries } from '../utils/safeObject';
 */

export function safeValues(obj) {
  if (!obj) return []
  return Object.values(obj)
}

export function safeKeys(obj) {
  if (!obj) return []
  return Object.keys(obj)
}

export function safeEntries(obj) {
  if (!obj) return []
  return Object.entries(obj)
}

