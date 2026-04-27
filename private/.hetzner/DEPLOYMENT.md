# White-Label Deployment Guide

## Quick Deploy Script

Automatically deploy any white-label subdomain with Nginx + SSL.

### Usage

```bash
sudo ./.hetzner/scripts/deploy-whitelabel.sh <subdomain> <port>
```

### Examples

**Deploy Burn:**

```bash
sudo ./.hetzner/scripts/deploy-whitelabel.sh burn 3009
```

**Deploy Focus:**

```bash
sudo ./.hetzner/scripts/deploy-whitelabel.sh focus 3010
```

**Deploy Grape:**

```bash
sudo ./.hetzner/scripts/deploy-whitelabel.sh grape 3008
```

### What the Script Does

1. ✅ Creates Nginx configuration file
2. ✅ Enables the site
3. ✅ Tests Nginx configuration
4. ✅ Reloads Nginx
5. ✅ Obtains SSL certificate (Let's Encrypt)
6. ✅ Configures HTTPS redirect
7. ✅ Verifies deployment

### Prerequisites

- Root access (use `sudo`)
- Nginx installed
- Certbot installed
- DNS A record pointing to your server

### Port Assignments

| Subdomain      | Port | Status    |
| -------------- | ---- | --------- |
| vex.chrry.ai   | 3000 | ✅ Active |
| grape.chrry.ai | 3008 | ✅ Active |
| burn.chrry.ai  | 3009 | 🔜 Ready  |
| focus.chrry.ai | 3010 | 🔜 Ready  |

### After Deployment

1. **Start your app on the assigned port:**

   ```bash
   VITE_SITE_MODE=burn PORT=3009 pnpm start
   ```

2. **Set environment variables in Coolify:**

   ```
   VITE_SITE_MODE=burn
   PORT=3009
   ```

3. **Test the deployment:**
   ```bash
   curl https://burn.chrry.ai
   ```

### Troubleshooting

**Site not responding:**

- Check if app is running: `pm2 list` or `docker ps`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify port: `sudo netstat -tlnp | grep 3009`

**SSL certificate issues:**

- Check Certbot logs: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`

**Nginx errors:**

- Test config: `sudo nginx -t`
- Check syntax: `sudo nginx -T`
- Reload: `sudo systemctl reload nginx`

### Manual Deployment (Alternative)

If you prefer manual deployment:

1. Create Nginx config:

   ```bash
   sudo nano /etc/nginx/sites-available/burn.chrry.ai.conf
   ```

2. Enable site:

   ```bash
   sudo ln -s /etc/nginx/sites-available/burn.chrry.ai.conf /etc/nginx/sites-enabled/
   ```

3. Test and reload:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. Get SSL:
   ```bash
   sudo certbot --nginx -d burn.chrry.ai
   ```

### Security Notes

- SSL certificates auto-renew via Certbot
- HTTPS redirect is automatic
- Client max body size: 100M
- Timeouts configured for long AI responses (5 minutes)
