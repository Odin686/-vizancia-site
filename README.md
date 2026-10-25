# Vizancia website

This is a dependency-free static website for Vizancia. It can be hosted from the repository root (including GitHub Pages) without a build step.

## Structure

- `index.html`, `campus.html`, `learn.html`, `parents/`, `homeschool/`, and `programs.html` are the current marketing landing pages. `teachers/` supplies the free classroom pilot, and `releases.html` separates published 4.2 availability from the upcoming iOS and Android 4.3 (13) candidates. The Programs page presents guided workplace, family, homeschool, coaching, and web-only incubator offers through an email-based enquiry flow. The Campus and Learn & Train experiences use `assets/campus.css` and `assets/learn.css`; the parent experience keeps its layout and interactions in `parents/parents.css` and `parents/parents.js`.
- `resources/` is the AI Learning Hub. Pages share `resources/resources.css` and `resources/resources.js`, and research articles link to their primary sources.
- `about.html`, `methodology.html`, `editorial-policy.html`, `accessibility.html`, and `changelog.html` are technical trust pages.
- `assets/privacy-consent.js` and `assets/privacy-consent.css` are the shared website consent implementation (v7, Google Consent Mode v2, strict opt-in). The script pushes a denied consent default first, treats a Global Privacy Control signal as a refusal that overrides any saved acceptance, removes the legacy `vizancia_google_ads_consent` key, and stores the visitor’s choice under `vizancia_consent_v2` for 180 days. Only after “Accept measurement” does it load gtag.js (GA4 `G-Z5P9FY92DE` and Google Ads `AW-18320211414`, personalised-advertising signals and Google Signals disabled) and record `app_store_click` / `play_store_click` events; after ten consented seconds with the page visible, it sends one `vizancia_engaged_visit` event per page to GA4 only. Analytics must generate the imported `ads_conversion_engagement` key event from `vizancia_engaged_visit`, with the site URL matching both the apex and www hostnames (see `docs/MEASUREMENT_SETUP.md`). “Essential only” or withdrawal pushes a denied consent update and clears the first-party Google cookies. Withdrawal also disables GA4 and reloads a tagged page to unload Google code; other tabs and restored pages check for withdrawal. Production tags run only on vizancia.com and www.vizancia.com. It must never be loaded with `async` or `defer`. `scripts/privacy.test.mjs` enforces these guarantees in CI through `npm run build`.
- `sitemap.xml`, `robots.txt`, and `404.html` are deployment metadata and error handling.

## Publishing checklist

1. Update the visible review date and `sitemap.xml` when a page changes.
2. Keep product claims tied to a current app-store listing, screenshot, or internal release note. Do not add ratings, testimonials, credentials, or performance claims without verification.
3. For research-based articles, preserve the source link and identify the source’s audience, date, and limitations.
4. Test keyboard navigation, reduced motion, narrow mobile widths, the Website privacy link, and both store links before publishing.
5. Have the privacy policy, consent implementation, and terms reviewed by qualified counsel for the jurisdictions where you advertise.
6. Before accepting payment for a guided program, confirm the written scope, taxes, participant or licence limits, payment method, cancellation terms, third-party costs, and delivery details described on the Programs page.

## Visual direction

- Treat the Campus and virtual-world experience as the benchmark for the site's personality: playful, exploratory, and grounded in the real product.
- Prefer real app screenshots paired with world-building, pathways, and clear movement through the experience.
- Use original character art as guides or wayfinding, not as unrelated decoration.
- Keep the surrounding marketing layout clean and credible. Avoid templated status pills, excessive badges, generic AI imagery, and gratuitous glass or gradient effects.
- The Learn experience should visibly communicate its winding path of connected lesson nodes and the feeling of making progress through a journey.

## Maintainability roadmap

The site currently has repeated navigation and footer markup in legacy pages. The new resource and trust pages share a CSS vocabulary but remain plain HTML so they can deploy immediately. The next maintainability step should be a small static-site generator (Eleventy or Astro) with shared partials for navigation, footer, metadata, and consent. Migrate one page at a time, compare rendered output, then remove duplicated templates once the generated pages are verified.

## Release review

