# Vizancia website, legal, marketing, and design audit

**Review date:** July 14, 2026

**Scope:** Public website repository, landing-page claims, consent implementation, legal/trust pages, Learning Hub, SEO foundations, conversion plumbing, responsive design, and launch readiness.

**Important:** This is a product and implementation review, not a legal opinion. Qualified counsel must review the final product flows, contracts, target markets, and published legal documents.

## Executive assessment

The website now has a credible professional foundation: clear audience routes, honest product previews, separate app and website privacy explanations, consent-controlled Google Ads measurement, a stronger Sandbox safety boundary, a substantive Learning Hub, and automated checks for common publishing errors.

The remaining highest-risk work is outside this repository. Before material ad spend or a broad AI Sandbox release, Vizancia must complete Google Ads conversion labels, verify the shipped app and store disclosures, document the AI provider and retention configuration, validate the intended child/teen access model with counsel, and supply authentic product/team proof.

## Completed in this repository

### Legal, privacy, and safety

- Separated the offline-first core app, optional connected app features, and marketing-website measurement.
- Made Google Ads measurement optional, denied by default, and reversible through a persistent privacy control.
- Kept ad personalization and Analytics storage denied in the current consent implementation.
- Added Global Privacy Control handling for visitors without a saved choice.
- Added an adult-managed limited-beta boundary for the AI Sandbox and prohibited independent use by a child under 13.
- Added a dedicated Sandbox Safety Policy covering supervision, sensitive information, prohibited uses, verification, reporting, and enforcement.
- Aligned Terms, Privacy, Support, Parents, Mission, Sandbox, and footer language.
- Removed or qualified broad “no tracking,” “all ages,” origin, availability, and collection claims outside the precise core-app context.

### Marketing and conversion

- Rebuilt the home and homeschool landing pages around a clear problem, learning outcome, audience fit, product mechanism, privacy boundary, and direct store selection.
- Replaced “Choose your store” with “Get the app.”
- Added separate App Store and Google Play CTAs instead of user-agent store replacement.
- Added consistent store-click events and placeholders for separate Google Ads conversion destinations.
- Preserved the distinction between a store click and a verified install or first open.
- Added campaign-specific parent and homeschool store parameters.
- Avoided invented ratings, reviews, screenshots, credentials, and outcome claims.

### Product proof and content

- Added clearly labelled, code-built lesson and interaction previews without presenting them as real app screenshots.
- Added curriculum, learning-loop, age-mode, privacy, and methodology explanations.
- Added four substantive Learning Hub resources: AI literacy by age, verifying AI answers, a family AI agreement, and AI hallucinations for families.
- Added source, limitation, date, article, collection, and learning-resource metadata where appropriate.
- Rebuilt About, Methodology, Editorial Policy, Accessibility, Changelog, and 404 pages.

### Design, accessibility, and maintainability

- Standardized the primary navigation and “Get the app” CTA across the professional page system.
- Reworked mobile navigation, narrow-screen typography, consent controls, and overflow behaviour.
- Added visible focus states, skip links, reduced-motion support, semantic headings, labelled controls, and keyboard-close behaviour for menus.
- Added six original 1200×630 social-sharing cards in SVG and PNG formats.
- Added a repository audit, reproducible social-card renderer, responsive browser QA, and a GitHub Actions quality gate.
- Verified 27 HTML files with no missing local targets, required metadata errors, JSON-LD parse errors, or flagged absolute claims.

## Launch blockers and owner actions

### 1. Google Ads account setup

Create separate App Store click and Google Play click conversion actions, then insert the two `AW-18320211414/CONVERSION_LABEL` destinations in `assets/privacy-consent.js`. Verify default-denied and post-choice signals in Tag Assistant. Use verified installs or first opens as the primary campaign goal; treat website store clicks as secondary intent signals.

### 2. Shipped app and store truth audit

Compare the current iOS and Android binaries against every public statement. Re-run Apple App Privacy, Apple age rating, Google Play Data Safety, Target Audience and Content, Families, and IARC questionnaires. Store disclosures must include relevant third-party SDK and connected-feature practices, not only Vizancia-owned systems.

### 3. AI provider and child access review

Document the provider, subprocessors, transmitted fields, identifiers, safety logging, retention, training-use settings, processing locations, deletion controls, incident response, and contractual permissions. Complete the selected adult authorization and parental-consent flow before opening the Sandbox to minors.

