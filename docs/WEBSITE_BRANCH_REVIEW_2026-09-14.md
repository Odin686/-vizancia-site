# Website branch review, September 14, 2026

Reviewed main at `70d11fb`, PR #13 at `39e6d68`, and PR #11 at `1f2126e`.
`claude/trusting-shannon-ohoy0g` and `website-measurement-consent-mode`
pointed to the same commit. The live custom domain is published by GitHub Pages
from main, repository root. The Sites project is a separate private review copy.

## Consolidation decisions

- Retain PR #13's Google Consent Mode v2 opt-in implementation, tag IDs,
  store-click events and matching disclosures, with the corrections below.
- Retain PR #11's Programs inquiry flow, country field, Canada/U.S. quote
  wording and matching terms. Preserve the current adult-only form notice,
  teacher navigation, 4.1 facts and shared icon. Match the form ID and CSS class
  to the merged script, and keep the old `#enquire` anchor working.
- Supersede the old PR's deferred consent script and old asset version changes.
  Consent defaults remain synchronous before Google can load. Current asset
  versions and favicons remain authoritative.
- Use a merge commit so all reviewed branch tips remain in main's ancestry.
  Delete remote branches only after ancestry and current remote tips are checked.

## Corrections before publication

- A denied consent update by itself can still permit cookieless measurement.
  Withdrawal now sets the documented GA4 disable flag, denies consent, clears
  Google cookies and reloads a tagged page to unload running Google code.
  Other tabs and restored pages check the saved choice too.
- Saved choices expire after 180 days. Invalid or future timestamps do not
  authorize measurement. A failed refusal write attempts to remove any older
  acceptance. Analytics cookies are not renewed on every page visit.
- The banner explains that either choice is saved locally. Cookie retention
  wording says up to 13 months, rather than promising every cookie lasts exactly
  that long. Google cookie variants are cleared without touching other cookies.
- Production measurement runs only on vizancia.com and www.vizancia.com.
  Private previews and localhost cannot send production analytics.
- All public consent-script references use v5. Classroom projection pages
  remain free of measurement, forms, storage and live AI requests.

## Validation

`npm run build` runs site audits, the existing 4.1 release/icon checks and the
privacy and Programs regression tests, then creates the static output.
These are source and simulated-DOM tests, not a certification of legal
compliance or verification of private Google account settings.

## Google account checks still required

The repository specifies GA4 `G-Z5P9FY92DE` and Ads `AW-18320211414`. This review
does not authenticate to either Google account. Verify in those accounts:

1. The IDs belong to the intended Vizancia property and Ads account.
2. In Tag Assistant and GA4 Realtime, an accepted visit appears once and
   `app_store_click` / `play_store_click` include the intended placement.
3. Mark the intended events as GA4 key events and verify their import into the
   linked Google Ads account. These events are store clicks, not app installs.
4. Keep personalized advertising, Google Signals, user-provided-data collection
   and remarketing disabled. Review Enhanced Measurement and account retention
   settings so they match the site's published purposes and disclosures.
5. Check fresh refusal, saved refusal, withdrawal and Global Privacy Control
   with Tag Assistant. Use test traffic deliberately when checking live tags.

Sources checked September 14, 2026:

- [Google Consent Mode behavior](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Disable Analytics and advertising features](https://developers.google.com/tag-platform/security/guides/privacy)
- [Analytics cookie configuration](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
