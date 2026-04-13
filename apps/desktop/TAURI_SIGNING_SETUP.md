# Tauri Code Signing - Quick Setup Guide

## ✅ What You Have

- Apple Developer Program membership
- Apple Development certificate: `iliyan velinov (FWXW3563PG)`
- Tauri browser app in `apps/desktop/`

---

## 🎯 Next Steps

### 1. Get Your Team ID

Visit: https://developer.apple.com/account/

Your Team ID will be shown in the top right (10-character code like `ABCD123456`)

### 2. Create Developer ID Application Certificate

**Why?** The certificate you have (`Apple Development`) is for development only. For distribution, you need `Developer ID Application`.

**Steps:**

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority**
3. Enter your email and name
4. Select "Saved to disk"
5. Save the `.certSigningRequest` file

6. Go to https://developer.apple.com/account/resources/certificates/list
7. Click **+** to create new certificate
8. Select **Developer ID Application** (for distribution outside App Store)
9. Upload the `.certSigningRequest` file
10. Download the `.cer` file
11. Double-click to install in Keychain

### 3. Create App Store Connect API Key (for automated notarization)

1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click **+** to generate new key
3. Name it "Tauri CI/CD"
4. Select **Developer** role
5. Download the `.p8` private key file
6. **Save it securely!** (e.g., `~/Documents/AuthKey_KEYID.p8`)
7. Note the **Key ID** and **Issuer ID**

### 4. Set Up Environment Variables

Create `apps/desktop/.env.local`:

```bash
# Code Signing Identity (from Keychain Access after step 2)
APPLE_SIGNING_IDENTITY="Developer ID Application: Iliyan Velinov (YOUR_TEAM_ID)"

# Notarization (App Store Connect API Key from step 3)
APPLE_API_ISSUER="your-issuer-id-from-step-3"
APPLE_API_KEY="your-key-id-from-step-3"
APPLE_API_KEY_PATH="/Users/ibrahimvelinov/Documents/AuthKey_KEYID.p8"

# Team ID (from step 1)
APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### 5. Build Signed App

```bash
cd apps/browser
pnpm tauri build
```

Tauri will automatically:

- Sign the app with your certificate
- Notarize it with Apple
- Create a `.dmg` file

### 6. Verify Signing

```bash
# Check if app is signed
codesign -dv --verbose=4 src-tauri/target/release/bundle/macos/YourApp.app

# Check if app is notarized
spctl -a -vv src-tauri/target/release/bundle/macos/YourApp.app
```

Expected: `source=Notarized Developer ID`

---

## 💰 Distribution Strategy

### Direct Download (Recommended)

**Your website:**

```
https://vex.chrry.ai/download
```

**Flow:**

1. User visits download page
2. Clicks "Download for Mac"
3. Downloads `.dmg` file
4. Opens `.dmg`, drags app to Applications
5. App opens without warnings (because it's signed & notarized!)

**Monetization:**

- Free trial (7-14 days)
- Stripe subscription ($10-20/month)
- **You keep 97%** (Stripe: 2.9% + $0.30)

vs App Store:

- Apple takes 30% first year, 15% after
- **You keep only 70% or 85%**

**Savings at $10/month with 1000 users:**

- Direct: $10,000 × 0.97 = **$9,700/month**
- App Store: $10,000 × 0.70 = **$7,000/month**
- **Difference: $2,700/month = $32,400/year!**

---

## 🚀 Auto-Update Setup

Tauri supports auto-updates for direct distribution:

**In `tauri.conf.json`:**

```json
{
  "updater": {
    "active": true,
    "endpoints": ["https://api.chrry.ai/tauri/updates/{{target}}/{{current_version}}"],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

**Benefits:**

- Users get updates automatically
- No App Store review delays
- Push updates instantly
- **Full control**

---

## ✅ Checklist

- [ ] Get Team ID from developer.apple.com
- [ ] Create Developer ID Application certificate
- [ ] Create App Store Connect API Key
- [ ] Set up `.env.local` with credentials
- [ ] Run `pnpm tauri build`
- [ ] Verify signing with `codesign` and `spctl`
- [ ] Test on fresh Mac (no warnings!)
- [ ] Set up download page on website
- [ ] Configure Stripe subscriptions
- [ ] Set up auto-updates

---

## 📚 Resources

- [Tauri Code Signing Docs](https://tauri.app/v1/guides/distribution/sign-macos/)
- [Apple Developer Portal](https://developer.apple.com/account/)
- [App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
