# Coolify Disk Cleanup Guide

## 🚨 Immediate Cleanup (Run on your Coolify server)

### Option 1: Manual cleanup (fastest)

```bash
# SSH into your Coolify server
ssh root@your-server-ip

# Run the cleanup script
bash /path/to/cleanup-coolify.sh
```

### Option 2: Copy script to server

```bash
# From your local machine
scp scripts/cleanup-coolify.sh root@your-server-ip:/root/
ssh root@your-server-ip "chmod +x /root/cleanup-coolify.sh && /root/cleanup-coolify.sh"
```

### Option 3: One-liner (quick fix)

```bash
ssh root@your-server-ip "docker system prune -a -f --volumes && docker builder prune -a -f"
```

---

## 🤖 Setup Automatic Cleanup

Run this once to set up daily automatic cleanup:

```bash
# Copy both scripts to server
scp scripts/cleanup-coolify.sh root@your-server-ip:/root/
scp scripts/setup-auto-cleanup.sh root@your-server-ip:/root/

# Setup auto-cleanup (runs daily at 3 AM)
ssh root@your-server-ip "bash /root/setup-auto-cleanup.sh"
```

---

## 📊 What Gets Cleaned

The cleanup script removes:

1. **Stopped containers** - Old containers no longer running
2. **Unused images** - Docker images not used by any container
3. **Unused volumes** - Data volumes not attached to containers
4. **Unused networks** - Docker networks with no containers
5. **Build cache** - Cached layers from Docker builds
6. **Old logs** - Logs older than 7 days
7. **Dangling images** - Untagged images
8. **Old deployments** - Keeps only 3 most recent deployment images

---

## 🎯 Expected Results

- **Before**: 81% disk usage
- **After**: ~40-50% disk usage (frees ~30-40GB typically)

---

## ⚠️ Coolify Settings

To prevent future issues, update Coolify settings:

1. Go to Coolify Dashboard → Settings → Server
2. Set **Disk Usage Threshold** to `85%` (from 80%)
3. Enable **Auto-cleanup** if available
4. Set **Image Retention** to keep only last 3 deployments

---

## 🔍 Monitor Disk Usage

```bash
# Check current disk usage
df -h /

# Check Docker disk usage
docker system df

# See what's taking up space
docker system df -v
```

---

## 🚀 NPM Publishing Fix

Your npm token expired. To fix:

```bash
# Re-authenticate with npm
npm login

# Then retry publishing
pnpm run publish
```

Or use granular token (recommended):

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Generate new **Granular Access Token**
3. Set in CI/CD: `NPM_TOKEN=your_token_here`

---

## 📝 Files Created

- `scripts/cleanup-coolify.sh` - Main cleanup script
- `scripts/setup-auto-cleanup.sh` - Auto-cleanup setup
- `scripts/COOLIFY_CLEANUP.md` - This guide
