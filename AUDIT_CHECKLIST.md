# Pryde Social Audit Remediation Checklist

> Working tracker for the 87/100 audit remediation pass. This file is now the source of truth for fixes and status updates.

## Audit Snapshot

- Current audited score: **87/100**
- Re-scored after major remediation: **92/100**
- Re-scored after warning/import-graph cleanup follow-up: **93/100**
- Near-term target after phase 1: **91–93/100**
- Focus: frontend UX consistency, accessibility, async-state polish, maintainability, and performance follow-ups
- Last updated: **2026-03-10**

---

## Phase 1 — High-Impact UX & Accessibility Fixes

- [x] Sync mobile navbar hamburger `aria-expanded` with actual drawer state
- [x] Return focus to the mobile menu trigger when the drawer closes
- [x] Keep mobile drawer trigger and close behavior synchronized across shared layouts
- [x] Replace internal footer `<a href>` links with SPA `Link` navigation
- [x] Standardize Search loading / error / empty states with shared components
- [x] Standardize Discover loading / error / empty states with shared components
- [x] Standardize Notifications loading / error / empty states with shared components
- [x] Replace clickable `div` cards with semantic buttons on Search / Discover / Notifications
- [x] Add focused frontend tests for shared nav, footer, and async-state fixes

## Phase 2 — Maintainability & Page Decomposition

- [x] Break down oversized page components beginning with `Feed.jsx`
- [x] Break down oversized page components beginning with `Profile.jsx`
- [x] Reduce duplicated async-state patterns across secondary pages
- [x] Consolidate repeated page-header and card interaction patterns

## Phase 3 — Performance & Delivery Follow-Ups

- [x] Review route-level lazy loading coverage for non-critical pages
- [x] Audit import graph for auth / api / socket-heavy entry points
- [x] Eliminate Vite mixed static/dynamic import warnings in the auth / api / socket graph
- [x] Reduce unnecessary eager-loading in secondary feature surfaces
- [x] Re-check bundle composition after phase 1 and phase 2 cleanup

## Phase 4 — Final Polish / Verification

- [x] Re-run targeted frontend tests for remediated surfaces
- [x] Re-run broader frontend test suite after major cleanup waves
- [x] Re-check keyboard and focus behavior on mobile navigation
- [x] Re-check secondary pages for consistent empty/error messaging
- [x] Re-score the site after major remediation waves

## Post-Push Regression Fixes

- [x] Restore the legacy desktop `/messages` composer layout so the textbox remains visible on PC
- [x] Remove duplicate reply indentation so threaded replies no longer shift too far right
- [x] Normalize the feed/comment three-dot menu button sizing across desktop and mobile breakpoints
- [x] Allow profile/cover reposition saves to update position metadata without re-uploading existing remote media
- [x] Remove invalid `aria-hidden` usage from admin modal overlays containing focused controls

## Verification Log

- [x] Phase 1 targeted frontend tests executed and passing
- [x] Phase 1 checklist items marked complete after validation
- [x] Validation command: `npm test -- src/components/Footer.test.jsx src/components/Navbar.test.jsx src/layouts/MobileNavDrawer.test.jsx src/pages/__tests__/AuditRemediationPages.test.jsx` (9/9 tests passing on 2026-03-10)
- [x] Focused Phase 2/3 validation command: `npm test -- src/pages/__tests__/Feed.smoke.test.js src/pages/__tests__/Profile.smoke.test.js src/pages/legal/LegalPageWrapper.test.jsx src/components/feed/FeedCommentSheet.test.jsx src/components/feed/FeedMobileCommentModal.test.jsx src/pages/__tests__/AuditRemediationPages.test.jsx` (13/13 tests passing on 2026-03-10)
- [x] Broader frontend suite: `npm test` (27/27 files, 65/65 tests passing on 2026-03-10)
- [x] Production build re-check: `npm run build` passed on 2026-03-10
- [x] Focused import-graph validation: `npm test -- src/context/__tests__/AuthContext.test.js src/components/Footer.test.jsx` (2/2 tests passing on 2026-03-10)
- [x] Focused production build re-check: `npm run build` passed on 2026-03-10 with mixed static/dynamic import warnings eliminated
- [x] Bundle note: the remaining performance opportunity is chunk sizing rather than import-graph warnings (`assets/js/index` ~275 KB, `react-vendor` ~162 KB, with medium/large route chunks like `Feed`, `Profile`, `MessagesApp`, and `Admin`)
- [x] Focused `/messages` desktop regression validation: `npm test -- src/pages/__tests__/Messages.desktopLayout.test.js` (1/1 tests passing on 2026-03-10)
- [x] Focused photo editor regression validation: `npm test -- src/components/PhotoRepositionFullscreen.test.jsx` (6/6 tests passing on 2026-03-10)

---

## Responsive Design Audit — 2026-03-10

### Scope

