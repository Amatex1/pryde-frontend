/**
 * Emergency Cache Clear Utility
 * 
 * If you're experiencing issues with the app (MIME type errors, old content, etc.),
 * run this in the browser console:
 * 
 * Copy and paste this entire script into the browser console and press Enter.
 * Or visit: /clear-cache.html
 */

(async function fixPrydeCache() {
  console.log('🧹 Starting Pryde cache cleanup...');
  
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      console.log('📋 Unregistering service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        const result = await registration.unregister();
        console.log(`  ${result ? '✅' : '❌'} Unregistered: ${registration.scope}`);
      }
      
      if (registrations.length === 0) {
        console.log('  ℹ️ No service workers found');
      }
    } else {
      console.log('  ℹ️ Service workers not supported');
    }

    // 2. Clear all caches
    if ('caches' in window) {
      console.log('📋 Clearing caches...');
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        const result = await caches.delete(cacheName);
        console.log(`  ${result ? '✅' : '❌'} Deleted cache: ${cacheName}`);
      }
      
      if (cacheNames.length === 0) {
        console.log('  ℹ️ No caches found');
      }
    } else {
      console.log('  ℹ️ Cache API not supported');
    }

    // 3. Clear localStorage (optional - will log you out)
    console.log('📋 Clearing localStorage...');
    const itemCount = localStorage.length;
    localStorage.clear();
    console.log(`  ✅ Cleared ${itemCount} items from localStorage`);

    // 4. Clear sessionStorage
    console.log('📋 Clearing sessionStorage...');
    const sessionCount = sessionStorage.length;
    sessionStorage.clear();
    console.log(`  ✅ Cleared ${sessionCount} items from sessionStorage`);

    // 5. Clear cookies (optional)
    console.log('📋 Clearing cookies...');
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    console.log(`  ✅ Cleared ${cookies.length} cookies`);

    console.log('');
    console.log('✅ ✅ ✅ CLEANUP COMPLETE! ✅ ✅ ✅');
    console.log('');
    console.log('🔄 Reloading page in 3 seconds...');
    console.log('');
    console.log('Note: You will need to log in again.');
    
    // Reload after 3 seconds
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.log('');
    console.log('💡 Try manually:');
    console.log('1. Open DevTools → Application → Storage');
    console.log('2. Click "Clear site data"');
    console.log('3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  }
})();

