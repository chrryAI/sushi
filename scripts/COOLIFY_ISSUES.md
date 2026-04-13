# Coolify Deployment Issues - Quick Reference

## Issue 1: Port Already Allocated ✅ FIXED

**Error:**

```
Bind for 0.0.0.0:3010 failed: port is already allocated
```

**Fix:**

```bash
ssh root@YOUR_SERVER_IP "docker ps -q --filter 'publish=3010' | xargs -r docker stop && docker ps -aq --filter 'publish=3010' | xargs -r docker rm -f"
```

Or use the script:

```bash
bash scripts/fix-coolify-port.sh
```

---

## Issue 2: New Relic Python Dependencies ✅ FIXED

**Error:**

```
gyp ERR! find Python
You need to install the latest version of Python.
```

**Root Cause:**

- `@newrelic/fn-inspect` and `@newrelic/native-metrics` are native Node modules
- They require Python + build tools to compile during `pnpm install`
- Alpine Linux doesn't include these by default

**Fix Applied:**
Updated `apps/api/Dockerfile` line 5:

```dockerfile
# Before
RUN apk add --no-cache libc6-compat

# After
RUN apk add --no-cache libc6-compat python3 make g++
```

**Committed:** `261724a1` - "fix: add Python build deps for New Relic"

---

## Alternative: Remove New Relic (if not using it)

If you're not actively using New Relic APM, you can remove it:

```bash
# Remove from package.json
pnpm remove newrelic @newrelic/native-metrics @newrelic/fn-inspect

# Remove initialization code from apps/api/server.ts
# (Look for require('newrelic') or similar)

# Commit and redeploy
git add . && git commit -m "remove: New Relic APM" && git push
```

---

## Next Deployment

Coolify will automatically:

1. Pull latest code from `chrry` branch
2. Build with Python dependencies
3. Deploy successfully

**Expected build time:** ~2-3 minutes

---

## Common Coolify Issues

### 1. **Orphaned Containers**

```bash
docker compose down --remove-orphans
```

### 2. **Disk Space (81%+)**

```bash
bash scripts/cleanup-coolify.sh
```

### 3. **Build Cache Issues**

```bash
docker builder prune -a -f
```

### 4. **Port Conflicts**

```bash
bash scripts/fix-coolify-port.sh
```

---

## Monitoring

Check deployment status in Coolify:

- Dashboard → Applications → Your App → Deployments
- Look for green checkmark ✅
- Check logs for any errors

---

## Files Created

- `scripts/fix-coolify-port.sh` - Port conflict resolver
- `scripts/cleanup-coolify.sh` - Disk cleanup
- `scripts/COOLIFY_CLEANUP.md` - Cleanup guide
- `scripts/COOLIFY_ISSUES.md` - This file