- Reviewed shared responsive layout files: `src/layouts/AppLayout.css`, `src/layouts/FullViewportLayout.css`, `src/layouts/MobileNavDrawer.css`, `src/styles/navbar.css`
- Reviewed representative page-level responsive rules: `src/pages/Profile.css`, `src/pages/Discover.css`, `src/pages/Notifications.css`
- Goal: confirm that the frontend can scale cleanly from very small phones to very large monitors without competing layout rules

### Executive Summary

- The app has a solid responsive foundation: fluid cards, mobile-first sections, safe-area usage, and several large-monitor width caps already exist.
- The main risk is architectural, not cosmetic: multiple files still behave as separate layout authorities.
- Result: the app will often look "mostly responsive," but edge widths and cross-page consistency are vulnerable because breakpoints, nav visibility, viewport behavior, and container widths are not governed from one source of truth.

### Audit Checklist Completed

- [x] Shared breakpoint ownership reviewed
- [x] Mobile navigation visibility rules reviewed
- [x] Full-viewport layout behavior reviewed
- [x] Large-monitor container strategy reviewed
- [x] Small-phone overflow / spacing risk reviewed
- [x] Representative page CSS reviewed for page-specific layout divergence

### Highest-Priority Findings

1. **Breakpoint authority conflict in shared navigation**
   - `src/layouts/AppLayout.css` shows `.mobile-nav` up to `1280px`.
   - `src/layouts/MobileNavDrawer.css` hides drawer UI from `1024px` upward.
   - `src/styles/navbar.css` hides `.navbar-actions` at `max-width: 768px` and hides `.mobile-hamburger-btn` at `min-width: 768px`.
   - Impact: there are overlap/gap zones where different navigation systems disagree about which controls should be visible.

2. **Full-viewport pages bypass the shared page shell**
   - `src/layouts/FullViewportLayout.css` uses `position: fixed` on all four edges with no shared max-width or horizontal page padding.
   - Impact: any page using this layout can drift from the rest of the app's responsive behavior and create device-specific overflow, safe-area, or stacking differences.

3. **Page-level container widths are not unified**
   - `Discover.css`, `Notifications.css`, and `Profile.css` each define their own max-width and breakpoint strategies.
   - Impact: pages may all be individually responsive, but they will not feel consistently responsive across the product, especially on tablets and ultra-wide screens.

4. **`Profile.css` acts like its own responsive framework**
   - The file is very large and contains multiple layout systems for the same page: profile grid, create-post grid, sidebar behavior, mobile avatar positioning, and repeated mobile overrides.
   - Impact: Profile is the most likely place for future regressions on narrow tablets, small phones, and intermediate widths.

### Detailed Findings by Area

#### Shared layout and nav

- **High:** unify the activation boundary for mobile nav, mobile drawer, and navbar actions/hamburger.
- **High:** fix the `768px` boundary conflict so there is never a width where desktop actions and hamburger can both be hidden.
- **Medium:** centralize breakpoint tokens so layout CSS does not hardcode different cutoffs in multiple files.

#### Full viewport layouts

- **High:** limit full-viewport behavior to truly immersive surfaces only.
- **High:** introduce a shared full-viewport shell that still respects app-level safe-area, header, and mobile-nav conventions.
- **Medium:** audit any fixed-position descendants inside full-viewport pages for stacking conflicts with sticky nav or drawers.

#### Page containers and content width

- **Medium:** standardize page container presets such as `narrow`, `default`, `wide`, and `full` instead of page-by-page width decisions.
- **Medium:** align large-monitor behavior so pages expand intentionally rather than each file inventing its own max-width ladder.

#### Profile page

- **High:** refactor `src/pages/Profile.css` into smaller feature-scoped sections/components.
- **High:** remove duplicated or competing mobile rules for avatar overlap, sidebar stacking, and action layouts.
- **Medium:** replace page-local breakpoint logic with shared layout tokens wherever possible.
- **Medium:** review `480px`, `768px`, `1024px`, `1401px`, `1440px`, and `2560px` transitions together; the page currently responds to many separate cutoffs.

#### Representative page notes

- `Discover.css`: generally clean, but it still defines its own grid escalation and width strategy rather than inheriting a shared page-container system.
- `Notifications.css`: responsive card stack is solid, but the mobile-specific top padding (`5rem`) looks like an ad hoc compensation rather than a shared shell rule.
- `Profile.css`: strongest feature richness, highest regression risk.

### Recommended Remediation Order

1. Align all shared nav breakpoints and visibility rules.
2. Define one responsive source of truth for page container widths and breakpoint tokens.
3. Bring full-viewport pages under a shared shell contract.
4. Refactor `Profile.css` to remove duplicated layout authority.
5. Re-audit tablets (`768–1280px`) and large monitors (`1440px+`) after the shared rules are unified.

### Bottom Line

- No single catastrophic responsiveness failure was identified in the sampled files.
- The biggest problem is **consistency debt**: several responsive systems are each reasonable on their own, but they compete at the product level.
- If the team wants the UI to look reliably polished on every device size, the next step is not isolated page tweaks; it is consolidating the shared responsive contract.
