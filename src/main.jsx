/* ================================
   CONSOLE GUARD - MUST BE FIRST
   Silences console.log/info/debug
   Only errors/warnings visible
   ================================ */
import { setupDevConsole } from './utils/devConsole'
setupDevConsole()

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
import './styles/typography-tokens.css' /* Single source of truth for typography */
import './styles/typography.css'
import './styles/mobile-brand.css'
import './styles/purple-identity.css'
import './styles/sidebar.css'
import './styles/navbar.css'
import './styles/cursors.css'
import './styles/responsive-modals.css'
import './styles/hover-utilities.css'
import './styles/pwa-native-feel.css'
import './styles/themes/galaxy-layer.css' /* Galaxy visual layer - must load LAST to override all backgrounds */

/* ================================
   SAFE INITIALIZATION ONLY
   No reloads. No recovery logic.
   No service worker control.
   ================================ */
import { initializeTheme, initTextDensity } from './utils/themeManager'
import { initWebVitals } from './utils/webVitals'

/* ================================
   Global Error Logging (PASSIVE)
   Only errors - visible in Render/Vercel
   ================================ */
window.addEventListener(
  'error',
  (event) => {
    // Skip resource load errors on media elements (img, video, audio).
    // These are handled at the component level with onError handlers.
    if (event.target instanceof HTMLImageElement ||
        event.target instanceof HTMLVideoElement ||
        event.target instanceof HTMLAudioElement) {
      return;
    }
    console.error('[GlobalError]', event?.message || event)
  },
  true
)

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledPromise]', event.reason)
  event.preventDefault()
})

/* ================================
   Build Info (Exposed on window)
   ================================ */
const buildVersionMeta = document.querySelector('meta[name="build-version"]')
const buildTimeMeta = document.querySelector('meta[name="build-time"]')

// Expose version globally for debugging (window.__VERSION__)
window.__VERSION__ = buildVersionMeta?.content || 'unknown'
window.__BUILD_TIME__ = buildTimeMeta?.content || 'unknown'

/* ================================
   EARLY SAFE INIT
   ================================ */
initializeTheme()
initTextDensity()

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
