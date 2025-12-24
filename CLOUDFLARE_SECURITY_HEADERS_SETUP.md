# 🔒 Cloudflare Security Headers Setup Guide

## Overview

This guide explains how to configure security headers for **prydeapp.com** using Cloudflare to improve your Lighthouse Best Practices score from 81 to 95+.

---

## ✅ What's Already Done

The security headers are already configured in `public/_headers` for Cloudflare Pages. This file is automatically deployed with your frontend.

**No manual Cloudflare Dashboard configuration needed!** 🎉

---

## 📋 Headers Configured

### 1. **HSTS (HTTP Strict Transport Security)**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**What it does:**
- Forces HTTPS for 1 year (31536000 seconds)
- Applies to all subdomains
- Eligible for browser preload list

**Lighthouse Impact:** ✅ Required for Best Practices 100

---

### 2. **CSP (Content Security Policy)**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```

**What it does:**
- Prevents XSS (Cross-Site Scripting) attacks
- Controls which resources can be loaded
- Allows React, hCaptcha, Google Fonts, backend API
- Blocks unauthorized scripts and resources

**Allowed Sources:**
- ✅ Your own domain (`'self'`)
- ✅ Backend API (`https://pryde-social.onrender.com`)
- ✅ hCaptcha (`https://hcaptcha.com`, `https://*.hcaptcha.com`)
- ✅ Google Fonts (`https://fonts.googleapis.com`, `https://fonts.gstatic.com`)
- ✅ Data URIs (`data:`)
- ✅ HTTPS images (`https:`)
- ✅ Blob URLs (`blob:`)

**Note:** `'unsafe-inline'` and `'unsafe-eval'` are needed for React but reduce security. Consider using nonces or hashes in the future for better security.

**Lighthouse Impact:** ✅ Required for Best Practices 100

---

### 3. **COOP (Cross-Origin-Opener-Policy)**
```
Cross-Origin-Opener-Policy: same-origin-allow-popups
```

**What it does:**
- Isolates your browsing context from other origins
- Allows OAuth popups (for future social login features)
- Protects against Spectre-like attacks
- Prevents malicious sites from accessing your window

**Lighthouse Impact:** ✅ Required for Best Practices 100

---

### 4. **Additional Security Headers (Already Configured)**

**X-Frame-Options**
```
X-Frame-Options: SAMEORIGIN
```
- Prevents clickjacking attacks
- Only allows framing from same origin

**X-Content-Type-Options**
```
X-Content-Type-Options: nosniff
```
- Prevents MIME type sniffing
- Forces browser to respect declared content types

**X-XSS-Protection**
```
X-XSS-Protection: 1; mode=block
```
- Additional XSS protection for older browsers
- Blocks page if XSS attack detected

**Referrer-Policy**
```
Referrer-Policy: strict-origin-when-cross-origin
```
- Privacy protection
- Only sends origin (not full URL) to external sites

**Permissions-Policy**
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```
- Blocks unnecessary browser permissions
- Prevents unauthorized access to device features

---

## 🚀 Deployment

### Automatic Deployment
The headers are automatically deployed when you push to GitHub:

1. **Cloudflare Pages** reads `public/_headers`
2. **Applies headers** to all routes
3. **No manual configuration needed!**

### Verify Deployment

After deployment, verify headers are applied:

**Method 1: Browser DevTools**
1. Open prydeapp.com
2. Press F12 (DevTools)
3. Go to **Network** tab
4. Refresh page
5. Click on the first request (document)
6. Check **Response Headers** section
7. Verify you see:
   - `strict-transport-security`
   - `content-security-policy`
   - `cross-origin-opener-policy`

**Method 2: Online Tool**
1. Go to https://securityheaders.com
2. Enter `https://prydeapp.com`
3. Click **Scan**
4. Check the grade (should be A or A+)

**Method 3: cURL**
```bash
curl -I https://prydeapp.com
```

---

## 📊 Expected Lighthouse Scores

### Before
- Performance: 99
- Accessibility: 100
- **Best Practices: 81** ❌
- SEO: 100

### After (Headers Applied)
- Performance: 99-100
- Accessibility: 100
- **Best Practices: 95+** ✅
- SEO: 100

### To Reach 100/100 Best Practices
The remaining issue is the deprecated API warning from **Cloudflare Bot Fight Mode**:

**Solution:**
1. Go to Cloudflare Dashboard
2. Navigate to **Security** → **Bots**
3. Find **Bot Fight Mode**
4. Click **Configurations**
5. Toggle **JS Detections** to **Off**

This will bring Best Practices from 95 to **100** ✅

---

## 🔧 Troubleshooting

### Headers Not Showing Up?

**1. Clear Cloudflare Cache**
- Go to Cloudflare Dashboard
- Navigate to **Caching** → **Configuration**
- Click **Purge Everything**
- Wait 2-3 minutes

**2. Hard Refresh Browser**
- Press Ctrl+Shift+R (Windows/Linux)
- Press Cmd+Shift+R (Mac)

**3. Check Deployment**
- Verify Cloudflare Pages deployment succeeded
- Check deployment logs for errors

### CSP Blocking Resources?

If CSP blocks legitimate resources, update `public/_headers`:

**Add to `script-src`:**
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://your-new-domain.com
```

**Add to `connect-src`:**
```
connect-src 'self' https://your-api.com wss://your-websocket.com
```

**Add to `img-src`:**
```
img-src 'self' data: https: https://your-cdn.com
```

Then commit and push changes.

---

## 📝 Summary

✅ **Security headers configured** in `public/_headers`  
✅ **Automatically deployed** via Cloudflare Pages  
✅ **No manual Cloudflare Dashboard setup needed**  
✅ **Lighthouse Best Practices**: 81 → 95+ (100 with Bot Fight Mode fix)  
✅ **Better security** against XSS, clickjacking, MITM attacks  

**Next Steps:**
1. Wait for deployment (1-2 minutes)
2. Clear Cloudflare cache
3. Verify headers with DevTools or securityheaders.com
4. Run Lighthouse audit
5. Optionally disable Bot Fight Mode JS Detections for 100/100

🎉 **Your site is now more secure and Lighthouse-optimized!**

