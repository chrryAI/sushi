# Security Policy

## Reporting a Vulnerability

We take the security of Vex seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Email**: iliyan@chrry.ai

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

We'll respond within 48 hours and work with you to address the issue.

## Security Best Practices

### Environment Variables

**Never commit sensitive data!**

- All `.env` files are gitignored
- Use `.env.example` as a template
- Keep your API keys and secrets in `.env.local`
- Rotate keys if accidentally exposed

### Secret Scanning (Pre-Commit Hook)

We use **Gitleaks** to automatically scan for secrets before every commit.

**For Contributors:**

1. Install Gitleaks (if not already installed):

   ```bash
   brew install gitleaks
   ```

2. The pre-commit hook runs automatically when you commit

3. If secrets are detected:
   - Review the findings
   - Remove the secret or add the file to `.gitignore`
   - If it's a false positive, update `gitleaks.toml` allowlist

**Emergency Bypass** (use only when absolutely necessary):

```bash
SKIP=gitleaks git commit -m "your message"
```

**Note**: All bypasses are logged. If you bypass the check, ensure the secret is properly handled before pushing.

### API Keys

When using Vex:

- Use your own API keys for AI providers
- Custom models: Encrypt sensitive data at rest
- Enable rate limiting in production
- Monitor API usage regularly

### Database

- Use strong passwords
- Enable SSL/TLS for connections
- Regularly backup your data
- Restrict database access by IP

### Production Deployment

- Set `NODE_ENV=production`
- Enable CORS restrictions
- Use HTTPS only
- Set up proper authentication
- Enable security headers
- Rate limit API endpoints

## Known Security Considerations

### AI Model Integration

- User-provided API keys are stored encrypted
- Custom model URLs are validated
- Rate limiting prevents abuse
- Audit logs track usage

### Data Privacy

- Users control their data
- Incognito mode available
- Memory extraction can be disabled
- GDPR compliant data deletion

## Updates

Check the [changelog](CHANGELOG.md) for security-related updates.
