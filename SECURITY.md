# 🔐 Security Guidelines for Pryde Social

## ⚠️ NEVER COMMIT SECRETS TO GIT

### **What NOT to Commit:**
- ❌ MongoDB connection strings
- ❌ API keys
- ❌ JWT secrets
- ❌ Passwords
- ❌ OAuth client secrets
- ❌ Any credentials or tokens

### **Where Secrets Should Be Stored:**

#### **Local Development:**
- Store in `server/.env` file (already in `.gitignore`)
- Never commit `.env` files

#### **Production (Render):**
- Add secrets as **Environment Variables** in Render Dashboard
- Go to: https://dashboard.render.com/web/srv-d4f8tp75r7bs73ci67o0
- Click **Environment** tab
- Add variables there

#### **Production (Cloudflare Pages):**
- Add secrets as **Environment Variables** in Cloudflare Dashboard
- Go to: https://dash.cloudflare.com
- Select your project → **Settings** → **Environment Variables**

---

## 🚨 If You Accidentally Commit Secrets:

### **Step 1: Rotate Credentials IMMEDIATELY**
1. **MongoDB:** Delete the exposed user, create a new one with a new password
2. **JWT Secret:** Generate a new secret and update in Render environment variables
3. **API Keys:** Revoke and regenerate

### **Step 2: Remove from Git History**
```bash
# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

### **Step 3: Notify Team**
- Inform all team members that credentials were rotated
- Update environment variables in all environments

---

## ✅ Best Practices:

1. **Use Environment Variables**
   - Never hardcode secrets in code
   - Use `process.env.VARIABLE_NAME`

2. **Check Before Committing**
   - Run `git diff` before `git add`
   - Review what you're committing

3. **Use `.gitignore`**
   - Ensure `.env` files are in `.gitignore`
   - Never remove `.env` from `.gitignore`

4. **Documentation**
   - Use placeholders like `<YOUR_SECRET_HERE>` in documentation
   - Never include actual credentials in README or docs

5. **Code Reviews**
   - Review PRs for accidentally committed secrets
   - Use automated tools to scan for secrets

---

## 🛡️ MongoDB Atlas Security:

1. **Network Access**
   - Whitelist only necessary IP addresses
   - Use Render's IP addresses for production

2. **Database Access**
   - Use strong, unique passwords
   - Rotate credentials regularly
   - Use least-privilege principle

3. **Connection Strings**
   - Never commit connection strings
   - Store in environment variables only

---

## 📞 Security Incident Response:

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Contact the repository owner directly
3. Rotate any compromised credentials immediately
4. Document the incident and remediation steps

---

**Remember: Security is everyone's responsibility!** 🔒

