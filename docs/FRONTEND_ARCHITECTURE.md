# Pryde Frontend Architecture

## Overview

Pryde is a **single-app, mobile-first web application** built with React + Vite. It uses a unified codebase for all platforms (mobile, tablet, desktop) with no viewport-based code forking.

## Core Principles

1. **One App, Many Views** - No separate mobile/desktop builds
2. **CSS-First Responsive** - All responsiveness via CSS media queries
3. **No Viewport Detection** - Never use `innerWidth`, `matchMedia()` in feature code
4. **Layout Primitives** - PageViewport → PageContainer → PageLayout hierarchy
5. **Fail Gracefully** - ErrorBoundary, offline support, circuit breakers

## Directory Structure

```
src/
├── components/       # Reusable UI components
├── context/          # React contexts (Auth, etc.)
├── features/         # Feature-specific modules
├── hooks/            # Custom React hooks
├── layouts/          # Layout primitives (PageContainer, PageLayout, AppLayout)
├── pages/            # Route-level page components
├── state/            # Global state management
├── styles/           # Global CSS (layout.css is authority)
└── utils/            # Utility functions
```

## State & Data Flow

### Authentication
- `AuthContext` is the single source of truth for auth state
- Circuit breaker pattern prevents infinite auth loops
- Token refresh uses single-flight pattern (no duplicate requests)

### API Layer
- `apiClient.js` handles all HTTP requests
- Request deduplication prevents duplicate calls
- Structured error responses (never throws raw errors)
- Automatic token refresh with single retry

### Real-time
- Socket.io for live updates (messages, notifications)
- Graceful reconnection on disconnect
- Cross-tab auth sync via BroadcastChannel

## PWA Strategy

### Service Worker
- **Push-only** service worker (no fetch/cache interception)
- Prevents cache-related issues and ERR_FAILED errors
- Safe to update without breaking client

### Offline Handling
- `offlineManager.js` detects network state changes
- Operations pause while offline (no error storms)
- Never logs out user due to offline errors

### Updates
- Version checking every 60 seconds
- Soft prompts for updates (no forced reloads)
- Cache-busting on critical assets

## Error Handling

### Boundaries
- Global `ErrorBoundary` wraps entire app
- `PageErrorBoundary` for section-level recovery
- `lazyWithReload` handles chunk load failures gracefully

### API Errors
- Normalized via `createApiError()` / `isApiError()`
- Never throws to components
- Structured: `{ error: true, status, message, code }`

## Feature Boundaries

Features are self-contained modules in `src/features/`:
- Own components, hooks, and styles
- Import from shared `utils/` and `components/`
- Never import across features

## Build & Deploy

- **Build**: `npm run build` (Vite production build)
- **Deploy**: Cloudflare Pages (automatic on push to main)
- **Preview**: PR preview deployments

## Key Files

| File | Purpose |
|------|---------|
| `src/styles/layout.css` | Single authority for layout variables |
| `src/context/AuthContext.jsx` | Auth state management |
| `src/utils/apiClient.js` | HTTP client with deduplication |
| `src/utils/authCircuitBreaker.js` | Auth stability guard |
| `src/layouts/PageContainer.jsx` | Page width constraint |
| `src/components/ErrorBoundary.jsx` | Global error catching |

