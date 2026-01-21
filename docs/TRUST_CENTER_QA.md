# 🧪 TRUST CENTER - QA TESTING GUIDE

## Overview

This guide provides comprehensive testing procedures for the Trust Center to ensure all pages are publicly accessible, crawlable, and function correctly.

---

## ✅ Pre-Deployment Checklist

### 1. File Structure Verification

Verify all files exist:

\\\ash
# Check trust directory structure
ls -la public/trust/
ls -la public/trust/assets/

# Verify all HTML pages exist
ls public/trust/*.html

# Verify all PDFs exist
ls public/trust/assets/*.pdf

# Verify root-level route files
ls public/terms.html public/privacy.html public/cookies.html

# Verify directory-style routes
ls public/terms/index.html public/privacy/index.html
\\\

**Expected Files:**
- 13 HTML files in /public/trust/
- 12 PDF files in /public/trust/assets/
- 12 root-level HTML files in /public/
- 12 directory-style index.html files

---

## 🌐 Browser Testing

### Test 1: Public Access (No Authentication)

**Objective:** Verify all trust pages load without login

**Steps:**
1. Open browser in **Incognito/Private mode**
2. Navigate to each URL below
3. Verify page loads successfully (200 OK)
4. Verify content is visible
5. Verify PDF viewer displays

**URLs to Test:**
- https://pryde.social/trust
- https://pryde.social/terms
- https://pryde.social/privacy
- https://pryde.social/cookies
- https://pryde.social/community
- https://pryde.social/safety
- https://pryde.social/security
- https://pryde.social/contact
- https://pryde.social/faq
- https://pryde.social/dmca
- https://pryde.social/acceptable-use
- https://pryde.social/guarantees
- https://pryde.social/trust-safety

**Expected Result:**
- ✅ All pages load without redirect to login
- ✅ Content is visible and readable
- ✅ PDFs display in iframe
- ✅ Download buttons work
- ✅ Navigation links work

**Failure Indicators:**
- ❌ Redirect to /login
- ❌ 404 Not Found
- ❌ Blank page
- ❌ PDF not loading

---

### Test 2: JavaScript Disabled

**Objective:** Verify pages work without JavaScript

**Steps:**
1. Disable JavaScript in browser settings
2. Navigate to each trust page
3. Verify content is visible
4. Verify PDF fallback message appears

**How to Disable JavaScript:**
- **Chrome:** Settings → Privacy → Site Settings → JavaScript → Blocked
- **Firefox:** about:config → javascript.enabled → false
- **Safari:** Develop → Disable JavaScript

**Expected Result:**
- ✅ Page content loads and is readable
- ✅ PDF fallback message displays
- ✅ Download PDF link works
- ✅ Navigation links work

**Failure Indicators:**
- ❌ Blank page
- ❌ Content not visible
- ❌ No fallback for PDF viewer

---

### Test 3: Mobile Responsive

**Objective:** Verify pages work on mobile devices

**Steps:**
1. Open browser DevTools
2. Toggle device toolbar (mobile view)
3. Test on different screen sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - Desktop (1024px+)

**Expected Result:**
- ✅ Layout adapts to screen size
- ✅ Text is readable without zooming
- ✅ Buttons are touch-friendly (44px min)
- ✅ Navigation collapses on mobile
- ✅ PDF viewer adjusts height

**Failure Indicators:**
- ❌ Horizontal scrolling
- ❌ Text too small
- ❌ Buttons too small to tap
- ❌ Layout breaks

---

### Test 4: Cross-Browser Compatibility

**Objective:** Verify pages work in all major browsers

**Browsers to Test:**
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Expected Result:**
- ✅ Consistent appearance across browsers
- ✅ PDF viewer works (or shows fallback)
- ✅ Fonts render correctly
- ✅ Colors match design

---

## 🔍 SEO & Crawlability Testing

### Test 5: Search Engine Bot Access

**Objective:** Verify bots can crawl pages

**Steps:**
1. Use curl with bot user agents
2. Verify 200 OK response
3. Check for CAPTCHA challenges

\\\ash
# Test as Googlebot
curl -I -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://pryde.social/terms

# Test as Bingbot
curl -I -A "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" https://pryde.social/privacy

# Test as DuckDuckBot
curl -I -A "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)" https://pryde.social/community
\\\

**Expected Result:**
- ✅ HTTP 200 OK
- ✅ No redirect to login
- ✅ No CAPTCHA challenge
- ✅ Content-Type: text/html

**Failure Indicators:**
- ❌ HTTP 403 Forbidden
- ❌ HTTP 429 Too Many Requests
- ❌ Redirect to CAPTCHA page
- ❌ Cloudflare challenge page

---

### Test 6: Meta Tags & SEO

**Objective:** Verify proper SEO meta tags

**Steps:**
1. View page source for each trust page
2. Check for required meta tags

**Required Meta Tags:**
\\\html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="...">
<meta name="robots" content="index, follow">
<title>Page Title - Pryde Social</title>
<link rel="canonical" href="https://pryde.social/...">
\\\

**Expected Result:**
- ✅ All meta tags present
- ✅ Unique descriptions for each page
- ✅ Canonical URLs correct
- ✅ Robots meta allows indexing

---

## 🔗 Link Testing

### Test 7: Internal Navigation

**Objective:** Verify all links work correctly

**Steps:**
1. Click every link in header navigation
2. Click every link in footer
3. Click "Back to Trust Center" buttons
4. Click "Download PDF" buttons

**Expected Result:**
- ✅ All links navigate correctly
- ✅ No broken links (404)
- ✅ PDF downloads work
- ✅ Navigation is consistent

**Failure Indicators:**
- ❌ 404 Not Found
- ❌ Redirect to login
- ❌ Broken PDF links

---

### Test 8: Footer Links from React App

**Objective:** Verify footer links in React app work

**Steps:**
1. Log into the app
2. Navigate to /feed
3. Scroll to footer
4. Click each legal link

**Expected Result:**
- ✅ Links navigate to static trust pages
- ✅ No SPA routing (full page load)
- ✅ Pages load without authentication

**Failure Indicators:**
- ❌ 404 Not Found
- ❌ SPA routing instead of static page
- ❌ Redirect to login

---

## 📄 PDF Testing

### Test 9: PDF Viewer

**Objective:** Verify PDFs display correctly

**Steps:**
1. Navigate to each trust page
2. Verify PDF displays in iframe
3. Test PDF controls (zoom, scroll, download)

**Expected Result:**
- ✅ PDF displays in iframe
- ✅ PDF is readable
- ✅ Zoom controls work
- ✅ Scroll works
- ✅ Download button works

**Failure Indicators:**
- ❌ PDF not loading
- ❌ Blank iframe
- ❌ CORS error
- ❌ 404 on PDF file

---

### Test 10: PDF Download

**Objective:** Verify PDF downloads work

**Steps:**
1. Click "Download PDF" button on each page
2. Verify file downloads
3. Open downloaded PDF
4. Verify content is correct

**Expected Result:**
- ✅ PDF downloads successfully
- ✅ Filename is correct (e.g., terms.pdf)
- ✅ PDF opens in viewer
- ✅ Content matches page

---

## 🛡️ Security Testing

### Test 11: Cloudflare WAF

**Objective:** Verify WAF doesn't block legitimate traffic

**Steps:**
1. Test from different IP addresses
2. Test from different countries (VPN)
3. Test with different user agents
4. Test rapid requests (not rate limited)

**Expected Result:**
- ✅ No CAPTCHA challenges
- ✅ No geo-blocking
- ✅ No rate limiting
- ✅ Consistent access globally

**Failure Indicators:**
- ❌ CAPTCHA challenge
- ❌ Blocked by country
- ❌ Rate limited
- ❌ 403 Forbidden

---

### Test 12: HTTPS & Security Headers

**Objective:** Verify secure connection and headers

\\\ash
# Check security headers
curl -I https://pryde.social/terms
\\\

**Expected Headers:**
- ✅ Strict-Transport-Security
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: SAMEORIGIN (or CSP)
- ✅ Content-Security-Policy

---

## ♿ Accessibility Testing

### Test 13: Keyboard Navigation

**Objective:** Verify keyboard accessibility

**Steps:**
1. Navigate page using only keyboard
2. Tab through all interactive elements
3. Verify focus indicators visible
4. Test Enter/Space on buttons

**Expected Result:**
- ✅ All links/buttons reachable via Tab
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ Enter/Space activates buttons

---

### Test 14: Screen Reader

**Objective:** Verify screen reader compatibility

**Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (Mac/iOS)
- TalkBack (Android)

**Expected Result:**
- ✅ Page structure announced correctly
- ✅ Headings navigable
- ✅ Links descriptive
- ✅ Images have alt text

---

## 🚀 Performance Testing

### Test 15: Page Load Speed

**Objective:** Verify fast page loads

**Tools:**
- Chrome DevTools Network tab
- Lighthouse
- WebPageTest

**Expected Metrics:**
- ✅ First Contentful Paint < 1.5s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Total page size < 500KB
- ✅ Lighthouse Performance > 90

---

### Test 16: Caching

**Objective:** Verify proper caching

\\\ash
# Check cache headers
curl -I https://pryde.social/terms
curl -I https://pryde.social/trust/assets/terms.pdf
\\\

**Expected Headers:**
- ✅ Cache-Control present
- ✅ ETag present
- ✅ Appropriate max-age

---

## 🔄 Integration Testing

### Test 17: App Routes Still Work

**Objective:** Verify SPA routes not broken

**Steps:**
1. Log into app
2. Navigate to protected routes:
   - /feed
   - /profile/:username
   - /messages
   - /settings
   - /notifications

**Expected Result:**
- ✅ All app routes work normally
- ✅ No interference from trust pages
- ✅ Authentication still required

---

### Test 18: Logout Flow

**Objective:** Verify logout doesn't break trust pages

**Steps:**
1. Log into app
2. Navigate to /feed
3. Log out
4. Navigate to /terms
5. Verify page loads

**Expected Result:**
- ✅ Trust pages accessible after logout
- ✅ No redirect to login
- ✅ Content visible

---

## 📊 Test Results Template

\\\markdown
## Test Results - [Date]

### Browser Testing
- [ ] Public Access (Incognito)
- [ ] JavaScript Disabled
- [ ] Mobile Responsive
- [ ] Cross-Browser

### SEO & Crawlability
- [ ] Bot Access
- [ ] Meta Tags

### Link Testing
- [ ] Internal Navigation
- [ ] Footer Links

### PDF Testing
- [ ] PDF Viewer
- [ ] PDF Download

### Security
- [ ] Cloudflare WAF
- [ ] HTTPS & Headers

### Accessibility
- [ ] Keyboard Navigation
- [ ] Screen Reader

### Performance
- [ ] Page Load Speed
- [ ] Caching

### Integration
- [ ] App Routes
- [ ] Logout Flow

### Issues Found
[List any issues discovered]

### Notes
[Additional observations]
\\\

---

## 🐛 Common Issues & Solutions

### Issue: 404 on Trust Pages

**Cause:** Static files not deployed or routing issue

**Solution:**
1. Verify files exist in /public/trust/
2. Check Cloudflare cache
3. Purge Cloudflare cache
4. Verify _redirects file

### Issue: PDF Not Loading

**Cause:** CORS or MIME type issue

**Solution:**
1. Check PDF file exists
2. Verify MIME type is pplication/pdf
3. Check browser console for errors
4. Test direct PDF URL

### Issue: Redirect to Login

**Cause:** Authentication middleware catching trust routes

**Solution:**
1. Verify routes are public in React Router
2. Check backend API routes
3. Verify Cloudflare rules

---

## ✅ Sign-Off Checklist

Before marking QA complete:

- [ ] All 18 tests passed
- [ ] No critical issues found
- [ ] All browsers tested
- [ ] Mobile tested
- [ ] Accessibility verified
- [ ] Performance acceptable
- [ ] SEO optimized
- [ ] Security headers present
- [ ] PDFs working
- [ ] Links working
- [ ] App routes unaffected
- [ ] Documentation reviewed

**Tested By:** _______________  
**Date:** _______________  
**Approved By:** _______________  
**Date:** _______________

---

**Last Updated:** January 9, 2026