### 4. Authentic proof

Supply current app screenshots, a captioned 30–45 second demo, verified feature counts, and approved founder/team information. Publish reviews or testimonials only with a direct source, written permission where required, and an accurate representation of the reviewer’s experience.

### 5. Professional sign-off

Have qualified privacy/technology counsel review the final policy, terms, Sandbox flow, provider agreement, advertising plan, and target markets. Confirm the public legal/contact address and the individual responsible for privacy. Complete manual website and app accessibility testing before making specific conformance claims.

## Research-based rationale

- PIPEDA remains Canada’s current federal private-sector privacy framework for many commercial activities. It emphasizes accountability, stated purposes, meaningful consent, limited collection, safeguards, access, and complaint handling. Canada introduced Bill C-36 in June 2026, but proposed legislation should be monitored rather than described as current law.
- The Office of the Privacy Commissioner of Canada generally expects parent or guardian consent where an individual cannot provide meaningful consent and states that, in all but exceptional circumstances, this includes children under 13.
- Google Consent Mode communicates consent status but does not replace a consent interface. Google’s verification guidance checks `ad_storage`, `ad_user_data`, `ad_personalization`, and `analytics_storage` at the earliest consent event and after a visitor’s choice.
- COPPA can apply to operators of child-directed services or operators with actual knowledge of collecting personal information from a child under 13. Contract language cannot simply shift an operator’s compliance responsibility to a school.
- Google Play requires accurate Target Audience, Data Safety, and rating answers and applies Families Policy requirements when children are in the target audience.
- Apple requires current privacy disclosures covering the app and integrated third-party partners. Apple also requires an age rating and provides separate accessibility declarations.
- The Competition Bureau requires performance claims to be supportable and regulates tests, testimonials, reviews, endorsements, and material connections. This supports the decision not to invent social proof or publish unverified outcome claims.
- Ontario website-accessibility obligations depend on the organization and applicable regulation. Regardless of current legal scope, WCAG-level accessibility testing is a sound product and procurement baseline.

## Recommended 30/60/90-day roadmap

### Next 30 days: launch integrity

- Complete the authenticated account and legal items in `IMPLEMENTATION_CHECKLIST.md`.
- Add verified Google Ads conversion destinations and confirm them in Tag Assistant.
- Replace concept previews with real, redacted screenshots when available; keep the preview label until then.
- Publish the final legal documents only after counsel and product-flow review.
- Run Search Console, sitemap, indexing, and deployed PageSpeed checks.

### Days 31–60: proof and acquisition

- Produce the short demo, screenshot set, transcript, and store creative.
- Create adult-audience campaigns for parents and homeschool families with distinct landing URLs and UTM naming.
- Test one message variable at a time and judge success by qualified store visits, installs, first opens, and retained learning, not clicks alone.
- Build source-backed team and reviewer profiles after authorization.

### Days 61–90: product and content depth

- Add real sample lesson media and a downloadable curriculum map.
- Publish two carefully sourced Learning Hub pieces per month, prioritizing search intent over volume.
- Establish a quarterly content review and correction cycle.
- Consider a small static-site generator only after the current launch is stable; migrate shared navigation, footer, metadata, and article templates without changing public URLs.

## Primary sources

- [Office of the Privacy Commissioner of Canada: PIPEDA requirements](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief)
- [Office of the Privacy Commissioner of Canada: meaningful consent](https://www.priv.gc.ca/en/privacy-topics/business-privacy/collecting-personal-information/consent/gl_omc_201805/)
- [Government of Canada: proposed Bill C-36 backgrounder](https://www.canada.ca/en/innovation-science-economic-development/news/2026/06/government-of-canada-introduces-legislation-to-protect-canadians-privacy-in-the-digital-age.html)
- [FTC: Complying with COPPA](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Google Ads: consent mode](https://support.google.com/google-ads/answer/10000067)
- [Google Ads: verify consent mode](https://support.google.com/google-ads/answer/14218557)
- [Google Play: Families Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Apple: app privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple: app age ratings](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)
- [Competition Bureau Canada: tests and testimonials](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/use-tests-or-testimonials)
- [Ontario: making websites accessible](https://www.ontario.ca/page/how-make-websites-accessible)

See `IMPLEMENTATION_CHECKLIST.md` for the operational account-by-account handoff.
