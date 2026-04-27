# FocusButton.com → Focus.chrry.ai Redirect

This guide explains how to redirect focusbutton.com to focus.chrry.ai.

## Server Setup

### 1. Copy Config to Server

```bash
sudo nano /etc/nginx/sites-available/focusbutton.com
```

Paste this content:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name focusbutton.com www.focusbutton.com;

    ssl_certificate /etc/letsencrypt/live/focusbutton.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/focusbutton.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://focus.chrry.ai$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name focusbutton.com www.focusbutton.com;

    return 301 https://focusbutton.com$request_uri;
}
```

### 2. Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/focusbutton.com /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3. Test Redirect

```bash
# Test HTTP redirect
curl -I http://focusbutton.com

# Test HTTPS redirect
curl -I https://focusbutton.com

# Should both redirect to https://focus.chrry.ai
```

## How It Works

### URL Mapping

| Original URL                  | Redirects To                          |
| ----------------------------- | ------------------------------------- |
| http://focusbutton.com        | https://focusbutton.com (SSL upgrade) |
| https://focusbutton.com       | https://focus.chrry.ai                |
| https://www.focusbutton.com   | https://focus.chrry.ai                |
| https://focusbutton.com/focus | https://focus.chrry.ai/focus          |

### Architecture

```
focusbutton.com → focus.chrry.ai → Coolify (port 3000) → Next.js Web App
```

## Focus Button Link

The Focus button in the app now uses smart routing:

```typescript
// If on focus.chrry.ai
href = "/focus"; // → https://focus.chrry.ai/focus

// If on chrry.ai or vex.chrry.ai
href = "/vex/focus"; // → https://vex.chrry.ai/vex/focus
href = "/chrry/focus"; // → https://chrry.ai/chrry/focus
```

## DNS Setup

Make sure DNS is configured:

```
focusbutton.com      A      <your-server-ip>
www.focusbutton.com  CNAME  focusbutton.com
```

## SSL Certificates

Certificates are already in place:

- `/etc/letsencrypt/live/focusbutton.com/fullchain.pem`
- `/etc/letsencrypt/live/focusbutton.com/privkey.pem`

Auto-renewal is handled by certbot.

## Monitoring

Check redirect logs:

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log | grep focusbutton

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## Rollback

To remove the redirect:

```bash
# Remove symlink
sudo rm /etc/nginx/sites-enabled/focusbutton.com

# Reload nginx
sudo systemctl reload nginx
```
