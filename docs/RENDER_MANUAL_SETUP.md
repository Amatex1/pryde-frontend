# 🔧 Render.com Manual Setup (FIXED)

Your deployment failed because Render couldn't find the `server` folder. Let's fix this by deploying manually.

## 🚨 The Problem

The error shows:
```
Service Root Directory "/opt/render/project/src/server" is missing.
```

This means the `server` folder isn't in your GitHub repository, OR it's in a different location.

## ✅ Solution: Manual Deployment

Instead of using `render.yaml`, we'll configure Render manually through the dashboard.

---

## 📋 Step-by-Step Fix

### Step 1: Check Your GitHub Repository

First, let's verify what's actually in your GitHub repo:

1. Go to: https://github.com/Amatex1/pryde-frontend---backend
2. Check if you see a `server` folder
3. If you see it → Great! Continue to Step 2
4. If you DON'T see it → Go to Step 1B

#### Step 1B: Push the Server Folder (If Missing)

```powershell
# Make sure you're in the pryde-frontend directory
cd F:\Desktop\pryde-frontend

# Check if server folder exists
Test-Path server
# Should return: True

# Add and commit the server folder
git add server
git commit -m "Add server folder for backend"
git push origin main
```

### Step 2: Delete the Failed Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your failed service
3. Click on it
4. Go to **Settings** (bottom of left sidebar)
5. Scroll down and click **Delete Web Service**
6. Confirm deletion

### Step 3: Create New Web Service (Manual Configuration)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `pryde-frontend---backend`
4. Click **Connect**

### Step 4: Configure the Service

Fill in these settings **EXACTLY**:

| Setting | Value |
|---------|-------|
| **Name** | `pryde-backend` (or your choice) |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `server` ← **IMPORTANT!** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

**⚠️ CRITICAL**: Set **Root Directory** to `server` - this tells Render where to find your backend code!

### Step 5: Add Environment Variables

Click **Advanced** → **Add Environment Variable**

Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGO_URL` | Your MongoDB connection string |
| `MONGODB_URI` | Same as MONGO_URL |
| `JWT_SECRET` | Your generated secret |
| `BASE_URL` | `https://pryde-backend.onrender.com` |
| `FRONTEND_URL` | `https://prydeapp.com` |

**MongoDB Connection String Example:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pryde-social?retryWrites=true&w=majority
```

**Generate JWT Secret:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 6: Create Web Service

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Watch the logs for any errors

### Step 7: Verify Deployment

Once deployed, test these URLs:

1. **Health Check**: `https://your-service-name.onrender.com/api/health`
   - Should return: `{"status":"ok","message":"Pryde Social API is running"}`

2. **Root**: `https://your-service-name.onrender.com/`
   - Should return: `{"message":"Pryde Social API","version":"1.0.0"}`

---

## 🔍 Alternative: Check Repository Structure

If the above doesn't work, your repository might have a different structure. Let's check:

### Option A: Repository has `server` folder at root

```
pryde-frontend---backend/
├── server/
│   ├── package.json
│   ├── server.js
│   └── ...
├── src/
├── package.json
└── ...
```

**Render Settings:**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

### Option B: Repository has backend at root (no server folder)

```
pryde-frontend---backend/
├── package.json
├── server.js
├── config/
├── models/
└── ...
```

**Render Settings:**
- Root Directory: (leave empty)
- Build Command: `npm install`
- Start Command: `node server.js`

### Option C: Repository has both frontend and backend mixed

This is more complex. You might need to:
1. Create a separate repository for backend only
2. Or restructure your repository

---

## 🐛 Troubleshooting

### Error: "Cannot find package.json"

**Cause**: Root Directory is wrong

**Fix**: 
1. Check your GitHub repository structure
2. Update Root Directory in Render settings to match

### Error: "Cannot find module 'express'"

**Cause**: Dependencies not installed

**Fix**:
1. Verify Build Command is `npm install`
2. Check that `package.json` exists in the Root Directory

### Error: "Port already in use"

**Cause**: Start command is wrong

**Fix**:
1. Ensure Start Command is `npm start`
2. Check `package.json` has correct start script

---

## 📝 Quick Reference

### Correct Render Configuration

```yaml
Name: pryde-backend
Region: Oregon
Branch: main
Root Directory: server          ← Key setting!
Runtime: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

### Environment Variables Needed

```
NODE_ENV=production
PORT=10000
MONGO_URL=mongodb+srv://...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-here
BASE_URL=https://your-app.onrender.com
FRONTEND_URL=https://prydeapp.com
```

---

## ✅ Success Checklist

After deployment:

- [ ] Service shows "Live" status in Render dashboard
- [ ] No errors in logs
- [ ] Health endpoint returns 200 OK
- [ ] MongoDB connection successful (check logs)
- [ ] Can access API endpoints

---

## 🆘 Still Having Issues?

If it still fails:

1. **Check the logs** in Render dashboard
2. **Verify GitHub repository** has the `server` folder
3. **Double-check Root Directory** setting matches your repo structure
4. **Share the error message** - I can help debug further

---

## 🎯 Next Steps After Successful Deployment

1. Copy your Render URL (e.g., `https://pryde-backend.onrender.com`)
2. Update `.env.production` in your frontend
3. Rebuild frontend: `npm run build`
4. Deploy frontend to SiteGround
5. Test the full application

---

**Need more help?** Share the error logs from Render and I'll help you fix it!

