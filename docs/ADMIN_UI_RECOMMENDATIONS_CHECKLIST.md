# Admin UI Recommendations & Implementation Checklist

## Purpose
This document captures the 7 recommended improvements for the `/admin` experience and turns them into a practical implementation checklist.

## The 7 Recommendations

### 1. Unify the admin shell and layout primitives
Use one shared admin page shell for page width, header spacing, section spacing, and content surfaces so every admin screen starts from the same structure.

### 2. Replace inline styling in admin views with shared classes and tokens
Move one-off inline styles into shared admin classes backed by design tokens so spacing, typography, color, and state handling stay consistent.

### 3. Standardize cards, tables, forms, and buttons
Create one reusable admin component language for panels, tables, filters, action rows, form controls, and button variants.

### 4. Make empty, loading, and error states consistent
Every admin surface should use the same treatment for empty states, spinners/skeletons, alerts, and retry affordances.

### 5. Improve spacing hierarchy and section structure
Give each screen a predictable rhythm: page header, section intro, actions, main content, and secondary details.

### 6. Standardize modal and overlay treatment
Use one modal pattern for width, padding, focus handling, footer actions, close affordance, and accessibility behavior.

### 7. Strengthen information hierarchy before adding visual polish
Prioritize clearer headings, descriptions, grouping, and action placement before adding more decorative styling.

## Implementation Checklist

### Phase 1 — Foundations
- [ ] Audit current `/admin` pages and list where inline styles or one-off layout patterns still exist.
- [ ] Define the canonical admin page structure using existing shared admin layout classes.
- [ ] Document the approved spacing, typography, panel, and action-row patterns for admin pages.

### Phase 2 — Shared UI primitives
- [ ] Create or finish shared admin classes for panels, section headers, action rows, filters, tables, forms, and badges.
- [ ] Standardize button sizing, icon spacing, and variant rules across admin screens.
- [ ] Standardize empty, loading, success, warning, and error state components.

### Phase 3 — Modal and interaction cleanup
- [ ] Apply one modal pattern across admin flows.
- [ ] Verify keyboard focus, escape-to-close, and screen-reader behavior for every modal.
- [ ] Remove remaining accessibility hazards caused by hidden-but-focused overlays or inconsistent dialog structure.

### Phase 4 — Page-by-page rollout
- [ ] Refactor the admin badges experience first as the reference implementation.
- [ ] Roll the same system into the next highest-traffic admin surfaces.
- [ ] Remove obsolete inline styles and duplicate CSS after each page is migrated.

### Phase 5 — QA and lock-in
- [ ] Review desktop and mobile layouts for spacing, alignment, and overflow issues.
- [ ] Validate empty/loading/error states on each migrated page.
- [ ] Capture before/after screenshots for the admin pages so the new UI contract is easy to preserve.

## Suggested Order
1. Admin badges
2. Shared modal flows
3. Table-heavy admin pages
4. Form-heavy admin pages
5. Final spacing and polish sweep