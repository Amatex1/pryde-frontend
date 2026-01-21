# 🔐 Continuous Backup Guide - All Services

## 📊 **Complete Backup Strategy**

This guide covers **continuous backups** for ALL your services:
- ✅ MongoDB Database (posts, comments, DMs, users)
- ✅ Code (GitHub)
- ✅ Environment Variables
- ✅ Media Files (future)

---

## 🎯 **Backup Options Comparison**

| Service | Free Tier | Paid Tier | Our Solution |
|---------|-----------|-----------|--------------|
| **MongoDB Atlas** | ❌ No backups | ✅ Continuous ($9/mo) | ✅ Hourly backups (free) |
| **Render** | ❌ No backups | ✅ Daily backups ($7/mo) | ✅ Included in our solution |
| **Cloudflare Pages** | ✅ Code only | ✅ Code only | ✅ GitHub handles this |
| **Media Files** | ❌ No backups | ❌ No backups | ⚠️ Needs setup |

---

## 💰 **Cost Comparison**

### **Option 1: Paid Services (Recommended for Production)**
- MongoDB Atlas M2: **$9/month**
- Render Starter: **$7/month**
- **Total: $16/month**

**Benefits**:
- ✅ Automatic continuous backups
- ✅ Point-in-time recovery
- ✅ One-click restore
- ✅ No manual work
- ✅ Professional support

---

### **Option 2: Free Tier + Our Backup System (Current)**
- MongoDB Atlas M0: **$0/month**
- Render Free: **$0/month**
- **Total: $0/month**

**Benefits**:
- ✅ Hourly backups (continuous)
- ✅ 90-day retention
- ✅ Multiple backup locations
- ✅ Webhook notifications
- ⚠️ Requires manual setup
- ⚠️ Limited by free tier disk space

---

## 🚀 **Setup: Continuous Backups (Free)**

### **Step 1: Install Continuous Backup Service**

Run in Render Shell:

```bash
# Go to server directory
cd /project/src/server

# Install PM2 if not already installed
npm install -g pm2

# Start continuous backup service (runs every hour)
pm2 start scripts/continuousBackup.js --name "continuous-backup"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on reboot
pm2 startup

# Verify it's running
pm2 list
pm2 logs continuous-backup
```

---

### **Step 2: Configure Webhook Notifications (Optional)**

Get notified when backups complete:

#### **Option A: Discord Webhook**
1. Go to Discord → Server Settings → Integrations → Webhooks
2. Create New Webhook
3. Copy Webhook URL
4. Add to Render environment variables:
   ```
   BACKUP_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
   ```

#### **Option B: Slack Webhook**
1. Go to Slack → Apps → Incoming Webhooks
2. Add to Workspace
3. Copy Webhook URL
4. Add to Render environment variables:
   ```
   BACKUP_WEBHOOK_URL=https://hooks.slack.com/services/YOUR_WEBHOOK_URL
   ```

---

### **Step 3: Verify Backups Are Running**

```bash
# Check PM2 status
pm2 list

# View backup logs
pm2 logs continuous-backup --lines 100

# Check backup files
ls -lh /project/src/server/backups/
```

---

## 📅 **Backup Schedule**

### **Continuous Backup Service**:
- ✅ **Every 30 minutes** (safety backup)
- ✅ **Every hour** (main backup)
- ✅ **Runs on startup** (initial backup)
- ✅ **Auto-cleanup** after 90 days

### **What Gets Backed Up**:
- 💬 Comments
- 💌 Messages (DMs)
- 🗨️ Conversations
- 📝 Posts
- 👤 Users (excluding passwords)
- 🔔 Notifications

---

## 📥 **Download Backups to Your Computer**

### **Method 1: Manual Download from Render Shell**

```bash
# View latest backup
cat /project/src/server/backups/full-backup-latest.json

# List all backups
ls -lh /project/src/server/backups/
```

Copy the JSON output and save to your computer.

---

### **Method 2: Automated Cloud Upload (Advanced)**

Set up automatic upload to cloud storage:

#### **Google Drive** (using rclone):
```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure Google Drive
rclone config

# Upload backups
rclone copy /project/src/server/backups/ gdrive:pryde-backups/
```

#### **AWS S3**:
```bash
# Install AWS CLI
npm install -g aws-cli

# Configure AWS
aws configure

# Upload backups
aws s3 sync /project/src/server/backups/ s3://your-bucket/pryde-backups/
```

---

## 🔄 **Restore from Backup**

### **Restore All Data**:
```bash
cd /project/src/server

# Restore from latest backup
node scripts/restoreComments.js
```

### **Restore from Specific Backup**:
```bash
# List available backups
ls backups/

# Restore from specific file
node scripts/restoreComments.js full-backup-2024-12-16T10-30-00.json
```

---

## 📊 **Monitor Backup Health**

### **Check Backup Status**:
```bash
# View PM2 process list
pm2 list

# View recent logs
pm2 logs continuous-backup --lines 50

# View backup file sizes
du -sh /project/src/server/backups/*
```

### **Backup Health Checklist**:
- ✅ PM2 service is "online"
- ✅ Logs show successful backups
- ✅ Backup files are being created
- ✅ File sizes are reasonable (not 0 bytes)
- ✅ Webhook notifications are received (if configured)

---

## 🛡️ **Best Practices**

1. ✅ **Download backups weekly** to your computer
2. ✅ **Store backups in multiple locations** (computer + cloud)
3. ✅ **Test restores monthly** to verify backups work
4. ✅ **Monitor backup logs** for failures
5. ✅ **Set up webhook notifications** to get alerts
6. ✅ **Consider upgrading to paid tier** for production

---

## ⚠️ **Limitations of Free Tier Backups**

- ⚠️ **Disk space limited** on Render free tier
- ⚠️ **No automatic cloud upload** (requires manual setup)
- ⚠️ **No point-in-time recovery** (only timestamped backups)
- ⚠️ **Backups stored on same server** (not ideal for disasters)

**For production, consider upgrading to paid tiers!**

---

## 💡 **Upgrade to Paid Tiers**

### **MongoDB Atlas M2** ($9/month):
- ✅ Continuous backups (every hour)
- ✅ Point-in-time recovery
- ✅ 2-day retention (configurable to 35 days)
- ✅ One-click restore
- ✅ Stored in separate cloud location

### **Render Starter** ($7/month):
- ✅ Persistent disk storage
- ✅ Better performance
- ✅ More resources
- ✅ Priority support

---

## 📞 **Support**

If backups fail or you need help:
1. Check PM2 logs: `pm2 logs continuous-backup`
2. Verify MongoDB connection
3. Check disk space: `df -h`
4. Run manual backup: `node scripts/backupToCloud.js`

