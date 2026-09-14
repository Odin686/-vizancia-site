# Website review — September 13, 2026

This is a technical and content review with proposed policy changes, not a legal opinion or compliance certification. The review branch does not change vizancia.com; GitHub Pages currently publishes main from the repository root.

## Most useful changes for teacher adoption

1. Start with one useful classroom activity. The homepage now leads to `/teachers/`: the existing **Can we trust this?** pilot for Grades 6–8, four 45-minute sessions, PDF packet, and offline projection slides. Supplied materials may be printed/displayed under the proposed narrow classroom permission in Terms section 2. No account wall, student input form, or newsletter subscription was added.
2. Show the current product honestly. `/releases.html` separates published iOS 4.1 from the prepared Android 4.1 update. It describes the new dashboard, Classroom Mode, Passport, questions, Campus investigations, Inside AI, Startup rooms, and shared onboarding. Use current native screenshots in future store-listing refreshes; the older website gallery remains explicitly labelled 3.5 rather than relabelled as new.
3. Keep the teacher path prominent. Paid programs remain accessible, lower on the homepage. Measure the initial pilot through voluntary adult-teacher feedback and repeat use, without collecting students' identities or work. Suggested experiment: recruit three classes through appropriate contacts; ask whether the lesson was run and whether they would run session two. These are targets, not a growth forecast.
4. Keep content current as part of every release. The release gate below records two source revisions and requires store evidence separately. A source push, an upload, an approved release, and a completed user installation are different events.

## Verified source and store evidence

