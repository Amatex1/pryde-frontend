# Backend Deployment Guide - Render.com

This guide will help you deploy the Pryde Social backend to Render.com.

## Prerequisites

- Render.com account (free tier available)
- MongoDB Atlas account (or other MongoDB hosting)
- GitHub repository with your code
- Domain name for frontend (e.g., prydeapp.com)

## Step 1: Prepare MongoDB Database

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user:
   - Go to **Database Access**
   - Click **Add New Database User**
   - Set username and password (save these!)
4. Whitelist all IPs:
   - Go to **Network Access**
   - Click **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0)
5. Get connection string:
   - Go to **Database** → **Connect**
   - Choose **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `pryde-social`

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pryde-social?retryWrites=true&w=majority`

## Step 2: Generate Required Keys

### JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### VAPID Keys (for Push Notifications)

Run this command:
```bash
npx web-push generate-vapid-keys
```

Save both the public and private keys.

## Step 3: Deploy to Render.com

### Option A: Using render.yaml (Recommended)

1. Push your code to GitHub (including the `render.yaml` file)
2. Log in to [Render.com](https://render.com)
3. Click **New** → **Blueprint**
4. Connect your GitHub repository
5. Render will detect `render.yaml` automatically
6. Click **Apply**

### Option B: Manual Setup

1. Log in to [Render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: pryde-backend
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Root Directory**: Leave empty
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free

## Step 4: Configure Environment Variables

In Render dashboard, go to **Environment** and add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `10000` | Render default |
| `MONGO_URL` | Your MongoDB connection string | Required |
| `MONGODB_URI` | Same as MONGO_URL | Required |
| `JWT_SECRET` | Generated secret from Step 2 | Required |
| `BASE_URL` | `https://your-app-name.onrender.com` | Your Render URL |
| `FRONTEND_URL` | `https://prydeapp.com` | Your frontend domain |
| `VAPID_PUBLIC_KEY` | Generated public key | Optional |
| `VAPID_PRIVATE_KEY` | Generated private key | Optional |

**Important**: Replace `your-app-name` with your actual Render service name.

## Step 5: Deploy

1. Click **Create Web Service** (or **Apply** if using Blueprint)
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start the server
3. Wait for deployment to complete (5-10 minutes)
4. Check the logs for any errors

## Step 6: Verify Deployment

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. You should see: `{"status":"Pryde API running","timestamp":"..."}`
3. Test health endpoint: `https://your-app-name.onrender.com/api/health`
4. Should return: `{"status":"ok","message":"Pryde Social API is running"}`

## Step 7: Update Frontend

1. Update your frontend `.env.production`:
   ```
   VITE_API_URL=https://your-app-name.onrender.com/api
   VITE_SOCKET_URL=https://your-app-name.onrender.com
   ```
2. Rebuild frontend: `npm run build`
3. Redeploy frontend to SiteGround

## Important Notes

### Free Tier Limitations

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid tier for production use

### Auto-Deploy

- Render automatically redeploys when you push to GitHub
- You can disable this in Settings → Build & Deploy

### Custom Domain

1. Go to Settings → Custom Domain
2. Add your domain (e.g., api.prydeapp.com)
3. Update DNS records as instructed
4. Update `BASE_URL` environment variable

## Troubleshooting

### Issue: Build fails
- **Solution**: Check build logs, ensure `server/package.json` exists

### Issue: Database connection fails
- **Solution**: Verify MongoDB connection string and IP whitelist

### Issue: CORS errors
- **Solution**: Ensure `FRONTEND_URL` is set correctly and matches your domain

### Issue: Service won't start
- **Solution**: Check logs for errors, verify all required env variables are set

### Issue: 502 Bad Gateway
- **Solution**: Service is starting up (wait 30-60 seconds on free tier)

## Monitoring

1. **Logs**: View real-time logs in Render dashboard
2. **Metrics**: Check CPU and memory usage
3. **Health Checks**: Render pings `/api/health` automatically

## Updating the Backend

To deploy updates:
1. Push changes to GitHub
2. Render auto-deploys (if enabled)
3. Or manually deploy from Render dashboard

## Security Checklist

- ✅ Strong JWT_SECRET generated
- ✅ MongoDB IP whitelist configured
- ✅ Environment variables set (not hardcoded)
- ✅ HTTPS enabled (automatic on Render)
- ✅ CORS properly configured
- ✅ Database user has minimal permissions

## Support

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- Check Render community forum for common issues

