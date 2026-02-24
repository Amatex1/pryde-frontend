# Performance Measurement Guide — Pryde Social

## Before You Measure

Run measurements **at least 48 hours after a deploy** so Vercel's CDN has warmed edge caches globally.
Always measure from an **incognito window** (no extensions, no cached assets).

---

## Tools & Where to Find Data

| Tool | What It Measures | Location |
|---|---|---|
| Vercel Speed Insights | **Real user field data** (P75 LCP, CLS, INP) | Vercel Dashboard → Project → Speed Insights |
| PageSpeed Insights | Lab simulation (Lighthouse) + CrUX field data | https://pagespeed.web.dev |
| Lighthouse (DevTools) | Full lab audit, desktop + mobile | Chrome F12 → Lighthouse tab |
| WebPageTest | Waterfall, filmstrip, multi-region | https://www.webpagetest.org |

---

## Measurement Workflow

### Step 1 — Field Data (Real Users)
1. Open **Vercel Dashboard → Speed Insights**
2. Record the **P75 values** (75th percentile = 75% of users experience this or better):

| Metric | Before Fixes | Current | Target |
|---|---|---|---|
| LCP | 3550ms | ___ms | < 2500ms ✅ |
| INP | ___ms | ___ms | < 200ms ✅ |
| CLS | ___ | ___ | < 0.1 ✅ |
| FCP | ___ms | ___ms | < 1800ms ✅ |
| TTFB | ___ms | ___ms | < 800ms ✅ |

### Step 2 — Lab Data (Simulated)
Run **Lighthouse** from Chrome DevTools (incognito):

**Desktop:**
- Open https://prydeapp.com in incognito
- F12 → Lighthouse → Desktop → Analyze
- Record: Performance score, LCP, TBT, CLS

**Mobile:**
- F12 → Lighthouse → Mobile → Analyze
- Record: Performance score, LCP, TBT, CLS

| Mode | Score | LCP | TBT | CLS |
|---|---|---|---|---|
| Desktop | ___ | ___ms | ___ms | ___ |
| Mobile | ___ | ___ms | ___ms | ___ |

### Step 3 — Multi-Region (WebPageTest)
Test from regions representative of your user base:

1. Go to https://www.webpagetest.org
2. URL: `https://prydeapp.com`
3. Run from each location:
   - **Sydney, Australia** (your primary users)
   - **Singapore** (backend location)
   - **Frankfurt, Germany** (EU users)
   - **Virginia, USA** (US users)

| Region | TTFB | FCP | LCP |
|---|---|---|---|
| Sydney | ___ms | ___ms | ___ms |
| Singapore | ___ms | ___ms | ___ms |
| Frankfurt | ___ms | ___ms | ___ms |
| Virginia | ___ms | ___ms | ___ms |

---

## Field Data vs Lab Data

**Always trust field data over lab data** for real-world decisions.

| | Field Data (Speed Insights / CrUX) | Lab Data (Lighthouse) |
|---|---|---|
| Source | Real users' browsers | Simulated on Google's servers |
| Network | Real connections | Throttled (4G simulation on mobile) |
| Devices | Real phones and laptops | Fixed emulated device |
| Variability | High — averages across millions of visits | Low — deterministic |
| Use for | Tracking actual user experience | Diagnosing specific issues |

---

## Rating Thresholds (Google Core Web Vitals)

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5s – 4.0s | > 4.0s |
| INP | < 200ms | 200ms – 500ms | > 500ms |
| CLS | < 0.1 | 0.1 – 0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s – 3.0s | > 3.0s |
| TTFB | < 800ms | 800ms – 1800ms | > 1800ms |

---

## Optimisations Already Applied

These changes were made and should show improvement vs the baseline 3550ms LCP:

- [x] Google Fonts moved from CSS `@import` to `<link>` in `index.html` (eliminates render-blocking cascade)
- [x] `Home`, `Login`, `Register` converted from lazy to eager imports (removes waterfall on first visit)
- [x] `drop_console: true` in Vite (smaller JS bundles)
- [x] Manual chunk splitting: `react-vendor`, `socket` (better caching)
- [x] `OptimizedImage` component with AVIF/WebP and lazy loading (smaller images)
- [x] Vercel CDN for all static assets (edge delivery worldwide)
- [x] `<link rel="preconnect">` for Google Fonts domains

---

## If LCP Is Still > 2.5s

Work through this checklist in order (highest impact first, no SSR required):

### TTFB High (> 800ms from your region)
- Check Render logs for slow DB queries (> 50ms)
- Verify MongoDB Atlas is in `ap-southeast-1` (Singapore) to match Render
- Check for N+1 query patterns in feed endpoints

### LCP Element Is an Image
- Identify the LCP element: Lighthouse report → "LCP Element"
- Add `loading="eager"` and `fetchpriority="high"` to that specific image
- Ensure it uses `<img>` not CSS `background-image`

### LCP Element Is Text
- Check if a font is blocking render (fonts should load via `<link>`)
- Check if the text is inside a lazy-loaded component

### JavaScript Bundle Too Large
- Run: `npx vite-bundle-visualizer` in frontend
- Look for unexpectedly large chunks
- Consider splitting further

### CLS > 0.1
- Add explicit `width` and `height` attributes to all `<img>` tags
- Use `aspect-ratio` CSS on image containers
- The `OptimizedImage` component already handles this for most cases

---

## Scheduling Regular Checks

Run this measurement workflow:
- **After every major deploy** that touches JS bundles or critical path rendering
- **Monthly** as a health check even without deploys
- **When Vercel Speed Insights shows a regression** (set up email notifications in Vercel dashboard)

---

*Last measured: _______________*
*Measured by: _______________*
