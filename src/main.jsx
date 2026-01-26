import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/* ================================
   Global Styles (Order Matters)
   ================================ */
import './index.css'
import './styles/z-index.css'
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
import './styles/hover-utilities.css'
import './styles/pwa-native-feel.css'

/* ================================
   SAFE INITIALIZATION ONLY
   No reloads. No recovery logic.
   No service worker control.
   ================================ */
import { initializeTheme } from './utils/themeManager'
import { initWebVitals } from './utils/webVitals'

/* ================================
   Global Error Logging (PASSIVE)
   ================================ */
window.addEventListener(
  'error',
  (event) => {
    console.error('[GlobalError]', event?.message || event)
  },
  true
)

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledPromise]', event.reason)
  event.preventDefault()
})

/* ================================
   Build Info (Debug Only)
   ================================ */
const buildVersionMeta = document.querySelector('meta[name="build-version"]')
const buildTimeMeta = document.querySelector('meta[name="build-time"]')

// Expose version globally for debugging (window.__VERSION__)
window.__VERSION__ = buildVersionMeta?.content || 'unknown'
window.__BUILD_TIME__ = buildTimeMeta?.content || 'unknown'

console.info('🚀 Pryde Frontend Build:', window.__VERSION__)
console.info('🕐 Build Time:', window.__BUILD_TIME__)
console.info('🌐 Environment:', import.meta.env.MODE)

/* ================================
   EARLY SAFE INIT
   ================================ */
initializeTheme()

/* ================================
   APP BOOT (NO SIDE EFFECTS)
   ================================ */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

/* ================================
   Telemetry (Passive)
   ================================ */
initWebVitals()
