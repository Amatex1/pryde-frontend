# Frontend Deployment Checklist

Use this checklist for each frontend release.

## 1. Local release gates

- [ ] `npm run security:scan`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Review any changed `VITE_` variables for browser visibility.

## 2. Vercel configuration review

- [ ] Only public values are configured as frontend environment variables.
- [ ] `VITE_API_DOMAIN` points at the intended backend origin.
- [ ] Push/captcha keys are the public keys only.
- [ ] Optional override variables are unset unless intentionally required.
- [ ] Preview and production environments use the correct values.

## 3. Domain and transport checks

- [ ] HTTPS is enforced.
- [ ] The intended custom domain resolves correctly.
- [ ] Auth requests and socket connections go to the expected backend origin.
- [ ] CDN/media origin configuration matches backend expectations.

## 4. Browser security checks

- [ ] No new unsafe HTML rendering paths were introduced.
- [ ] User-generated message/content surfaces still render safely.
- [ ] Production logging does not expose token presence or auth internals.
- [ ] Security headers and CSP behavior are still correct for the deployed origin.

## 5. Post-deploy smoke tests

- [ ] App loads without console errors.
- [ ] Login and logout succeed.
- [ ] Session recovery works after an expired access token.
- [ ] CSRF-protected mutations succeed through the real frontend.
- [ ] Navigation and page refresh work without route breakage.
- [ ] Realtime features reconnect correctly after auth refresh.

## 6. Integration checks

- [ ] Registration works.
- [ ] Posting works.
- [ ] Messaging works.
- [ ] Notifications and sockets work.
- [ ] Media loads from the expected origin.

## 7. Rollback readiness

- [ ] Previous working frontend deployment is identified.
- [ ] Backend compatibility is known if the frontend must be rolled back.
- [ ] The operator knows whether any env-var or domain change also requires backend rollback.

## Notes

- Never treat a `VITE_` variable as secret.
- Do not use broad placeholder security settings in production.
- If auth, CSRF, socket, or message rendering changes, the smoke tests above are mandatory.
