function setClearCacheStatus(message, state) {
  var statusEl = document.getElementById('status');
  if (!statusEl) {
    return;
  }
  statusEl.className = 'status ' + state + ' is-visible';
  statusEl.textContent = message;
}

async function clearEverything() {
  setClearCacheStatus('🔄 Clearing cache and service workers...', 'info');

  try {
    if ('serviceWorker' in navigator) {
      var registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(function (registration) {
        return registration.unregister();
      }));
    }

    if ('caches' in window) {
      var cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(function (name) {
        return caches.delete(name);
      }));
    }

    localStorage.clear();
    sessionStorage.clear();
    setClearCacheStatus('✅ Cache cleared! Reloading in 2 seconds...', 'success');

    window.setTimeout(function () {
      window.location.assign('/');
    }, 2000);
  } catch (error) {
    var message = error && error.message ? error.message : 'Unknown error';
    setClearCacheStatus('❌ Error: ' + message + '. Try manually clearing your browser cache.', 'error');
  }
}

var clearCacheButton = document.getElementById('clear-cache-button');
if (clearCacheButton) {
  clearCacheButton.addEventListener('click', function () {
    void clearEverything();
  });
}