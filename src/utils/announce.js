/**
 * Phase 5C: Screen Reader Announcements
 * Utility for announcing status changes to screen readers via aria-live regions
 */

/**
 * Announce a message to screen readers
 * Uses the aria-live-announcer element added to App.jsx
 * 
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' or 'assertive' (default: 'polite')
 */
export function announce(message, priority = 'polite') {
  const announcer = document.getElementById('aria-live-announcer');
  
  if (!announcer) {
    // Fallback: create a temporary announcer
    const temp = document.createElement('div');
    temp.setAttribute('aria-live', priority);
    temp.setAttribute('aria-atomic', 'true');
    temp.className = 'sr-only';
    temp.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
    document.body.appendChild(temp);
    
    // Set message after brief delay to ensure it's announced
    setTimeout(() => {
      temp.textContent = message;
    }, 50);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(temp);
    }, 1000);
    return;
  }
  
  // Update live region priority if needed
  announcer.setAttribute('aria-live', priority);
  
  // Clear and set message (forces re-announcement)
  announcer.textContent = '';
  setTimeout(() => {
    announcer.textContent = message;
  }, 50);
  
  // Clear after delay
  setTimeout(() => {
    announcer.textContent = '';
  }, 5000);
}

/**
 * Announce a success message
 * @param {string} message - Success message
 */
export function announceSuccess(message) {
  announce(`Success: ${message}`, 'polite');
}

/**
 * Announce an error message
 * @param {string} message - Error message
 */
export function announceError(message) {
  announce(`Error: ${message}`, 'assertive');
}

/**
 * Announce a loading state
 * @param {string} action - What is loading (e.g., "Joining group")
 */
export function announceLoading(action) {
  announce(`${action}, please wait...`, 'polite');
}

export default announce;

