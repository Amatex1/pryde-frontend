import { useState, useEffect } from 'react'
import api from '../utils/api'

/**
 * SAFE VERSION CHECK
 *
 * - Runs once per session
 * - Never auto-reloads
 * - Never polls
 * - Never unregisters service workers
 * - User-triggered refresh ONLY
 */

const SESSION_KEY = 'pryde_version_checked'

const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateType, setUpdateType] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Prevent repeated checks in same session
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, 'true')

    const checkOnce = async () => {
      try {
        const backendRes = await api.get('/version')
        const backendVersion = backendRes?.data?.version

        const frontendVersion =
          import.meta.env.VITE_APP_VERSION ||
          window.__PRYDE_VERSION__?.version ||
          'unknown'

        const storedBackend = sessionStorage.getItem('backend_version')
        const storedFrontend = sessionStorage.getItem('frontend_version')

        // First run — store versions, do nothing
        if (!storedBackend || !storedFrontend) {
          sessionStorage.setItem('backend_version', backendVersion)
          sessionStorage.setItem('frontend_version', frontendVersion)
          return
        }

        const backendChanged = backendVersion !== storedBackend
        const frontendChanged = frontendVersion !== storedFrontend

        if (backendChanged || frontendChanged) {
          setUpdateAvailable(true)

          if (backendChanged && frontendChanged) setUpdateType('both')
          else if (backendChanged) setUpdateType('backend')
          else setUpdateType('frontend')
        }
      } catch (err) {
        // Silent failure — NEVER reload
        console.warn('[VersionCheck] Failed safely:', err)
      }
    }

    checkOnce()
  }, [])

  const dismissUpdate = () => {
    setDismissed(true)
  }

  const refreshApp = () => {
    // User-initiated refresh only
    window.location.reload()
  }

  return {
    updateAvailable: updateAvailable && !dismissed,
    updateType,
    dismissUpdate,
    refreshApp
  }
}

export default useVersionCheck
