# Vizancia launch and account checklist

The repository changes cover public website copy, design, consent defaults, semantic store-click events, legal-document consistency, and launch guidance. The items below require authenticated accounts, app source code, vendor contracts, or verified personal information and must not be guessed from the website repository.

## Google Ads and measurement

- Create separate website conversion actions for App Store clicks and Google Play clicks.
- Copy each conversion destination in the format `AW-18320211414/CONVERSION_LABEL` into `CONVERSION_DESTINATIONS` in `assets/privacy-consent.js`.
- Verify each action with Tag Assistant after accepting website measurement.
- Do not treat a store click as an installed app. Import Google Play installs and configure the approved iOS app-install measurement path in Google Ads.
- Make verified installs or first opens the primary campaign goal; keep store clicks as secondary conversions.
- Target campaigns to adults and parents. Do not build personalized or remarketing audiences from child-directed traffic.
- Create separate campaigns and landing experiences for parents, homeschool families, and general adult learners.

## Apple App Store Connect

- Replace the `odin686.github.io` developer website with `https://vizancia.com/`.
- Replace the old privacy URL with `https://vizancia.com/privacy.html`.
- Re-run the App Privacy questionnaire against the current shipped build. If Sandbox prompts or technical request data are transmitted, confirm whether “Data Not Collected” remains accurate.
- Re-run the age-rating questionnaire before any connected AI feature is released.
- Declare only accessibility features verified in the shipped app.
- Align the description and screenshots with the intended audience and current feature set.
- Do not publish a rating average until the store displays a current, sufficient overview.
- Create audience-specific custom product pages after real screenshots and an app preview are available.

## Google Play Console

- Verify the public listing is active in every advertised market.
- Audit Data Safety, Target Audience and Content, Families, IARC rating, privacy URL, support URL, and current screenshots.
- Add an in-app report or flag control for AI-generated output before Sandbox release.
- Create custom store listings for parent and homeschool campaigns after real product media is available.

## AI Sandbox product and legal review

- Confirm whether Sandbox is present in any production app build. If it is, review access immediately against the adult-managed beta language now published on the site.
- Document the AI provider, subprocessors, transmitted fields, identifiers, retention, training-use setting, human review, processing locations, deletion controls, and security measures.
- Confirm through contract and provider policy that the selected configuration permits the intended family and education use.
- Complete an appropriate privacy impact assessment and obtain qualified privacy counsel for Canada, the United States, and every intentionally targeted market.
- Implement the age, adult authorization, and verifiable parental-consent flow selected with counsel.
- Present a child-friendly, just-in-time notice before the first prompt.
- Implement an in-app report flow, moderation queue, response process, and escalation path.
- Keep prompt content out of marketing analytics and advertising profiles.

## Verified product and team proof

- Supply current iPhone, iPad, and Android screenshots without personal information.
- Record a captioned 30–45 second app demo and provide a text transcript.
- Confirm the current lesson, game, question, achievement, and category counts for every release.
- Provide the founder/team names, approved biographies, roles, relevant experience, profile images, and public links that may appear on the About page.
- Identify any qualified educational, accessibility, safety, or privacy reviewer who has actually reviewed a defined part of the product or content, with permission to publish the scope and date.
- Obtain permission and a direct source before publishing any testimonial or review excerpt.

## Legal review

- Have Canadian technology/privacy counsel review `privacy.html`, `terms.html`, and `sandbox-safety.html` before broad Sandbox launch or material ad spend.
- Confirm the company mailing/contact address that should appear in legal notices and store disclosures.
- Confirm whether “Canadian company” is the preferred public origin statement.
- Revisit purchase and subscription terms before any paid feature is offered.

## Search, creative, and accessibility launch work

- Run PageSpeed Insights against the deployed parent, homeschool, Sandbox, Support, and Learning Hub pages; fix any Core Web Vitals regression before scaling paid traffic.
- Connect Google Search Console, submit `sitemap.xml`, and monitor indexing, queries, and page-level issues.
- Build campaign-specific landing URLs with consistent UTM naming and document the naming convention.
- Test one proposition at a time: headline, proof format, or CTA placement. Do not publish a winning claim unless the evidence actually supports it.
- Keep ad creative directed to the adult purchaser or educator, especially where the product may be used by children.
- Complete keyboard, screen-reader, 200% zoom, contrast, reduced-motion, and iOS/Android assistive-technology checks before claiming app accessibility support.

## Primary references for the account review

- [Office of the Privacy Commissioner of Canada: PIPEDA requirements in brief](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief)
- [Office of the Privacy Commissioner of Canada: meaningful consent](https://www.priv.gc.ca/en/privacy-topics/business-privacy/collecting-personal-information/consent/gl_omc_201805/)
- [FTC: Complying with COPPA](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [Google Ads: consent mode](https://support.google.com/google-ads/answer/10000067)
- [Google Ads: verify consent mode](https://support.google.com/google-ads/answer/14218557)
- [Google Play: Families Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9893335)
- [Apple: app privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple: age ratings](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/)
- [Competition Bureau Canada: tests and testimonials](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/use-tests-or-testimonials)
- [Ontario: how to make websites accessible](https://www.ontario.ca/page/how-make-websites-accessible)
