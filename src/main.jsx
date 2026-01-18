import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/breakpoints.css'
import './styles/pwa-app-shell.css'
import './styles/darkMode.css'
import './styles/quiet-mode.css'
import './styles/mobileFriendly.css'
import './styles/tabletFriendly.css'
import './styles/typography.css'
import './styles/mobile-brand.css'
import './styles/purple-identity.css'
import './styles/sidebar.css'
import './styles/navbar.css'
import './styles/cursors.css'
import './styles/responsive-modals.css'
import './styles/pwa-native-feel.css'

import { setupInstallPrompt, requestPersistentStorage } from './utils/pwa'
import { initWebVitals } from './utils/webVitals'
import { initializePushNotifications } from './utils/pushNotifications'
import { initializeTheme } from './utils/themeManager'
import { initCircuitBreaker } from './utils/authCircuitBreaker'
import { initServiceWorkerDebug } from './utils/serviceWorkerDebug'
import { clearStaleSWAndCaches } from './utils/clearStaleSW'
import { initSwApiCollisionDetector } from './utils/swApiCollisionDetector'
import { initSWTestingInfrastructure } from './utils/swTestingInfrastructure'

/* ======================================================
   🚨 STABILITY PATCH
   Automatic reload-on-error DISABLED.
   Caused infinite refresh loops in production.
   Manual reload paths still exist elsewhere.
   ====================================================== */

// NOTE: Intentionally NOT reloading on global errors
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', event.message || event)
}, true)

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledPromise]', event.reason)
  event.preventDefault()
})

/* ======================================================
   BUILD INFO LOGGING
   ====================================================== */

const buildVersionMeta = document.querySelector('meta[name="build-version"]')
const buildTimeMeta = document.querySelector('meta[name="build-time"]')

console.info('🚀 Pryde Frontend Build:', buildVersionMeta?.content || 'unknown')
console.info('🕐 Build Time:', buildTimeMeta?.content || 'unknown')
console.info('🌐 Environment:', import.meta.env.MODE)

/* ======================================================
   EARLY INIT (SAFE)
   ====================================================== */

initCircuitBreaker()
initializeTheme()

/* ======================================================
   DEV-ONLY TOOLING
   ====================================================== */

if (import.meta.env.DEV) {
  initServiceWorkerDebug()
  initSWTestingInfrastructure()
  initSwApiCollisionDetector()
}

/* ======================================================
   PWA / INSTALL / PUSH (SAFE)
   ====================================================== */

if ('serviceWorker' in navigator) {
  setupInstallPrompt()

  requestPersistentStorage().catch(err =>
    console.error('[PWA] Persistent storage request failed:', err)
  )

  initializePushNotifications().catch(err =>
    console.error('[Push Notifications] Init failed:', err)
  )

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service worker controller changed')
    window.dispatchEvent(new Event('pryde-update-detected'))
  })
}

/* ======================================================
   APP BOOT
   ====================================================== */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

initWebVitals()