# 🌐 Domain Migration Guide: SiteGround → Cloudflare

## 📋 Overview

This guide will help you transfer your domain `prydeapp.com` from SiteGround to Cloudflare Registrar and completely migrate off SiteGround hosting.

---

## 💰 Cost Comparison

### Before (SiteGround):
- **Domain + Hosting:** $100-200/year

### After (Cloudflare + Render):
- **Domain (Cloudflare Registrar):** ~$10/year
- **Frontend (Cloudflare Pages):** FREE
- **Backend (Render Free Tier):** FREE (or $7/month for more resources)

**Total Savings: $90-190/year!** 🎉

---

## ✅ Current Status

- ✅ Frontend deployed to Cloudflare Pages: `prydeapp.com`
- ✅ Backend deployed to Render: `https://pryde-social.onrender.com`
- ✅ DNS already pointing to Cloudflare nameservers
- ✅ MongoDB Atlas database (cloud-hosted)
- ⏳ Domain still registered with SiteGround

---

## 🚀 Migration Steps

### **Phase 1: Prepare Domain Transfer (Do This First)**

#### Step 1: Login to SiteGround
1. Go to: https://my.siteground.com
2. Login with your credentials

#### Step 2: Unlock Domain
1. Navigate to **Domains** → **My Domains**
2. Find `prydeapp.com`
3. Click **Manage**
4. Look for **Domain Lock** or **Transfer Lock**
5. **Disable the lock** (set to "Unlocked")

#### Step 3: Get EPP/Authorization Code
1. Still in the domain management page
2. Look for **EPP Code**, **Auth Code**, or **Transfer Code**
3. Click **Get EPP Code** or **Request Transfer Code**
4. **Copy and save this code** - you'll need it for Cloudflare!

#### Step 4: Disable WHOIS Privacy (Temporary)
1. In domain settings, find **WHOIS Privacy** or **Privacy Protection**
2. **Disable it temporarily** (required for transfer)
3. Don't worry - you can re-enable it for FREE on Cloudflare after transfer

#### Step 5: Verify Email Access
1. Make sure you have access to the email address registered for the domain
2. You'll receive a transfer confirmation email here

---

### **Phase 2: Initiate Transfer to Cloudflare**

#### Step 1: Go to Cloudflare Dashboard
1. Visit: https://dash.cloudflare.com
2. Login to your account

#### Step 2: Start Domain Transfer
1. Click **Domain Registration** in the left sidebar
2. Click **Transfer Domains**
3. Enter: `prydeapp.com`
4. Click **Continue**

#### Step 3: Enter EPP Code
1. Paste the **EPP/Authorization Code** from SiteGround
2. Click **Continue**

#### Step 4: Review and Pay
1. Review the transfer details
2. Cost: ~$10 (includes 1 year renewal)
3. Enter payment information
4. Click **Confirm Transfer**

#### Step 5: Confirm Transfer Email
1. Check your email (the one registered for the domain)
2. You'll receive a transfer confirmation email from SiteGround
3. **Click the confirmation link** in the email
4. This authorizes the transfer

---

### **Phase 3: Wait for Transfer (5-7 Days)**

#### What Happens During Transfer:
- ✅ Your website continues to work (no downtime!)
- ✅ DNS settings remain unchanged
- ✅ Email (if any) continues working
- ⏳ Transfer status shows "Pending" on Cloudflare
- ⏳ SiteGround may send additional confirmation emails

#### Monitor Transfer Status:
1. Go to Cloudflare Dashboard
2. Click **Domain Registration**
3. Check transfer status

---

### **Phase 4: After Transfer Completes**

#### Step 1: Verify Domain in Cloudflare
1. Go to Cloudflare Dashboard → **Domain Registration**
2. Confirm `prydeapp.com` shows as **Active**

#### Step 2: Re-enable WHOIS Privacy
1. Click on `prydeapp.com` in Domain Registration
2. Find **WHOIS Privacy** or **Redaction**
3. **Enable it** (FREE with Cloudflare!)

#### Step 3: Verify DNS Settings
1. Go to **DNS** tab for `prydeapp.com`
2. Confirm these records exist:
   - **A record:** `@` → Cloudflare Pages IP
   - **CNAME record:** `www` → `prydeapp.com`
   - Any other custom records you need

#### Step 4: Test Everything
1. Visit: https://prydeapp.com
2. Test login, messaging, posts, etc.
3. Verify backend API calls work

---

### **Phase 5: Cancel SiteGround**

#### Step 1: Backup Everything (Just in Case)
1. Download any files from SiteGround hosting
2. Export any databases (if not already on MongoDB Atlas)
3. Save any email data (if using SiteGround email)

#### Step 2: Cancel SiteGround Hosting
1. Login to SiteGround
2. Go to **Services** → **My Accounts**
3. Find your hosting plan
4. Click **Cancel Service**
5. Follow cancellation process

#### Step 3: Request Refund (If Applicable)
1. If you paid for hosting in advance, request a prorated refund
2. Contact SiteGround support if needed

---

## 🎯 Final Checklist

- [ ] Domain unlocked on SiteGround
- [ ] EPP code obtained and saved
- [ ] WHOIS privacy disabled temporarily
- [ ] Transfer initiated on Cloudflare
- [ ] Payment completed (~$10)
- [ ] Transfer confirmation email received and clicked
- [ ] Transfer completed (5-7 days)
- [ ] Domain shows as Active in Cloudflare
- [ ] WHOIS privacy re-enabled on Cloudflare
- [ ] DNS settings verified
- [ ] Website tested and working
- [ ] SiteGround hosting cancelled
- [ ] Refund requested (if applicable)

---

## 🆘 Troubleshooting

### Transfer Rejected or Failed
- **Check:** Domain lock is disabled
- **Check:** EPP code is correct
- **Check:** Email confirmation was clicked
- **Wait:** 60 days since last transfer (ICANN rule)

### Website Down During Transfer
- **Don't panic!** DNS propagation can take up to 48 hours
- **Check:** Cloudflare DNS settings match old settings
- **Clear:** Browser cache and try again

### Email Stops Working
- **If using SiteGround email:** Set up email forwarding BEFORE transfer
- **Alternative:** Use Gmail, Outlook, or other email provider
- **Cloudflare:** Offers email routing (free)

---

## 📞 Support Contacts

### Cloudflare Support
- **Dashboard:** https://dash.cloudflare.com
- **Community:** https://community.cloudflare.com
- **Docs:** https://developers.cloudflare.com

### SiteGround Support
- **Support:** https://my.siteground.com/support
- **Phone:** Check your account for phone number
- **Chat:** Available in dashboard

---

## 🎉 Success!

Once complete, you'll have:
- ✅ Domain registered with Cloudflare (~$10/year)
- ✅ Frontend on Cloudflare Pages (FREE)
- ✅ Backend on Render (FREE or $7/month)
- ✅ Database on MongoDB Atlas (FREE tier)
- ✅ Saving $90-190/year!
- ✅ Better performance and reliability!

---

**Questions?** Feel free to ask for help at any step!

