# Frontend Security Guide

This guide covers the security rules for the Pryde frontend.

## Non-negotiable rules

- Never commit secrets or provider credentials to the frontend repo.
- Only truly public values belong in `VITE_` variables.
- Treat every `VITE_` value as browser-visible.
- Keep access tokens out of persistent browser storage unless a reviewed design explicitly requires otherwise.
- Do not introduce new `dangerouslySetInnerHTML` usage without a documented review.

## Current repo protections

- [x] `npm run security:scan` checks for likely leaked secrets.
- [x] CI includes a required frontend secret-scan job.
- [x] A tracked pre-commit hook is available via `npm run hooks:install`.
- [x] Auth/CSRF request helpers have focused regression coverage.
- [x] Message rendering is covered by a regression test that keeps user content as plain text.

## Environment variable rules

### Safe for the frontend bundle

- public API origin
- public push key
- public captcha site key
- public CDN/media origin when intentionally exposed

### Never put in the frontend bundle

- database credentials
- JWT or refresh secrets
- API provider private keys
- email provider secrets
- storage provider private credentials

If a value would be dangerous in browser devtools, it does not belong in a frontend env var.

## Secure coding expectations

- Use shared request helpers for auth and CSRF-sensitive API calls.
- Keep recovery logging low-noise and non-sensitive in production paths.
- Render user-generated content as text or with reviewed context-aware sanitization.
- Re-check service worker, push, and socket changes for token leakage or unsafe caching.

## Before committing frontend changes

- Run `npm run security:scan` if docs, config, env handling, auth, or network code changed.
- Run the smallest relevant test scope first, then the broader affected suite.
- Review the browser bundle assumptions for any new `VITE_` variable.
- Confirm no console output leaks token presence, cookie state, or provider configuration.

## If something sensitive is committed

1. Rotate the affected credential set immediately.
2. Update the managed environment variables in the relevant platform.
3. Review build logs, PRs, screenshots, and copied snippets for the same exposure.
4. Clean history only after rotation and communication are complete.
5. Add a regression control if the leak bypassed existing review or scanning.

## Useful commands

- `npm run security:scan`
- `npm run hooks:install`
- `npm test`
- `npm run build`

