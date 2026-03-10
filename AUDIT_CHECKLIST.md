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
