# Mobile App Setup

## Firebase Configuration

### Local Development

1. Download your `GoogleService-Info.plist` from Firebase Console
2. Place it at: `apps/mobile/ios/App/App/GoogleService-Info.plist`
3. **DO NOT commit this file** - it's in `.gitignore`

### CI/CD Setup

For GitHub Actions or other CI/CD:

1. **Encode the file:**

   ```bash
   base64 -i apps/mobile/ios/App/App/GoogleService-Info.plist | pbcopy
   ```

2. **Add as GitHub Secret:**
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Create secret: `IOS_FIREBASE_CONFIG`
   - Paste the base64 string

3. **Decode in CI:**
   ```yaml
   - name: Setup Firebase Config
     run: |
       echo "${{ secrets.IOS_FIREBASE_CONFIG }}" | base64 -d > apps/mobile/ios/App/App/GoogleService-Info.plist
   ```

## Security Notes

- ⚠️ **Never commit** `GoogleService-Info.plist` to version control
- ✅ Use the `.example` file as a template
- ✅ Restrict your Firebase API key in Google Cloud Console:
  - Application Restrictions: iOS apps only
  - Bundle ID: `dev.chrry.vex`
  - API Restrictions: Only enable needed APIs

## Building the App

```bash
# Development
pnpm run dev:ios

# Production build
pnpm run build
pnpm cap sync ios
pnpm cap open ios
```
