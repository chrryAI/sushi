# Vex Open Source Checklist ✅

This document tracks what needs to be done before pushing to the public `chrryai/vex` repository.

## ✅ Completed

### Security

- [x] No .env files in git
- [x] No hardcoded API keys
- [x] No hardcoded database URLs
- [x] No private keys or certificates
- [x] .gitignore properly configured
- [x] Security check script created (`scripts/check-sensitive-data.sh`)
- [x] Git history cleanup script created (`scripts/clean-git-history.sh`)

### Documentation

- [x] .env.example files created for all apps/packages
- [x] SECURITY.md created
- [x] CONTRIBUTING.md created
- [x] README.md created/updated
- [x] Preparation script created (`scripts/prepare-open-source.sh`)

### Code Quality

- [x] Custom AI model implementation complete
- [x] Self-sustaining architecture (user-funded models)
- [x] All AI operations use user's selected models
- [x] Monorepo build scripts fixed

## ⚠️ Review Before Publishing

### 1. Test Environment Variables

Run through setup with only `.env.example` files:

```bash
# Remove your .env files temporarily
mv apps/api/.env apps/api/.env.backup

# Copy example
cp apps/api/.env.example apps/api/.env

# Try to run
pnpm run dev
```

### 2. Email Addresses in Code

Review these files for email addresses:

- `apps/api/app/api/ai/route.ts` - Example email (OK)
- `apps/api/tests/shared/collaboration.ts` - Test email
- `apps/web/tests/shared/collaboration.ts` - Test email
- `apps/extension/vite.config.ts` - "vex@yourdomain.com" (update)

**Action**: These are test/example emails, but verify they're appropriate for public repo.

### 3. Update Extension Config

File: `apps/extension/vite.config.ts`

```typescript
id: "vex@yourdomain.com",  // Change to: "vex@chrry.ai"
```

### 4. Test Emails in Environment Variables

You mentioned moving test emails to env vars. Verify:

- `TEST_MEMBER_EMAILS` uses `process.env.TEST_MEMBER_EMAILS`
- `TEST_GUEST_FINGERPRINTS` uses `process.env.TEST_GUEST_FINGERPRINTS`
- `.env.example` has these documented

### 5. Review Personal Info

- Author emails in package.json files (your business email is OK)
- Any personal comments in code
- Any internal URLs or staging environments

## 📋 Publishing Steps

### Step 1: Final Security Check

```bash
./scripts/check-sensitive-data.sh
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/chrryai
2. Create new repository: `vex`
3. Make it **public**
4. Don't initialize with README (we have one)

### Step 3: Set Up Automated Sync (Recommended)

**Option A: Automated Sync with GitHub Actions** (Recommended)

Follow the guide: [.github/SYNC_SETUP.md](.github/SYNC_SETUP.md)

Quick steps:

1. Create Personal Access Token (PAT) with `repo` and `workflow` scopes
2. Add token as `VEX_SYNC_TOKEN` secret in your private repo
3. Go to Actions → "Sync Vex to Public Repo" → Run workflow manually
4. After initial sync, new commits will auto-sync on every push to main

**Option B: Manual Push**

```bash
# Add remote
git remote add public https://github.com/chrryai/vex.git

# Push to public repo
git push public main

# Push tags (if any)
git push public --tags
```

Note: With Option B, you'll need to manually push each time. Option A is recommended for continuous sync.

### Step 4: Configure GitHub Repository

#### Settings

- [ ] Add description: "A self-sustaining AI platform powered by user-provided models"
- [ ] Add topics: `ai`, `chatgpt`, `claude`, `openai`, `nextjs`, `typescript`, `monorepo`
- [ ] Add website: https://chrry.ai
- [ ] Enable Issues
- [ ] Enable Discussions (optional)
- [ ] Enable Wikis (optional)

#### Branch Protection

- [ ] Protect `main` branch
- [ ] Require PR reviews
- [ ] Require status checks to pass

#### Secrets (for CI/CD)

Don't add any! Users should use their own API keys.

### Step 5: Set Up CI/CD (Optional)

Create `.github/workflows/ci.yml` for:

- Linting
- Type checking
- Build verification
- (Skip tests that require API keys)

### Step 6: Announce

- [ ] Post on Discord
- [ ] Tweet about it
- [ ] Update chrry.ai website
- [ ] Add badge to README: `![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)`

## 🚀 Post-Publication

### Monitor

- [ ] Watch for issues
- [ ] Respond to first PRs quickly
- [ ] Set up GitHub Discussions for Q&A

### Documentation

- [ ] Create API documentation
- [ ] Add architecture diagrams
- [ ] Create video tutorials
- [ ] Write blog post about the tech

### Community

- [ ] Set up Discord/Slack for contributors
- [ ] Create contributor guidelines
- [ ] Add code of conduct
- [ ] Set up automated welcome bot

## 🎉 Success Metrics

Track these after open sourcing:

- GitHub stars
- Contributors
- Issues/PRs
- Community engagement
- Self-hosted instances

## Notes

**License**: AGPL-3.0 - This requires anyone who uses Vex to also open source their modifications. Perfect for keeping the ecosystem open!

**Philosophy**: Vex is self-sustaining because users provide their own API keys. This means:

- No operational costs for AI API calls
- Users control their data
- Platform can scale infinitely
- Long live Chrry! 👑

---

Last updated: 2025-10-31
Status: Ready for open source! 🎉
