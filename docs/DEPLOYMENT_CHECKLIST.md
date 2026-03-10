# Deployment Checklist

Use this checklist to ensure a smooth deployment of Pryde Social.

## Pre-Deployment

### Backend Preparation
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password saved
- [ ] IP whitelist set to allow all (0.0.0.0/0)
- [ ] MongoDB connection string obtained
- [ ] JWT secret generated (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] JWT refresh secret generated
- [ ] CSRF secret generated
- [ ] Message encryption key generated
- [ ] VAPID keys generated (`npx web-push generate-vapid-keys`)
- [ ] Code pushed to GitHub repository

### Frontend Preparation
- [ ] Domain name configured and pointing to Vercel
- [ ] Vercel project connected to GitHub repository
- [ ] Backend URL known (from Render dashboard)

## Backend Deployment (Render)

### Setup
- [ ] Render account created
- [ ] New Web Service created (Standard plan — $7/mo)
- [ ] GitHub repository connected
- [ ] Service configured:
  - [ ] Name: pryde-backend
  - [ ] Build Command: `node scripts/update-version.js && cd server && npm install`
  - [ ] Start Command: `cd server && npm start`
  - [ ] Environment: Node
  - [ ] Region: Oregon

### Environment Variables (set in Render Dashboard → Environment tab)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `MONGO_URL` = MongoDB connection string
- [ ] `MONGODB_URI` = MongoDB connection string (same as above)
- [ ] `JWT_SECRET` = Generated JWT secret
- [ ] `JWT_REFRESH_SECRET` = Generated JWT refresh secret
- [ ] `CSRF_SECRET` = Generated CSRF secret
- [ ] `MESSAGE_ENCRYPTION_KEY` = Generated encryption key
- [ ] `BASE_URL` = Render service URL (e.g., https://pryde-backend.onrender.com)
- [ ] `FRONTEND_URL` = Your domain (e.g., https://prydeapp.com)
- [ ] `API_DOMAIN` = `https://api.prydeapp.com`
- [ ] `ROOT_DOMAIN` = `prydeapp.com`
- [ ] `VAPID_PUBLIC_KEY` = Generated VAPID public key
- [ ] `VAPID_PRIVATE_KEY` = Generated VAPID private key
- [ ] `RESEND_API_KEY` = Resend.com API key

### Verification
- [ ] Deployment completed successfully
- [ ] No errors in Render logs
- [ ] Health check endpoint works: `https://pryde-backend.onrender.com/api/health`
- [ ] Custom API domain works: `https://api.prydeapp.com/api/health`
- [ ] Backend URL saved for frontend configuration

## Frontend Deployment (Vercel)

### Setup
- [ ] Vercel account created (free tier)
- [ ] Project imported from GitHub
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Environment Variables (set in Vercel Dashboard → Settings → Environment Variables)
- [ ] `VITE_API_DOMAIN` = `https://api.prydeapp.com`
- [ ] `VITE_HCAPTCHA_SITE_KEY` = hCaptcha site key
- [ ] `VITE_VAPID_PUBLIC_KEY` = VAPID public key (same as backend)
- [ ] `VITE_API_URL` and `VITE_SOCKET_URL` left unset unless an intentional override is required

### Custom Domain
- [ ] Domain added in Vercel Dashboard → Domains
- [ ] DNS records updated (CNAME or A record pointing to Vercel)
- [ ] SSL certificate auto-provisioned by Vercel
- [ ] HTTPS redirect confirmed working

### Verification
- [ ] Deployment completed successfully (check Vercel dashboard)
- [ ] No build errors in Vercel logs
- [ ] Site loads at custom domain
- [ ] No console errors (F12 → Console)

## Post-Deployment Testing

### Backend Tests
- [ ] Health endpoint: `curl https://pryde-backend.onrender.com/api/health`
- [ ] Health endpoint: `curl https://api.prydeapp.com/api/health`
- [ ] No errors in Render logs
- [ ] Database connection successful (check logs)

### Frontend Tests
- [ ] Website loads: `https://prydeapp.com`
- [ ] `www` domain behavior verified if enabled
- [ ] Login page loads
- [ ] Register page loads
- [ ] Navigation works
- [ ] Page refresh works (no 404 errors)
- [ ] API calls successful (F12 → Network tab)
- [ ] Auth requests go to `https://api.prydeapp.com`

### Integration Tests
- [ ] User registration works
- [ ] User login works
- [ ] User can create posts
- [ ] Real-time features work (Socket.IO)
- [ ] Friend requests work
- [ ] Messages work
- [ ] Notifications work
- [ ] Image uploads work
- [ ] Profile updates work

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (iOS)
- [ ] Mobile browsers (Android Chrome)

### Performance
- [ ] Page load time acceptable (check Vercel Speed Insights)
- [ ] Images load properly
- [ ] No broken links
- [ ] Mobile responsive

## Security Checklist

### Backend
- [ ] All secrets set in Render environment variables (not in code)
- [ ] JWT_SECRET is strong and unique
- [ ] CORS configured for the real production frontend origins
- [ ] `API_DOMAIN` and `ROOT_DOMAIN` set for shared-domain cookies
- [ ] HTTPS enforced
- [ ] Database credentials secure
- [ ] No sensitive data in logs

### Frontend
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] No API keys in client-side code
- [ ] Security headers verified in vercel.json (HSTS, CSP, Referrer-Policy etc.)
- [ ] XSS protection enabled

## Monitoring Setup

### Backend (Render)
- [ ] Render dashboard bookmarked
- [ ] Email notifications enabled in Render account settings
- [ ] Health check path configured: `/api/health`
- [ ] Log monitoring set up

### Frontend (Vercel)
- [ ] Vercel Analytics enabled (Project Settings → Analytics)
- [ ] Vercel Speed Insights enabled (Project Settings → Speed Insights)
- [ ] Deployment notifications enabled

## Rollback Plan

- [ ] Previous working deployment identified in Vercel dashboard (instant rollback available)
- [ ] Previous Render deploy available for rollback
- [ ] Database backup created before major changes
- [ ] Emergency contacts listed

## Final Verification

- [ ] All features working as expected
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Security measures confirmed
- [ ] Documentation updated

---

## Notes

**Date Deployed**: _______________

**Backend URL**: _______________

**Frontend URL**: _______________

**Deployed By**: _______________

**Issues Encountered**:
_______________________________________________
_______________________________________________

**Resolution**:
_______________________________________________
_______________________________________________

---

✅ **Deployment Complete!**
