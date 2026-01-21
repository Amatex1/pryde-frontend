# 🔧 Setup Combined Repository for Deployment

## 🎯 Goal

Combine your frontend and backend into ONE GitHub repository so Render can deploy the backend.

## 📁 Current Situation

You have:
- `pryde-frontend.zip` - React frontend
- `pryde-backend.zip` - Node.js backend
- GitHub repo: `pryde-frontend---backend` (only has frontend)

## ✅ Solution: Combine Both into One Repo

---

## 📋 Step-by-Step Instructions

### Step 1: Extract Both Zip Files (if not already done)

```powershell
# Navigate to Desktop
cd F:\Desktop

# Check if folders exist
Test-Path pryde-frontend
Test-Path pryde-backend
```

If they don't exist, extract the zip files.

### Step 2: Create a New Combined Folder

```powershell
# Create a new folder for the combined project
New-Item -ItemType Directory -Path "F:\Desktop\pryde-social-combined"

cd F:\Desktop\pryde-social-combined
```

### Step 3: Copy Backend Files

```powershell
# Copy the entire backend folder as 'server'
Copy-Item -Path "F:\Desktop\pryde-backend\*" -Destination "F:\Desktop\pryde-social-combined\" -Recurse -Force

# This copies everything from pryde-backend to the root
```

### Step 4: Verify Backend Files

```powershell
cd F:\Desktop\pryde-social-combined

# Check if server folder exists
Test-Path server

# List server contents
Get-ChildItem server
```

You should see:
- `server/package.json`
- `server/server.js`
- `server/dbConn.js`
- `server/config/`
- `server/models/`
- `server/routes/`

### Step 5: Initialize Git Repository

```powershell
cd F:\Desktop\pryde-social-combined

# Initialize git
git init

# Add your GitHub remote
git remote add origin https://github.com/Amatex1/pryde-frontend---backend.git
```

### Step 6: Create .gitignore

Create a `.gitignore` file to exclude unnecessary files:

```powershell
# Create .gitignore
@"
# Dependencies
node_modules/
server/node_modules/

# Environment variables
.env
.env.local
server/.env

# Build output
dist/
build/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

### Step 7: Add All Files to Git

```powershell
# Add all files
git add .

# Check what will be committed
git status

# You should see:
# - src/ (frontend)
# - server/ (backend)
# - package.json (frontend)
# - vite.config.js
# - etc.
```

### Step 8: Commit and Force Push

```powershell
# Commit
git commit -m "Combine frontend and backend for deployment"

# Force push to replace the old repository
git push -f origin main
```

**Note**: The `-f` (force) flag will replace your existing GitHub repository with this new combined version.

### Step 9: Verify on GitHub

1. Go to: https://github.com/Amatex1/pryde-frontend---backend
2. You should now see BOTH:
   - `src/` folder (frontend)
   - `server/` folder (backend)
   - Two `package.json` files (one at root for frontend, one in server/ for backend)

---

## 🚀 After Combining: Deploy to Render

Now follow **[RENDER_MANUAL_SETUP.md](./RENDER_MANUAL_SETUP.md)** with these settings:

### Render Configuration

| Setting | Value |
|---------|-------|
| **Repository** | `pryde-frontend---backend` |
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

---

## 📊 Final Repository Structure

Your GitHub repo should look like this:

```
pryde-frontend---backend/
├── server/                    ← Backend (for Render)
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   ├── server.js
│   └── dbConn.js
├── src/                       ← Frontend source
│   ├── components/
│   ├── pages/
│   └── main.jsx
├── public/
│   └── .htaccess
├── dist/                      ← Frontend build (for SiteGround)
├── package.json               ← Frontend dependencies
├── vite.config.js
├── .env.production
└── .gitignore
```

---

## ✅ Verification Checklist

Before deploying:

- [ ] `server/` folder exists in GitHub
- [ ] `server/package.json` exists
- [ ] `server/server.js` exists
- [ ] `src/` folder exists (frontend)
- [ ] Root `package.json` exists (frontend)
- [ ] `.gitignore` excludes `node_modules/`

---

## 🎯 Quick Command Summary

```powershell
# 1. Create combined folder
New-Item -ItemType Directory -Path "F:\Desktop\pryde-social-combined"

# 2. Copy backend files
Copy-Item -Path "F:\Desktop\pryde-backend\*" -Destination "F:\Desktop\pryde-social-combined\" -Recurse -Force

# 3. Navigate to combined folder
cd F:\Desktop\pryde-social-combined

# 4. Initialize git
git init
git remote add origin https://github.com/Amatex1/pryde-frontend---backend.git

# 5. Create .gitignore (see Step 6 above)

# 6. Add and commit
git add .
git commit -m "Combine frontend and backend"

# 7. Force push
git push -f origin main
```

---

## 🆘 Alternative: Separate Repositories (Recommended for Production)

If you prefer to keep them separate:

### Option A: Create New Backend-Only Repo

1. Create new GitHub repo: `pryde-backend`
2. Push only backend code to it
3. Deploy that repo to Render

### Option B: Use Monorepo (Current Approach)

Keep both in one repo (what we're doing above) - easier for small projects.

---

## 📞 Next Steps

After pushing the combined repository:

1. ✅ Verify on GitHub that `server/` folder exists
2. ✅ Follow **[RENDER_MANUAL_SETUP.md](./RENDER_MANUAL_SETUP.md)** to deploy backend
3. ✅ Deploy frontend to SiteGround using the `dist/` folder

---

**Ready to combine?** Run the commands in Step-by-Step Instructions above!

