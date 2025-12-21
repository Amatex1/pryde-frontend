/**
 * Get the display name for a user object
 * Uses a consistent priority order across the entire app:
 * 1. displayName (user-set profile name)
 * 2. nickname (legacy/alternative name)
 * 3. username (handle/login name)
 * 4. 'Unknown' (fallback)
 * 
 * @param {Object} user - User object with name fields
 * @returns {string} The display name to show in UI
 */
export function getDisplayName(user) {
  if (!user) return 'Unknown';
  return (
    user.displayName ||
    user.nickname ||
    user.username ||
    'Unknown'
  );
}

/**
 * Get the first character of a user's display name (for avatars)
 * @param {Object} user - User object with name fields
 * @returns {string} Single uppercase character for avatar placeholder
 */
export function getDisplayNameInitial(user) {
  const name = getDisplayName(user);
  return name.charAt(0).toUpperCase();
}

export default getDisplayName;

