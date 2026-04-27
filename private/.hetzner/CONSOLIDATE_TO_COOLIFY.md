# Consolidate All Domains to Coolify (Port 3008)

This guide consolidates all web domains to use a single Coolify deployment, eliminating the Docker setup.

## Before (Messy)

```
chrry.ai → 3008 (Coolify)
focus.chrry.ai → 3000 (Coolify - separate deployment)
vex.chrry.ai → 3009 (Docker - separate container)
chrry.dev → 3001 (Coolify API)
```

## After (Clean)

```
chrry.ai → 3008 (Coolify web app)
focus.chrry.ai → 3008 (Coolify web app)
vex.chrry.ai → 3008 (Coolify web app)
chrry.dev → 3001 (Coolify API)
```

**One deployment serves all web domains!** 🎯

---

## Migration Steps

### 1. Update vex.chrry.ai Nginx Config

```bash
sudo nano /etc/nginx/sites-available/vex.chrry.ai.conf
```

Replace with:

```nginx
server {
    server_name vex.chrry.ai;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    location ^~ /.well-known/acme-challenge/ {
        allow all;
        root /var/www/html;
        default_type "text/plain";
        try_files $uri =404;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/vex.chrry.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vex.chrry.ai/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = vex.chrry.ai) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    listen [::]:80;
    server_name vex.chrry.ai;
    return 404;
}
```

### 2. Test and Reload Nginx

```bash
# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3. Stop and Remove Docker Container

```bash
# Find the container
docker ps | grep 3009

# Stop it
docker stop <container-id>

# Remove it
docker rm <container-id>

# Optional: Remove image
docker images
docker rmi <image-id>
```

### 4. Test All Domains

```bash
# Test vex.chrry.ai
curl -I https://vex.chrry.ai

# Test focus.chrry.ai
curl -I https://focus.chrry.ai

# Test chrry.ai
curl -I https://chrry.ai

# All should return 200 OK
```

---

## Benefits

### 1. Simplified Infrastructure ✅

- One Coolify deployment instead of three
- No Docker containers to manage
- Single codebase, single deployment

### 2. Cost Savings 💰

- Reduced memory usage (one Node.js process)
- Lower CPU usage
- Simpler monitoring

### 3. Easier Maintenance 🛠️

- One deployment to update
- Consistent configuration
- Easier debugging

### 4. Dynamic Routing 🎯

```typescript
// App automatically detects domain
const siteConfig = getSiteConfig(hostname);

// Returns correct config for:
// - chrry.ai
// - focus.chrry.ai
// - vex.chrry.ai
```

---

## Architecture

### Single Coolify Deployment

```
Nginx (Port 443/80)
  ↓
  ├─ chrry.ai → 127.0.0.1:3008
  ├─ focus.chrry.ai → 127.0.0.1:3008
  └─ vex.chrry.ai → 127.0.0.1:3008
       ↓
    Coolify Container (Port 3008)
       ↓
    Next.js App
       ↓
    getSiteConfig(hostname)
       ↓
    Returns correct branding/config
```

### How It Works

1. **Request comes in** for vex.chrry.ai
2. **Nginx** forwards to port 3008
3. **Next.js** receives request with `Host: vex.chrry.ai` header
4. **getSiteConfig()** detects hostname
5. **Returns Vex config** (branding, slug, etc.)
6. **App renders** with Vex branding

Same process for focus.chrry.ai and chrry.ai!

---

## Port Mapping

| Service    | Port     | Purpose                   |
| ---------- | -------- | ------------------------- |
| Nginx      | 80       | HTTP (redirects to HTTPS) |
| Nginx      | 443      | HTTPS (SSL)               |
| Web App    | 3008     | All web domains (Coolify) |
| API        | 3001     | chrry.dev API (Coolify)   |
| ~~Docker~~ | ~~3009~~ | ~~Removed~~ ❌            |

---

## Rollback Plan

If something breaks:

```bash
# Revert vex.chrry.ai config
sudo nano /etc/nginx/sites-available/vex.chrry.ai.conf
# Change back to port 3009

# Restart Docker container
docker start <container-id>

# Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

---

## Monitoring

Check if all domains work:

```bash
# Watch logs
sudo tail -f /var/log/nginx/access.log

# Check Coolify logs
# (In Coolify dashboard)

# Test each domain
curl https://chrry.ai
curl https://focus.chrry.ai
curl https://vex.chrry.ai
```

---

## Cleanup Checklist

After confirming everything works:

- [ ] Stop Docker container on port 3009
- [ ] Remove Docker container
- [ ] Remove Docker image (optional)
- [ ] Remove old nginx configs (if any)
- [ ] Update documentation
- [ ] Celebrate! 🎉

---

## Result

**One Coolify deployment, three branded domains!**

- ✅ Simpler infrastructure
- ✅ Lower costs
- ✅ Easier maintenance
- ✅ Same great user experience
