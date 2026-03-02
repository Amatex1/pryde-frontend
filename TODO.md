# ESLint Error Fixes - TODO List

## Goal: Fix all 42 errors (0 errors, leave warnings)

## Errors by Category:

### 1. react-hooks (1 error)
- [ ] VirtualizedFeed.jsx:143 - useCallback called conditionally

### 2. no-restricted-properties - Architecture violations (8 errors)
- [ ] Feed.jsx:335 - window.innerHeight
- [ ] Feed.jsx:1619 - window.matchMedia  
- [ ] Feed.jsx:1621 - window.innerWidth
- [ ] Messages.jsx:65 - window.innerWidth
- [ ] Messages.jsx:72 - window.innerWidth
- [ ] Profile.jsx:1102 - window.matchMedia
- [ ] Profile.jsx:1436 - window.innerWidth
- [ ] Profile.jsx:1461 - window.innerWidth

### 3. no-undef (5 errors)
- [ ] apiClient.js:166 - 'ApiError' not defined
- [ ] apiClient.js:212 - 'forceReloadWithCacheClear' not defined
- [ ] apiClient.js:215 - 'forceReloadWithCacheClear' not defined
- [ ] debounce.js:30 - 'React' not defined
- [ ] debounce.js:32 - 'React' not defined

### 4. no-useless-escape (5 errors)
- [ ] Register.jsx:119 - unnecessary \[ \/
- [ ] Register.jsx:237 - unnecessary \[ \/
- [ ] ResetPassword.jsx:46 - unnecessary \[ \/
- [ ] pushNotifications.jsx:141 - unnecessary \-
- [ ] pwa.js:297 - unnecessary \-

### 5. no-constant-binary-expression (4 errors)
- [ ] Messages.jsx:1656 - constant truthiness
- [ ] Messages.jsx:2539 - constant truthiness
- [ ] Feed.jsx - constant expressions (check output)

### 6. no-case-declarations (1 error)
- [ ] NotificationBell.jsx:300 - lexical decl in case

### 7. jsx-a11y errors (15 errors)
- [ ] ErrorBoundary.jsx:132,133,151,155,176,180 - mouse-events-have-key-events
- [ ] GlobalSearch.jsx:134 - role-supports-aria-props
- [ ] GlobalSearch.jsx:170,197,226,248 - role-has-required-aria-props
- [ ] Admin.jsx:709,776 - no-redundant-roles
- [ ] GroupsList.jsx:317 - no-noninteractive-tabindex
- [ ] PhotoEssay.jsx:342 - img-redundant-alt
