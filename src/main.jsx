/* ================================
   CONSOLE GUARD - MUST BE FIRST
   Silences console.log/info/debug
   Only errors/warnings visible
   ================================ */
import { setupDevConsole } from './utils/devConsole'
setupDevConsole()

/* ================================
   SENTRY — init before React
   Only runs in production with DSN
   ================================ */
import { initSentry } from './utils/sentry'
initSentry()

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/* ================================
   Global Styles (Order Matters)
   ================================ */
import './index.css'
import './styles/core/z-index.css'     /* Layer system: base → overlays → notifications → critical */
import './styles/core/layout.css'      /* Page structure, containers, sidebar, PWA shell */
import './styles/core/theme.css'       /* Tokens, typography, dark mode, quiet mode, purple identity */
import './styles/core/mobile.css'      /* Mobile + tablet responsive overrides */
import './styles/core/utilities.css'   /* Hover guards, cursors, modals, hardening */
import './styles/breakpoints.css'
import './styles/navbar.css'
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
