# 🔧 FIX: Render Deployment Failed

## 🚨 The Problem

Your Render deployment failed with this error:
```
Service Root Directory "/opt/render/project/src/server" is missing.
```

**Why?** Your GitHub repository only has the **frontend** code, but Render needs the **backend** code (the `server/` folder).

## ✅ The Solution

Add the `server/` folder from `pryde-backend` to your GitHub repository.

---

## 🚀 Quick Fix (Automated)

### Option 1: Use the PowerShell Script (EASIEST)

```powershell
# Navigate to your git repository
cd F:\Desktop\pryde-backend

# Run the automated script
.\combine-and-push.ps1
```

This script will:
1. ✅ Copy the `server/` folder from `pryde-backend`
2. ✅ Create `.gitignore`
3. ✅ Add files to git
4. ✅ Commit changes
5. ✅ Push to GitHub

Then skip to **Step 3: Deploy on Render** below.

---

## 📋 Manual Fix (If Script Doesn't Work)

### Step 1: Copy Server Folder

```powershell
# Navigate to your git repository
cd F:\Desktop\pryde-backend

# Copy server folder from pryde-backend
Copy-Item -Path "F:\Desktop\pryde-backend\server" -Destination ".\server" -Recurse -Force

# Verify it was copied
Test-Path server
# Should return: True
```

### Step 2: Add to Git and Push

```powershell
# Add server folder
git add server/

# Commit
git commit -m "Add backend server folder for Render deployment"

# Push to GitHub
git push origin main
```

### Step 3: Verify on GitHub

1. Go to: https://github.com/Amatex1/pryde-frontend---backend
2. You should now see a `server/` folder
3. Click into it and verify these files exist:
   - `package.json`
   - `server.js`
   - `dbConn.js`
   - `config/`
   - `models/`
   - `routes/`

---

## 🚀 Step 3: Deploy on Render

### Delete the Failed Service (if exists)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Find your failed service
3. Settings → Delete Web Service

### Create New Web Service

1. Click **New +** → **Web Service**
2. Connect repository: `pryde-frontend---backend`
3. Click **Connect**

### Configure Service

**IMPORTANT**: Fill in these settings EXACTLY:

| Setting | Value |
|---------|-------|
| **Name** | `pryde-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `server` ← **CRITICAL!** |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### Add Environment Variables

Click **Advanced** → Add these variables:

```
NODE_ENV=production
PORT=10000
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/pryde-social
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pryde-social
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
BASE_URL=https://pryde-backend.onrender.com
FRONTEND_URL=https://prydeapp.com
```

**Generate JWT Secret:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Deploy

1. Click **Create Web Service**
2. Wait 5-10 minutes
3. Watch the logs

### Verify Deployment

Visit: `https://your-service-name.onrender.com/api/health`

Should return:
```json
{"status":"ok","message":"Pryde Social API is running"}
```

---

## ✅ Success Checklist

- [ ] `server/` folder visible on GitHub
- [ ] Render service shows "Live" status
- [ ] Health endpoint returns 200 OK
- [ ] No errors in Render logs
- [ ] MongoDB connected (check logs)

---

## 🐛 Troubleshooting

### "pathspec 'server/' did not match any files"

**Cause**: Server folder doesn't exist in current directory

**Fix**:
```powershell
# Check current location
Get-Location

# Should be: F:\Desktop\pryde-backend

# Check if server exists in pryde-backend
Test-Path F:\Desktop\pryde-backend\server
```

### "Nothing to commit"

**Cause**: Server folder already in git

**Fix**:
```powershell
# Check if server is already in git
git ls-files | Select-String "server/"

# If you see files, it's already there!
# Just push: git push origin main
```

### Render Still Can't Find Server

**Cause**: Root Directory not set correctly

**Fix**:
1. In Render dashboard → Settings
2. Find **Root Directory**
3. Set to: `server`
4. Save changes
5. Manual Deploy → Deploy latest commit

---

## 📊 Expected Repository Structure

After the fix, your GitHub repo should have:

```
pryde-frontend---backend/
├── server/              ← Backend (NEW!)
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
├── src/                 ← Frontend
│   ├── components/
│   └── pages/
├── package.json         ← Frontend deps
└── vite.config.js
```

---

## 🎯 Quick Command Reference

```powershell
# Navigate to repo
cd F:\Desktop\pryde-backend

# Copy server folder
Copy-Item -Path "F:\Desktop\pryde-backend\server" -Destination ".\server" -Recurse -Force

# Add to git
git add server/

# Commit
git commit -m "Add backend server folder"

# Push
git push origin main

# Verify
git ls-files | Select-String "server/"
```

---

## 📞 After Successful Deployment

1. ✅ Copy your Render URL (e.g., `https://pryde-backend.onrender.com`)
2. ✅ Update `.env.production` with this URL
3. ✅ Rebuild frontend: `npm run build`
4. ✅ Deploy frontend to SiteGround
5. ✅ Test the full app!

---

## 🆘 Still Having Issues?

Run the diagnostic:

```powershell
# Check current directory
Get-Location

# Check if server exists locally
Test-Path server

# Check if server is in git
git ls-files | Select-String "server/"

# Check git remote
git remote -v
```

Share the output and I'll help you fix it!

---

**Ready to fix?** Run `.\combine-and-push.ps1` or follow the manual steps above!

