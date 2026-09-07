# School and Passport website review

Prepared 7 September 2026 on `codex/schools-passport-site`.

## Changes ready for review

1. **For schools:** a Grades 6–8, four-session “Can we trust this?” investigation, an interactive sample that asks for reasoning before revealing evidence and feedback, a teacher packet, projection slides and a complete offline download. Ontario/GTA pilot interest is an email link, with support scoped by a written quote.
2. **AI Passport:** six fictional decision examples, including working without AI, evidence and dated follow-ups. The demonstration collects no journal input and saves no selection. It explains the upcoming app feature, the Explain self-check and shared-device limitations.
3. **Availability:** a dedicated release page separates the verified public iOS 3.6 release, the public Google Play listing and upcoming 3.8 features. Preview counts and source commits are recorded in `assets/product-releases.json`. Existing 3.5 screenshots remain identified as historical.
4. **Focus:** homepage and Programs copy prioritise the app, teachers and school pilots. Other services remain discoverable at their existing prices. The site's colours, typography, homepage structure and hero images are preserved.

The branch starts at `1f2126e` and includes the existing Programs inquiry and page-loading improvements from PR #11. It does not change the iOS or Android apps. No inquiry has been submitted, school contacted, pilot booked or price invented.

## Preview

Serve the repository root:

```sh
python3 -m http.server 4187 --bind 127.0.0.1
```

- Homepage: <http://127.0.0.1:4187/>
- Schools and sample: <http://127.0.0.1:4187/schools/>
- Passport: <http://127.0.0.1:4187/passport.html>
- App availability: <http://127.0.0.1:4187/releases.html>
- School support and other services: <http://127.0.0.1:4187/programs.html>

Screenshots and test reports are saved locally under `output/website-preview-2026-09-07/` and excluded from Git.

## Validation completed

- `npm run audit`: 34 HTML pages, zero errors or warnings; release/content contract checks passed.
- `VIZANCIA_PREVIEW_URL=http://127.0.0.1:4187 npm run audit:responsive`: all 34 pages at 360, 390, 768, 1024 and 1440 pixels; zero reported errors or warnings.
- `npm run qa:schools`: reasoning gates and reset, six Passport choices and follow-ups, mobile menu and keyboard focus, inquiry preselection without submission, no-JavaScript fallbacks, unchanged demonstration storage, and offline slide navigation passed.
- Desktop and phone screenshots inspected. The responsive checks also cover tablets; this was Chrome emulation, not a physical-device or Safari certification.
- All local HTML fragments resolved. PDF and projection files are byte-identical to the app's authored materials; the offline ZIP contains those same files.

Browser checks require a recent Node.js with built-in WebSocket and Google Chrome at the macOS path used by the existing QA scripts. No new package dependency was added.

## Publication status

This is a local review build; these changes have not been pushed or published. Public availability was verified on 7 September 2026 and should be checked again before deployment. The supported pilot is an early offer, with no claim of school approval or completed pilot results.
