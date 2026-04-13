# Chrome Web Store Privacy Forms - Vault & Pear

## Vault Extension Privacy Form

### Single Purpose Description

Vault is a personal finance assistant that helps users track expenses, create budgets, and receive AI-powered financial insights through natural conversation. The extension provides quick access to financial management tools directly from the browser.

### Permission Justifications

**storage**
Required to save user preferences, financial data (expenses, budgets), and conversation history locally in the browser. This enables offline access and faster performance without requiring constant server requests.

**sidePanel**
Required to display the Vault interface in Chrome's side panel, allowing users to manage finances while browsing without switching tabs. This provides seamless access to financial tools alongside web content.

**tabs**
Required to detect the current tab URL for context-aware features, such as automatically categorizing expenses based on the website being visited (e.g., detecting Amazon purchases or travel booking sites).

**contextMenus**
Required to add right-click menu options for quick expense entry. Users can right-click on prices or receipts on web pages to instantly add them to their expense tracker.

**cookies**
Required to maintain user authentication sessions across the extension and web app (vault.chrry.ai). This ensures users stay logged in and their data remains synced.

**Host Permission (\<all_urls\>)**
Required to enable context-aware expense tracking across all websites. The extension can detect purchase confirmations, receipt emails, and financial transactions on any site to help users track spending automatically. This permission is essential for the core expense tracking functionality.

### Remote Code Usage

**No, I am not using Remote code**

### Data Usage Certifications

✅ I do not sell or transfer user data to third parties, outside of the approved use cases  
✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose  
✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy Policy URL

https://vault.chrry.ai/privacy

---

## Pear Extension Privacy Form

### Single Purpose Description

Pear is a feedback platform that rewards users with credits for providing quality feedback on apps and services. The extension enables users to discover apps seeking feedback, submit detailed reviews, and earn credits based on feedback quality assessed by AI.

### Permission Justifications

**storage**
Required to save user preferences, feedback history, credit balance, and app discovery settings locally in the browser. This enables offline access to feedback drafts and faster performance.

**sidePanel**
Required to display the Pear interface in Chrome's side panel, allowing users to browse apps and write feedback while using the web without switching tabs. This provides seamless access to the feedback platform.

**tabs**
Required to detect which app or website the user is currently reviewing. This provides context for feedback submission and helps match feedback to the correct app.

**contextMenus**
Required to add right-click menu options for quick feedback submission. Users can right-click on app elements to instantly provide feedback about specific features or UI components.

**cookies**
Required to maintain user authentication sessions across the extension and web app (pear.chrry.ai). This ensures users stay logged in and their credits remain synced.

**Host Permission (\<all_urls\>)**
Required to enable feedback submission on any app or website. Users can provide feedback about any web application they're using, and the extension needs access to capture context (URL, page title) for accurate feedback attribution. This permission is essential for the core feedback functionality.

### Remote Code Usage

**No, I am not using Remote code**

### Data Usage Certifications

✅ I do not sell or transfer user data to third parties, outside of the approved use cases  
✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose  
✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy Policy URL

https://pear.chrry.ai/privacy

---

## Data Collection Disclosure (Both Extensions)

### What user data do you plan to collect?

**Personally identifiable information**: ✅ YES

- Email address (for account creation and authentication)
- Name (optional, for personalization)

**Authentication information**: ✅ YES

- Authentication tokens and session credentials (to keep users logged in)

**User activity**: ✅ YES

- Usage analytics (which features are used, how often)
- Interaction patterns (to improve UX)

**Website content**: ✅ YES (Vault only)

- URLs and page titles (for context-aware expense tracking)

All other categories: ❌ NO

### Data Usage Certification

All three certifications are checked:

- ✅ I do not sell or transfer user data to third parties
- ✅ I do not use or transfer user data for unrelated purposes
- ✅ I do not use or transfer user data for creditworthiness or lending

---

## Notes

- Both extensions use the same privacy policy infrastructure
- Privacy policies are hosted at respective subdomains
- All data is encrypted in transit and at rest
- Users can delete their data at any time
- No third-party data sharing except for essential services (authentication, AI processing)
