(function () {
  var hostname = window.location.hostname;
  var isProductionHost = hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('.local');

  if (!isProductionHost || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    }).catch(function () {});
  });
})();