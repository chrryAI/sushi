# Creating Apple Developer ID Certificate

## Step 1: Create Certificate Signing Request (CSR) on Your Mac

### Using Keychain Access (GUI Method):

1. **Open Keychain Access**
   - Press `Cmd + Space` and type "Keychain Access"
   - Or: Applications → Utilities → Keychain Access

2. **Request Certificate**
   - Menu: **Keychain Access** → **Certificate Assistant** → **Request a Certificate from a Certificate Authority**

3. **Fill in the form:**
   - **User Email Address**: `your@email.com` (your Apple ID email)
   - **Common Name**: `Your Name` (e.g., "Ibrahim Velinov")
   - **CA Email Address**: Leave empty
   - **Request is**: Select **"Saved to disk"**
   - **Let me specify key pair information**: Check this box

4. **Click Continue**

5. **Key Pair Information:**
   - **Key Size**: `2048 bits`
   - **Algorithm**: `RSA`

6. **Click Continue**

7. **Save the file:**
   - Save as: `CertificateSigningRequest.certSigningRequest`
   - Location: Desktop (or anywhere you can find it)

8. **Click Done** ✅

---

## Step 2: Upload CSR to Apple Developer

1. **Go back to the Apple Developer page** (where you are now)
2. **Keep "G2 Sub-CA" selected**
3. **Click "Choose File"**
4. **Select the `.certSigningRequest` file** you just created
5. **Click "Continue"**

---

## Step 3: Download Certificate

1. **Click "Download"** to get the `.cer` file
2. **Save it** to your Downloads folder

---

## Step 4: Install Certificate

1. **Double-click** the downloaded `.cer` file
2. **Keychain Access will open** and show the certificate
3. **Verify it's installed:**
   - Open Keychain Access
   - Select "My Certificates" in the left sidebar
   - You should see "Developer ID Application: Your Name (TEAM_ID)"

4. **Done!** ✅

---

## Step 5: Build Your App

Now you can build your Tauri app and it will be automatically signed:

```bash
cd apps/browser
pnpm build:vex
```

Tauri will automatically find and use your certificate from Keychain!

---

## Troubleshooting

### Certificate not found during build?

```bash
# List all code signing identities
security find-identity -v -p codesigning
```

You should see your certificate listed as:

```
1) XXXXX "Developer ID Application: Your Name (TEAM_ID)"
```

### Need to sign manually?

```bash
codesign --force --deep --sign "Developer ID Application: Your Name" ./path/to/app
```

---

## Next Steps After Building

1. **Test the DMG** on your Mac
2. **Share with testers** (they can install without warnings)
3. **(Optional) Notarize** for wider distribution
4. **Distribute via your website** or GitHub Releases

Your apps will be properly signed and users won't get "unidentified developer" warnings! 🎉
