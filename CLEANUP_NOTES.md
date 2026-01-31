# Cleanup Notes

## Date: 2026-01-31

## Unused Utility Files Removed

The following 12 utility files were removed from `src/utils/` after an automated scan confirmed they were not imported anywhere in the codebase:

| File | Original Purpose |
|------|------------------|
| `authBootstrap.js` | Auth initialization bootstrap logic |
| `bugClustering.js` | Error grouping/clustering system |
| `clearStaleSW.js` | Service worker cache clearing |
| `installPromptManager.js` | PWA install prompt management |
| `rootCauseSuggestions.js` | Debug root cause suggestions |
| `serviceWorkerDebug.js` | Service worker debugging utilities |
| `sessionDiffComparison.js` | Session state comparison |
| `stateSync.js` | Cross-tab state synchronization |
| `swApiCollisionDetector.js` | SW/API collision detection |
| `swAutoDisable.js` | Auto-disable SW on auth issues |
| `swTestingInfrastructure.js` | SW testing infrastructure |
| `updateNotificationManager.js` | App update notification management |

## Why Removed

- **No imports found**: None of these files were imported by any component, hook, or other utility
- **Dead code**: They were likely created for features that were never fully implemented or were later removed
- **Reduces bundle size**: Removing unused code improves build performance and reduces maintenance burden

## Verification Method

Used `scripts/scan-unused-utils.js` to scan all `.js`, `.jsx`, `.ts`, `.tsx` files in `src/` for import statements referencing each utility file. Files with zero external references were flagged for removal.

## Recovery

If any of these files are needed in the future, they can be recovered from git history:

```bash
git checkout HEAD~1 -- src/utils/<filename>.js
```

