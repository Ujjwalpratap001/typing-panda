# Typing Panda monetization setup

Typing Panda is prepared for a single responsive Google AdSense display unit that renders **after the app**, below the typing workspace and other content. No ad is rendered until both environment variables are configured. This keeps the active typing area free of ads.

## Before enabling ads

1. Purchase and connect a custom domain (recommended: `typingpanda.com`, only if available).
2. Publish a real Privacy Policy and Terms page with accurate information about Firebase Authentication, Firestore, local browser storage, cookies, advertising and data use. Add a real contact email.
3. Add useful, original typing lessons and guides. A typing tool alone may not be sufficient for AdSense review.
4. Apply for AdSense and wait for site approval.
5. In AdSense, create a responsive display ad unit and copy the publisher ID (`ca-pub-...`) and that unit's slot ID.
6. Add the two variables below to the GitHub Actions repository secrets (or your local `.env` for local testing):
   - `VITE_ADSENSE_CLIENT_ID`
   - `VITE_ADSENSE_SLOT_ID`
7. Build and deploy. Confirm the ad renders on the approved custom domain.

## Important

- Do not use a placeholder publisher ID or slot ID.
- Do not click your own ads, ask users to click them, or place ads next to typing controls, buttons or navigation.
- Keep the ad at least 150 pixels away from the interactive typing/game area; this implementation places it after the complete app.
- Do not enable ads before AdSense approves the site.
- Create and publish an accurate privacy policy and configure consent messaging where required for visitors in the EEA, UK and Switzerland.
- Add `ads.txt` only with the exact seller record supplied by Google for your publisher account. Do not publish a guessed record.
- Revenue is not guaranteed; it depends on valid impressions, visitor geography, pageviews, ad demand and policy compliance.

## Custom domain on Firebase Hosting

In Firebase Console → Hosting → Add custom domain, enter the domain you purchased and follow the exact TXT/A/CNAME instructions shown by Firebase. Do not copy DNS values from a generic tutorial: use the records generated for your project. Firebase provisions SSL after DNS verification and propagation.

Official guides:
- https://support.google.com/adsense/answer/2768340
- https://support.google.com/adsense/answer/48182
- https://firebase.google.com/docs/hosting/custom-domain
