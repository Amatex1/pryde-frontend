# Deployment Checklist

Use this checklist to ensure a smooth deployment of Pryde Social.

## Pre-Deployment

### Backend Preparation
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password saved
- [ ] IP whitelist set to allow all (0.0.0.0/0)
- [ ] MongoDB connection string obtained
- [ ] JWT secret generated (`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] VAPID keys generated (`npx web-push generate-vapid-keys`)
- [ ] Code pushed to GitHub repository

### Frontend Preparation
- [ ] Domain name configured and pointing to SiteGround
- [ ] SiteGround cPanel access confirmed
- [ ] Backend URL known (will get from Render)

## Backend Deployment (Render.com)

### Setup
- [ ] Render.com account created
- [ ] New Web Service created
- [ ] GitHub repository connected
- [ ] Service configured:
  - [ ] Name: pryde-backend
  - [ ] Build Command: `cd server && npm install`
  - [ ] Start Command: `cd server && npm start`
  - [ ] Environment: Node

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `MONGO_URL` = MongoDB connection string
- [ ] `MONGODB_URI` = MongoDB connection string (same as above)
- [ ] `JWT_SECRET` = Generated JWT secret
- [ ] `BASE_URL` = Render service URL (e.g., https://pryde-backend.onrender.com)
- [ ] `FRONTEND_URL` = Your domain (e.g., https://prydeapp.com)
- [ ] `VAPID_PUBLIC_KEY` = Generated VAPID public key
- [ ] `VAPID_PRIVATE_KEY` = Generated VAPID private key

### Verification
- [ ] Deployment completed successfully
- [ ] No errors in Render logs
- [ ] Health check endpoint works: `https://your-app.onrender.com/api/health`
- [ ] Root endpoint works: `https://your-app.onrender.com/`
- [ ] Backend URL saved for frontend configuration

## Frontend Deployment (SiteGround)

### Build
- [ ] `.env.production` updated with backend URL:
  ```
  VITE_API_URL=https://your-backend.onrender.com/api
  VITE_SOCKET_URL=https://your-backend.onrender.com
  ```
- [ ] Build command run: `npm run build`
- [ ] Build completed successfully
- [ ] `dist` folder created with files

### Upload
- [ ] Logged into SiteGround cPanel
- [ ] Navigated to File Manager
- [ ] Opened `public_html` directory
- [ ] Backed up existing files (if any)
- [ ] Deleted old files from `public_html`
- [ ] Uploaded all files from `dist` folder:
  - [ ] `index.html`
  - [ ] `.htaccess`
  - [ ] `assets` folder (complete)
  - [ ] Any other files in `dist`
- [ ] File permissions verified (644 for files, 755 for folders)

### SSL Configuration
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Force HTTPS enabled
- [ ] HTTPS redirect working

## Post-Deployment Testing

### Backend Tests
- [ ] Health endpoint: `curl https://your-backend.onrender.com/api/health`
- [ ] Status endpoint: `curl https://your-backend.onrender.com/api/status`
- [ ] No errors in Render logs
- [ ] Database connection successful (check logs)

### Frontend Tests
- [ ] Website loads: `https://your-domain.com`
- [ ] No console errors (F12 → Console)
- [ ] Login page loads
- [ ] Register page loads
- [ ] Navigation works
- [ ] Page refresh works (no 404 errors)
- [ ] API calls successful (F12 → Network tab)

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
- [ ] Safari (if available)
- [ ] Mobile browsers

### Performance
- [ ] Page load time acceptable
- [ ] Images load properly
- [ ] No broken links
- [ ] Mobile responsive

## Security Checklist

### Backend
- [ ] JWT_SECRET is strong and unique
- [ ] Environment variables not exposed in code
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Database credentials secure
- [ ] No sensitive data in logs

### Frontend
- [ ] HTTPS enabled
- [ ] No API keys in client code
- [ ] Security headers configured (.htaccess)
- [ ] XSS protection enabled

## Monitoring Setup

### Backend
- [ ] Render dashboard bookmarked
- [ ] Email notifications enabled
- [ ] Health check configured
- [ ] Log monitoring set up

### Frontend
- [ ] Error tracking set up (optional)
- [ ] Analytics configured (optional)
- [ ] Uptime monitoring (optional)

## Documentation

- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Team members have access

## Rollback Plan

- [ ] Previous version backed up
- [ ] Rollback procedure documented
- [ ] Database backup created
- [ ] Emergency contacts listed

## Final Verification

- [ ] All features working as expected
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Team notified of deployment
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
_______________________________________________

**Resolution**: 
_______________________________________________
_______________________________________________
_______________________________________________

---

✅ **Deployment Complete!**