See [the September 2026 review](docs/WEBSITE_REVIEW_2026-09-13.md) for verified facts, remaining owner/legal decisions, and the cross-repository release gate. `data/app-releases.json` records iOS and Android separately. Run `npm run build`; GitHub Actions runs this same gate for pushes and pull requests. The root remains deployable on GitHub Pages; `dist/` is the allowlisted private-preview output and excludes internal review documents and tooling.


## App and website consistency

The October 17 iOS candidate includes FirebaseCore and FirebaseAnalyticsCore
12.19.2. Collection is off by default and requires explicit 18+ own-personal-use
consent, completed onboarding, the high band, exactly one profile and Classroom
Mode off. Website consent and Google Ads goals do not grant that app consent.
The app sends fixed tab names and SDK technical metadata after opt-in, never
learning records, responses or local profile IDs. Live event receipt is still
unverified. Public iOS 4.2 availability was checked against Apple's lookup API
on October 17; the iOS 4.3 candidate has not been uploaded or submitted.
Android 4.3 (13) source parity was reviewed on October 25. Both candidates remain unsubmitted; this is not a new store or live-analytics verification. Android uses app-private WebView storage, independent withdrawal markers and the Android share sheet, with automatic app backup disabled.

The app owns its privacy wording. This site owns website measurement, support,
program and Sandbox disclosures. To refresh the shared iOS text:

1. In the iOS checkout, run `python3 Scripts/export_website_disclosures.py /path/to/website/data/ios-app-disclosures.json` after reviewing the app policy.
2. In this checkout, run `npm run sync:ios`, then `npm run build`.
3. Review candidate counts and delivery status in `data/app-releases.json` and
   the visible release and landing pages. Do not change the published iOS or
   Android records just because a candidate or Firebase project exists.
4. From the iOS checkout, run the same export command with `--check` to prove
   that the website JSON still matches the Swift source.

`npm run build` rejects stale shared iOS HTML, obsolete no-analytics-SDK claims,
unsubmitted 4.3 availability claims and differences between visible support
answers and their structured FAQ metadata. The JSON contains public disclosure
text and provenance only; do not copy app source, internal documents or learner
records here. The separate GitHub Pages learning site has no measurement script;
vizancia.com retains its existing strict opt-in Analytics and Ads implementation.

## October 25 website copy review

Public privacy destination: https://vizancia.com/privacy.html. The separate
Vizancia-privacypolicy repository retains both legacy URLs as redirects with a
readable link fallback. This changes the visitor-facing destination, not the
website hosting provider; GitHub Pages security logs remain disclosed.

Homepage claims use “100+ lessons” and generic game/path wording. Dated release
snapshots retain their historical counts. Adjust the reviewed lower-bound claim
if the library falls below 100 lessons. Candidate source references are separate
from published store records; optional local release checks compare main with
the candidate references, not with the older published source commits.

## Evidence to Action classroom publication

The October 25 teacher resource uses the professional **Evidence to Action**
print template. The original download URL remains compatible, serving the
20-page complete packet. Separate 11-page teacher and 9-page student exports
are linked on the teacher page. The projection's browser title matches the
publication; its fictional case records, slide sequence and behavior are
unchanged. The native apps keep their existing case title.

`data/evidence-to-action.json` preserves the canonical Trust case and selected
teaching examples from the October 18 local educator beta, with source hashes.
This focused publication does not replace or claim delivery of the broader,
unpublished eight-stage Think First programme or its optional labs/portfolio.
The original case evidence remains unchanged. Baseline and transfer first
responses precede substantive feedback; supported revision stays separate.

Rebuild using a Python environment with `scripts/requirements-pdf.txt`, then run:

```sh
python scripts/build-evidence-to-action.py
```

Outputs are in `output/pdf/` (ignored). Copy the complete packet to
`teachers/activity/can-we-trust-this-pilot.pdf`, and the teacher/student PDFs to
the same public directory. Render all pages with `pdftoppm`; inspect spacing,
tables, evidence, answer separation and writing areas before publishing. The
fonts and reusable layout source are in `scripts/pdf_assets/` and the builder.
Website behavior still passes through `npm run build`.
