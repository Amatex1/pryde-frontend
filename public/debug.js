function createMessageNode(className, text) {
  var node = document.createElement('div');
  node.className = className;
  node.textContent = text;
  return node;
}

function createPreNode(text) {
  var node = document.createElement('pre');
  node.textContent = text;
  return node;
}

async function checkSW() {
  var status = document.getElementById('sw-status');
  if (!status) {
    return;
  }
  if (!('serviceWorker' in navigator)) {
    status.replaceChildren(createMessageNode('error', '❌ Service Workers not supported'));
    return;
  }
  var registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) {
    status.replaceChildren(createMessageNode('success', '✅ No service workers registered'));
    return;
  }
  var nodes = [createMessageNode('error', '⚠️ Found ' + registrations.length + ' service worker(s):')];
  registrations.forEach(function (registration, index) {
    nodes.push(createPreNode('SW ' + (index + 1) + ': ' + registration.scope + '\nActive: ' + (registration.active ? registration.active.scriptURL : 'none')));
  });
  status.replaceChildren.apply(status, nodes);
}

async function unregisterAllSW() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  var registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(function (registration) {
    return registration.unregister();
  }));
  window.alert('✅ All service workers unregistered!');
  await checkSW();
}

async function clearAllCaches() {
  var cacheStatus = document.getElementById('cache-status');
  if (!cacheStatus) {
    return;
  }
  if (!('caches' in window)) {
    cacheStatus.replaceChildren(createMessageNode('error', '❌ Cache API not supported'));
    return;
  }
  var cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(function (name) {
    return caches.delete(name);
  }));
  cacheStatus.replaceChildren(createMessageNode('success', '✅ Cleared ' + cacheNames.length + ' cache(s)'));
}

async function testFiles() {
  var tests = document.getElementById('file-tests');
  if (!tests) {
    return;
  }
  var files = ['/sw.js', '/service-worker.js', '/index.html', '/manifest.json'];
  var nodes = [];
  for (var i = 0; i < files.length; i += 1) {
    var file = files[i];
    try {
      var response = await fetch(file, { cache: 'no-store' });
      var contentType = response.headers.get('content-type') || 'unknown';
      var prefix = response.status === 200 ? '✅ ' : '⚠️ ';
      nodes.push(createMessageNode(response.status === 200 ? 'success' : 'error', prefix + file + ' - ' + response.status + ' - ' + contentType));
    } catch (error) {
      var message = error && error.message ? error.message : 'Unknown error';
      nodes.push(createMessageNode('error', '❌ ' + file + ' - Error: ' + message));
    }
  }
  tests.replaceChildren.apply(tests, nodes);
}

async function populateCacheStatus() {
  var cacheStatus = document.getElementById('cache-status');
  if (!cacheStatus || !('caches' in window)) {
    return;
  }
  var cacheNames = await caches.keys();
  var nodes = [createMessageNode('success', 'Found ' + cacheNames.length + ' cache(s)')];
  if (cacheNames.length > 0) {
    nodes.push(createPreNode(cacheNames.join('\n')));
  }
  cacheStatus.replaceChildren.apply(cacheStatus, nodes);
}

async function fullReset() {
  if (!window.confirm('This will clear ALL caches and service workers. Continue?')) {
    return;
  }
  await unregisterAllSW();
  await clearAllCaches();
  localStorage.clear();
  sessionStorage.clear();
  window.alert('✅ Full reset complete! The page will now reload.');
  window.location.reload();
}

var unregisterButton = document.getElementById('unregister-sw-button');
var refreshButton = document.getElementById('refresh-sw-button');
var clearCachesButton = document.getElementById('clear-caches-button');
var fullResetButton = document.getElementById('full-reset-button');
var hardReloadButton = document.getElementById('hard-reload-button');
var goHomeButton = document.getElementById('go-home-button');

if (unregisterButton) unregisterButton.addEventListener('click', function () { void unregisterAllSW(); });
if (refreshButton) refreshButton.addEventListener('click', function () { void checkSW(); });
if (clearCachesButton) clearCachesButton.addEventListener('click', function () { void clearAllCaches(); });
if (fullResetButton) fullResetButton.addEventListener('click', function () { void fullReset(); });
if (hardReloadButton) hardReloadButton.addEventListener('click', function () { window.location.reload(); });
if (goHomeButton) goHomeButton.addEventListener('click', function () { window.location.assign('/'); });

void checkSW();
void testFiles();
void populateCacheStatus();