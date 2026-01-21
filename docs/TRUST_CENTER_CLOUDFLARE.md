# 🛡️ TRUST CENTER - CLOUDFLARE CONFIGURATION

## Overview

The Trust Center consists of static HTML pages that MUST be publicly accessible without authentication. These pages are critical for SEO, legal compliance, and user trust.

---

## 📁 Trust Center Routes

All these routes MUST be publicly accessible:

### Legal Documents
- /terms - Terms of Service
- /privacy - Privacy Policy
- /cookies - Cookie Policy
- /acceptable-use - Acceptable Use Policy
- /dmca - DMCA Copyright Policy

### Trust & Safety
- /trust - Trust Center Index
- /trust-safety - Trust & Safety Overview
- /community - Community Guidelines
- /safety - Safety Center
- /security - Security Information
- /guarantees - Platform Guarantees

### Support
- /faq - Frequently Asked Questions
- /contact - Contact Us

---

## ⚠️ CRITICAL: Cloudflare WAF Configuration

### 1. **Allow Public Access to Trust Center**

Ensure Cloudflare WAF rules DO NOT block GET requests to:
- /trust/*
- /terms*
- /privacy*
- /cookies*
- /community*
- /safety*
- /security*
- /contact*
- /faq*
- /dmca*
- /acceptable-use*
- /guarantees*
- /trust-safety*

### 2. **Allow Search Engine Bots**

Whitelist verified bots for SEO:
- Googlebot
- Bingbot
- DuckDuckBot
- Yandex
- Baidu
- Other verified search engine crawlers

**How to verify bots:**
- Use reverse DNS lookup
- Check User-Agent
- Verify IP ranges

### 3. **Geo-Blocking Scope**

If you have geo-blocking enabled for signup:

✅ **ALLOW** these routes globally:
- All /trust/* routes
- All legal pages
- All support pages

❌ **ONLY BLOCK** these routes:
- /api/auth/signup (backend API endpoint)
- /register (frontend signup page) - OPTIONAL

**IMPORTANT:** Do NOT block legal/trust pages based on geography. These must be accessible worldwide for compliance and transparency.

---

## 🔒 Security Rules

### Rate Limiting

Apply rate limiting ONLY to:
- /api/* endpoints (backend)
- /register (frontend signup)
- /login (frontend login)

**DO NOT** rate limit:
- /trust/*
- Legal pages
- Support pages

### CAPTCHA Challenges

Apply CAPTCHA challenges ONLY to:
- /api/auth/signup
- /api/auth/login
- /api/contact (if you have a contact form API)

**DO NOT** challenge:
- Static legal pages
- Trust center pages
- PDF downloads

---

## 📊 Monitoring

### What to Monitor

1. **404 Errors on Legal Pages**
   - Alert if /terms, /privacy, etc. return 404
   - These should ALWAYS return 200 OK

2. **Bot Access**
   - Monitor search engine bot access to legal pages
   - Ensure bots can crawl without being blocked

3. **PDF Downloads**
   - Monitor /trust/assets/*.pdf access
   - Ensure PDFs are being served correctly

### Cloudflare Analytics

Check these metrics weekly:
- Requests to /trust/*
- Requests to legal pages
- Bot traffic to legal pages
- 404 errors on legal routes

---

## 🚀 Deployment Checklist

Before deploying Trust Center:

- [ ] Verify all /trust/* routes are publicly accessible
- [ ] Test legal pages load without authentication
- [ ] Verify PDFs download correctly
- [ ] Test with VPN from different countries
- [ ] Test with search engine bot user agents
- [ ] Verify no CAPTCHA challenges on legal pages
- [ ] Check Cloudflare WAF rules don't block legal pages
- [ ] Test in incognito/private browsing mode
- [ ] Verify robots.txt allows crawling of legal pages
- [ ] Test with JavaScript disabled

---

## 🔍 Testing Commands

### Test Public Access (No Auth Required)

\\\ash
# Test Terms page
curl -I https://pryde.social/terms

# Test Privacy page
curl -I https://pryde.social/privacy

# Test Trust Center
curl -I https://pryde.social/trust

# Test PDF download
curl -I https://pryde.social/trust/assets/terms.pdf
\\\

All should return 200 OK without redirects to login.

### Test Bot Access

\\\ash
# Test as Googlebot
curl -I -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://pryde.social/terms

# Test as Bingbot
curl -I -A "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" https://pryde.social/privacy
\\\

Should return 200 OK without challenges.

---

## 🛠️ Cloudflare Page Rules

### Recommended Page Rules

1. **Cache Legal Pages**
   \\\
   URL: pryde.social/trust/*
   Settings:
   - Cache Level: Standard
   - Edge Cache TTL: 1 hour
   - Browser Cache TTL: 30 minutes
   \\\

2. **Cache PDFs**
   \\\
   URL: pryde.social/trust/assets/*.pdf
   Settings:
   - Cache Level: Standard
   - Edge Cache TTL: 1 day
   - Browser Cache TTL: 1 day
   \\\

3. **Bypass Security for Legal Pages**
   \\\
   URL: pryde.social/terms
   URL: pryde.social/privacy
   URL: pryde.social/cookies
   URL: pryde.social/community
   URL: pryde.social/safety
   URL: pryde.social/security
   URL: pryde.social/contact
   URL: pryde.social/faq
   Settings:
   - Security Level: Essentially Off
   - Browser Integrity Check: Off
   - Challenge Passage: 1 year
   \\\

---

## 📝 robots.txt Configuration

Ensure your obots.txt allows crawling of legal pages:

\\\	xt
User-agent: *
Allow: /
Allow: /trust/
Allow: /terms
Allow: /privacy
Allow: /cookies
Allow: /community
Allow: /safety
Allow: /security
Allow: /contact
Allow: /faq
Allow: /dmca
Allow: /acceptable-use
Allow: /guarantees
Allow: /trust-safety

# Allow PDF downloads
Allow: /trust/assets/*.pdf

# Disallow admin and private routes
Disallow: /admin
Disallow: /settings
Disallow: /messages
Disallow: /api/

Sitemap: https://pryde.social/sitemap.xml
\\\

---

## 🗺️ Sitemap Configuration

Add legal pages to your sitemap:

\\\xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pryde.social/trust</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pryde.social/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://pryde.social/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- Add all other legal pages -->
</urlset>
\\\

---

## ⚠️ Common Issues

### Issue 1: Legal Pages Return 404

**Cause:** Cloudflare WAF blocking requests or SPA routing issue

**Solution:**
1. Check Cloudflare WAF rules
2. Verify static files are deployed
3. Check _redirects file configuration

### Issue 2: PDFs Not Loading

**Cause:** MIME type not set correctly or CORS issue

**Solution:**
1. Verify PDF files are in /public/trust/assets/
2. Check Cloudflare cache settings
3. Verify MIME type is pplication/pdf

### Issue 3: Bots Being Blocked

**Cause:** Cloudflare security level too high

**Solution:**
1. Lower security level for legal pages
2. Whitelist verified bot IPs
3. Disable browser integrity check for legal pages

---

## 📞 Support

If you encounter issues with Trust Center accessibility:

1. Check Cloudflare Analytics for blocked requests
2. Review WAF logs for false positives
3. Test with different user agents and locations
4. Verify static files are deployed correctly

---

**Last Updated:** January 2026  
**Maintained by:** Pryde Social Team