- iOS source: `fc43e793efefdf41774479814fbf7feb9135ddd3`; clean checkout matched remote main. Current Swift code has 16 Games Hub entries, local bot duels, and no GameKit integration. The website's online Game Center claims described older releases.
- Android source: `9763f55dc83b878e1702101a8114bcb0fc9f8e78`; clean checkout matched remote main. Version 4.1 build 11 was prepared previously. No new app binaries were built in this website task.
- Apple's direct [lookup endpoint](https://itunes.apple.com/lookup?id=6759349861&country=ca) returned version **4.1**, release time **2026-09-12T20:16:05Z**, minimum iOS **17.0**. The search-indexed App Store page was stale and still showed 3.5.1; the current endpoint was used instead.
- A direct public [Google Play request](https://play.google.com/store/apps/details?id=com.vizancia.app&hl=en&gl=CA) exposed version 3.6 on this check. It does not establish all country, device, account, or test-track availability. Android 4.1 publication remains **unconfirmed**; verify the production track and install from Play before changing the website status.
- The shared icon was copied unchanged from the apps. The Startup screenshot comes from the existing Android 4.1 preview QA capture. It is labelled as a preview, with platform rendering differences disclosed.
- Both public stores link to `https://odin686.github.io/Vizancia-privacypolicy/`, a separate repository/policy. Updating this website does **not** update that policy or either store's privacy URL.

## Addendum, September 14, 2026 — measurement reinstated as opt-in

Website measurement returned on September 14, 2026 as a strict opt-in implementation of Google Consent Mode v2 (`assets/privacy-consent.js` v4, GA4 `G-Z5P9FY92DE` and Google Ads `AW-18320211414`). The two defects that justified the September 13 removal are closed as follows:

- **Saved acceptance no longer overrides Global Privacy Control.** The script reads `navigator.globalPrivacyControl` before it reads storage. When the signal is present it never loads a Google script, never shows the notice, never reads or writes the stored choice, and never sends an event, whatever an earlier visit saved. The legacy `vizancia_google_ads_consent` key is removed and never reused; the new choice lives under `vizancia_consent_v2`.
- **Store clicks are no longer queued before consent.** The document-level click listener returns immediately unless measurement is on, and measurement is on only when GPC is absent and either a saved `accepted:true` exists or the visitor clicks “Accept measurement” on the current page. Nothing is pushed to the dataLayer before that except the denied consent default. The GA4 key events `app_store_click` and `play_store_click` carry the link URL and a `data-placement` label; every store link now carries matching campaign parameters.

Personalised advertising, remarketing audiences, and Google Signals stay disabled in the tag configuration. “Essential only” or withdrawing acceptance pushes a denied consent update and expires the first-party Google cookies the site can control. The privacy policy, homepage and homeschool privacy facts, Support FAQ, changelog, and README were updated in the same commit, and `scripts/privacy.test.mjs` enforces the guarantees in CI.

## Findings addressed in this branch

- Removed old 96-lesson/16-category/17-game current claims. Current 4.1 curriculum: 17 paths, 106 lessons, 954 authored questions, 401 teaching cards, 93 dictionary terms, 16 games plus Train the Robot. Historical changelog entries and explicitly labelled old screenshots remain.
- Replaced current Game Center/online-player promises with local bot practice. Explained that profiles do not sync between platforms or devices.
- Used the unchanged shared app icon in navigation and explicit favicon metadata. Existing social-preview art remains unchanged.
- Removed Google Ads tag loading and all store-click event code. Previously, saved acceptance took precedence over Global Privacy Control, and store clicks were queued even before consent. Removing the integration closes those paths; historical local acceptance cannot reactivate tracking. Google may still hold prior information; browser cookies and historical provider records are not erased by removing code.
- Added GitHub Pages security-log disclosure. Hosting still involves requests and IP logs; “no measurement tags” is not a claim that no personal data ever flows through the website.
- Added actual local Passport, temporary classroom-session, report/certificate, sharing, Android backup, and external-tool facts to privacy copy.
- Drafted a narrow permission for teachers to use the free app and print/display supplied free materials in their own classes. Resale, public republication, and repackaging remain excluded. Paid curriculum licences remain separate. **Owner approval of this permission and consistent in-app wording are still needed before public release.**
- Clarified that the public Sandbox page is a concept/access-request page, with no live chatbot endpoint here. A hosted beta elsewhere still needs its own provider and processing review.
- Added teacher-resource links, meaningful link text, the shared icon, a keyboard-visible privacy link, and a mobile-stacking release layout. Removed initial consent focus stealing by removing the banner.

## Legal and operational items to resolve before calling the release compliant

| Priority | Item | Required next step |
| --- | --- | --- |
| High | Store-linked and bundled policies disagree | Review the revised policy, then publish one consistent authoritative policy and update both store privacy URLs or the separate legacy policy site. Align the in-app legal copies in the next app updates. Recheck Apple privacy answers and Google Data safety against actual runtime data flows; do not change declarations solely from a marketing summary. |
| High | Classroom permission | Approve Terms section 2 and reconcile older in-app terms that limit use to personal learning. The free packet permission must not accidentally change paid curriculum licences. |
| High | Children, classrooms, and connected services | Have counsel assess the actual age groups and places served. An arithmetic adult gate is not verified parental consent or secure authentication. Keep the shared activity offline/without student input. Before enabling any child-facing live beta, identify its provider, retention, countries of processing, notice, consent authority, and safety/reporting controls. Do not assume a teacher can consent to advertising or unrelated commercial processing. |
| High | Business privacy operations | Confirm the privacy officer/contact, correspondence and invoice retention periods, mailbox/provider contracts and subprocessors, cross-border handling, deletion/access procedures, and breach-response records. Source code cannot establish these existing policy promises. Confirm the legal company details and notice address with counsel. |
| Medium | Accessibility | The website has not had a complete screen-reader, keyboard, zoom/reflow, contrast, or accessible-PDF audit in this task. Do that before making a WCAG conformance claim or supplying schools with such a claim. Ontario obligations vary by organization type and employee count; do not assume every AODA requirement applies identically to a small business. |
| Medium | Outreach and paid offers | Record the basis for lawful teacher outreach. A public teacher email or an enquiry is not blanket permission for a marketing list. Confirm scopes, full prices, taxes, cancellation/refund and licence terms before taking payment; the site currently prepares an email enquiry, not a payment transaction. |
| Medium | Android rollout | Confirm 4.1 production availability, install from the actual Play track, and reconcile listing copy and screenshots before announcing that both stores offer the update. |

## Primary guidance consulted

- [OPC: meaningful consent](https://www.priv.gc.ca/en/privacy-topics/collecting-personal-information/consent/gl_omc_201805/) — meaningful notice; children's capacity and parent/guardian involvement.
- [FTC: COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) — applicability to child-directed services and limits on school consent to educational purposes. This is an applicability review item, not a declaration that all provisions necessarily apply to this business.
- [Ontario: accessible websites](https://www.ontario.ca/page/how-make-websites-accessible) — designated public-sector organizations and businesses/nonprofits with 50+ employees; WCAG 2.0 AA with stated exceptions. Aim for accessible use even where a particular threshold does not apply.
- [CRTC: CASL guidance](https://crtc.gc.ca/eng/com500/guide.htm) — consent basis, identification and unsubscribe requirements for commercial electronic messages, subject to applicable exceptions.
- [GitHub Pages hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) — visitor IP addresses are logged for security.

## Validation and release process

`npm run build` runs the local-target/metadata audit, version/count/icon consistency checks, and 15 privacy/source tests, then copies public files into `dist/`. The source remains dependency-free and GitHub Pages compatible. Internal fragment links were also checked and an obsolete duels anchor was corrected. The three missing optional social-image warnings for new pages are intentional; no new social artwork was requested.

Run `node scripts/release-check.mjs /path/to/VizanciaiOS /path/to/Vizancia-android` before each website release. It requires both checkouts to be clean, match their recorded revisions, and match their GitHub main branches. When a revision changes, review content/privacy/brand differences and update `data/app-releases.json`, relevant pages and dated notes together. Store status still requires a separate verification. CI does not access the private app repositories; this cross-repository gate runs in the owner's authenticated local environment.

The desktop AAB and mobile repositories were not modified. Public website deployment awaits review; the private Sites copy is for inspecting these proposed changes. Do not treat the private preview host's data flow as identical to GitHub Pages: the privacy copy describes the intended public vizancia.com deployment.
