# Pryde Social - Complete Deployment Guide

This is a comprehensive guide to deploy the Pryde Social application with frontend on SiteGround and backend on Render.com.

## 📋 Overview

- **Frontend**: React + Vite → SiteGround (Apache hosting)
- **Backend**: Node.js + Express + Socket.IO → Render.com
- **Database**: MongoDB Atlas (cloud)

## 🚀 Quick Start Deployment

### Prerequisites Checklist

- [ ] SiteGround hosting account with cPanel
- [ ] Render.com account (free tier available)
- [ ] MongoDB Atlas account (free tier available)
- [ ] Domain name configured (e.g., prydeapp.com)
- [ ] Git repository (GitHub recommended)

### Deployment Order

**Important**: Deploy in this order to avoid configuration issues.

1. **Backend First** (Render.com)
2. **Frontend Second** (SiteGround)

## 📦 Step-by-Step Deployment

### Phase 1: Backend Deployment (30-45 minutes)

Follow the detailed guide: **[DEPLOYMENT_BACKEND.md](./DEPLOYMENT_BACKEND.md)**

**Quick Summary**:
1. Set up MongoDB Atlas database
2. Generate JWT secret and VAPID keys
3. Deploy to Render.com
4. Configure environment variables
5. Verify deployment

**Result**: You'll get a backend URL like `https://pryde-backend.onrender.com`

### Phase 2: Frontend Deployment (15-30 minutes)

Follow the detailed guide: **[DEPLOYMENT_FRONTEND.md](./DEPLOYMENT_FRONTEND.md)**

**Quick Summary**:
1. Update `.env.production` with backend URL
2. Build frontend (`npm run build`)
3. Upload `dist` folder to SiteGround
4. Verify deployment

**Result**: Your app will be live at `https://prydeapp.com`

## 🔧 Configuration Files

### Frontend Configuration

- `.env.production` - Production environment variables
- `.env.example` - Template for environment variables
- `dist/.htaccess` - Apache configuration for SPA routing
- `vite.config.js` - Vite build configuration

### Backend Configuration

- `server/.env.example` - Template for backend environment variables
- `render.yaml` - Render.com deployment configuration
- `server/config/config.js` - Server configuration
- `server/server.js` - Main server file

## 🌐 Environment Variables

### Frontend (.env.production)

```env
VITE_API_URL=https://your-backend-app.onrender.com/api
VITE_SOCKET_URL=https://your-backend-app.onrender.com
```

### Backend (Render.com Environment)

```env
NODE_ENV=production
PORT=10000
MONGO_URL=mongodb+srv://...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-generated-secret
BASE_URL=https://your-backend-app.onrender.com
FRONTEND_URL=https://prydeapp.com
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

## ✅ Post-Deployment Checklist

After deploying both frontend and backend:

- [ ] Frontend loads at your domain
- [ ] Login/Register pages work
- [ ] API calls connect to backend (check Network tab)
- [ ] Real-time features work (Socket.IO)
- [ ] SSL/HTTPS is enabled on both
- [ ] CORS is properly configured
- [ ] No console errors in browser
- [ ] Mobile responsive design works

## 🔍 Testing Your Deployment

### Test Backend

```bash
# Health check
curl https://your-backend-app.onrender.com/api/health

# Should return:
# {"status":"ok","message":"Pryde Social API is running"}
```

### Test Frontend

1. Visit your domain
2. Open browser DevTools (F12)
3. Check Console for errors
4. Check Network tab for API calls
5. Test user registration/login
6. Test real-time features

## 🐛 Common Issues & Solutions

### Frontend Issues

**Issue**: 404 on page refresh
- **Fix**: Ensure `.htaccess` is uploaded to SiteGround

**Issue**: API calls failing
- **Fix**: Check CORS settings and API URLs in `.env.production`

**Issue**: Blank page
- **Fix**: Check browser console, verify all files uploaded

### Backend Issues

**Issue**: Database connection fails
- **Fix**: Verify MongoDB connection string and IP whitelist

**Issue**: CORS errors
- **Fix**: Ensure frontend domain is in CORS whitelist

**Issue**: 502 Bad Gateway
- **Fix**: Wait 30-60 seconds (free tier spin-up time)

## 📊 Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ├─── HTTPS ───┐
         │             │
┌────────▼────────┐   │
│   SiteGround    │   │
│   (Frontend)    │   │
│  prydeapp.com   │   │
└────────┬────────┘   │
         │            │
         │ API Calls  │
         │ WebSocket  │
         │            │
┌────────▼────────────▼──┐
│     Render.com         │
│      (Backend)         │
│  pryde-backend.        │
│  onrender.com          │
└────────┬───────────────┘
         │
         │ MongoDB
         │ Connection
         │
┌────────▼────────┐
│  MongoDB Atlas  │
│   (Database)    │
└─────────────────┘
```

## 🔄 Updating Your Deployment

### Update Frontend

1. Make changes to code
2. Run `npm run build`
3. Upload new files from `dist` to SiteGround
4. Clear browser cache

### Update Backend

1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or manually trigger deploy in Render dashboard

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [SiteGround cPanel Guide](https://www.siteground.com/tutorials/cpanel/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## 🆘 Getting Help

If you encounter issues:

1. Check the detailed deployment guides
2. Review error logs (browser console, Render logs)
3. Verify all environment variables are set correctly
4. Check CORS configuration
5. Ensure database is accessible

## 📝 Notes

- **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity
- **SSL**: Both SiteGround and Render provide free SSL certificates
- **Backups**: Always keep backups before deploying updates
- **Testing**: Test locally before deploying to production

---

**Ready to deploy?** Start with [DEPLOYMENT_BACKEND.md](./DEPLOYMENT_BACKEND.md)!

