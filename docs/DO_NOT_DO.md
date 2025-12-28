# DO NOT DO - Frontend Rules

This document lists **prohibited patterns** that will break the app or cause regressions.

## ❌ Never Use Viewport Detection in Feature Code

```javascript
// ❌ WRONG - Never do this in features
if (window.innerWidth < 768) {
  // mobile-specific logic
}

// ❌ WRONG - Never use matchMedia for layout decisions
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ❌ WRONG - No ResizeObserver for layout
useEffect(() => {
  const observer = new ResizeObserver(() => { /* layout logic */ });
}, []);
```

**Why**: Creates inconsistent behavior, breaks SSR, causes hydration mismatches.

**Do Instead**: Use CSS media queries in stylesheets.

---

## ❌ Never Fork Mobile vs Desktop Logic

```javascript
// ❌ WRONG - No platform-specific component forks
const Component = isMobile ? MobileComponent : DesktopComponent;

// ❌ WRONG - No conditional rendering based on screen size
{isMobile && <MobileNav />}
{!isMobile && <DesktopNav />}
```

**Why**: Creates two codepaths to maintain, causes flash of wrong content.

**Do Instead**: Use CSS `display: none` / `display: block` in media queries.

---

## ❌ Never Add Layout CSS Outside layout.css

```css
/* ❌ WRONG - In any file other than layout.css */
.page-container {
  max-width: 1200px;
}
```

**Why**: Creates specificity wars, breaks responsive system.

**Do Instead**: All `.page-container` rules live in `src/styles/layout.css`.

---

## ❌ Never Use !important on Layout Properties

```css
/* ❌ WRONG */
.page-container {
  max-width: 100% !important;
  padding: 0 !important;
}
```

**Why**: Makes CSS unmaintainable, hides bugs.

**Do Instead**: Fix specificity issues by proper cascade order.

---

## ❌ Never Throw Raw Errors from API Calls

```javascript
// ❌ WRONG - Crashes component on failure
const data = await fetch('/api/data');
if (!data.ok) throw new Error('Failed');

// ❌ WRONG - Raw error propagation
try {
  await api.post('/something');
} catch (e) {
  throw e; // Don't rethrow
}
```

**Why**: Crashes UI, causes white screens.

**Do Instead**: Return structured error objects using `createApiError()`.

---

## ❌ Never Auto-Reload on Errors

```javascript
// ❌ WRONG - Causes infinite reload loops
catch (err) {
  window.location.reload();
}
```

**Why**: If error persists, creates infinite reload loop.

**Do Instead**: Show error UI with manual retry button.

---

## ❌ Never Mix Dark Mode and Quiet Mode Concerns

```css
/* ❌ WRONG - Quiet Mode changing colors */
[data-quiet="true"] {
  background: #0f1220;
  color: rgba(255,255,255,0.92);
}

/* ❌ WRONG - Dark Mode changing spacing */
[data-theme="dark"] {
  padding: 24px;
  gap: 16px;
}
```

**Why**: Breaks when both modes are enabled simultaneously.

**Do Instead**:
- Dark Mode → color variables ONLY
- Quiet Mode → spacing/animation variables ONLY

---

## ❌ Never Import Across Feature Boundaries

```javascript
// ❌ WRONG - Cross-feature import
import { SomeComponent } from '../features/messages/SomeComponent';
// (from a feed feature file)
```

**Why**: Creates circular dependencies, breaks code splitting.

**Do Instead**: Promote shared code to `src/components/` or `src/utils/`.

---

## ❌ Never Block App Load on Optional Features

```javascript
// ❌ WRONG - App waits for push permission
await Notification.requestPermission();
// ... then render app

// ❌ WRONG - App waits for service worker
await navigator.serviceWorker.ready;
// ... then render app
```

**Why**: Blocks rendering, causes white screens on denial.

**Do Instead**: Register async features after app renders.

---

## Summary

| Category | Rule |
|----------|------|
| Layout | All in `layout.css`, no viewport JS |
| Errors | Never throw, never auto-reload |
| Modes | Dark = colors, Quiet = spacing |
| Features | No cross-imports, no blocking |

