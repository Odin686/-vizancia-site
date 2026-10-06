# Website measurement setup

The production site uses one consent-controlled Google tag. Do not add a second
tag snippet or bypass the notice to satisfy a tag scanner.

## Destinations

| Setting | Value |
| --- | --- |
| Production hosts | `vizancia.com`, `www.vizancia.com` |
| GA4 property | Vizancia — `545697150` |
| Web stream | Vizancia Website — `15262203589` |
| Measurement ID | `G-Z5P9FY92DE` |
| Google Ads tag | `AW-18320211414` |

`assets/privacy-consent.js` uses `AW-18320211414` as the combined tag loader ID,
then configures both Analytics and Ads destinations. The former standalone
`G-Z5P9FY92DE` loader returns 404 after the tags were combined; do not switch the
loader back to that ID. Google code loads only after acceptance, including a
valid saved acceptance. Essential-only choices, withdrawal and Global Privacy
Control keep measurement disabled. Google Signals and personalised-advertising
signals remain disabled. Preview and localhost origins never load production
tags.

## Events and conversion goals

| Event | Meaning | Google Ads use |
| --- | --- | --- |
| `vizancia_engaged_visit` | Ten accumulated seconds with the page visible after consent; once per document | Base event only |
| `ads_conversion_engagement` | GA4 custom event derived from the engaged-visit base event | Primary website engagement conversion |
| `app_store_click` | Click to the iOS App Store after consent | Secondary observation; not an installation |
| `play_store_click` | Click to Google Play after consent | Secondary observation; not an installation |

In GA4 **Admin → Events → Create event**, edit the existing
`ads_conversion_engagement` definition for the website stream:

1. `event_name` **equals** `vizancia_engaged_visit`.
2. `page_location` **matches regular expression**
   `^https?://(www\.)?vizancia\.com(/|$)`.
3. Keep **Copy parameters from the source event** enabled.

Keep `ads_conversion_engagement` marked as a key event and imported into Google
Ads. Do not retain the previous `page_view` / `contains www.vizancia.com` rule:
it misses the canonical apex hostname and does not measure engaged traffic.

Website campaigns use campaign-specific **Engagements** goals. Store-click
actions remain secondary; app campaigns use their platform's installation
action instead. Android Google Play installs are primary and the duplicate
Android Firebase `first_open` action is secondary. The iOS campaign uses its
Firebase `first_open` action. Website code cannot verify an app installation.

Use **One** conversion per ad interaction for website engagement. Multiple
qualifying page views should not inflate the number of converted ad clicks.

## Release and validation

GitHub Pages publishes the repository root from `main`. Merge the website code
and save the matching GA4 rule as part of the same rollout.

1. Run `npm run build`. The privacy tests verify consent, refusal, GPC,
   withdrawal, production-host restrictions and visible-time qualification.
2. Verify the live page loads `privacy-consent.js?v=7` after Pages finishes.
3. In a browser without measurement blockers, connect Tag Assistant to
   `https://vizancia.com/`. Choose **Accept measurement** and keep the page
   visible for ten seconds. Verify both tag destinations and the
   `vizancia_engaged_visit` event. In GA4 Realtime/DebugView, verify the derived
   `ads_conversion_engagement` event as well.
4. Click each store link and verify its corresponding click event. A test visit
   without an ad click is not evidence of an attributed Google Ads conversion.
5. In a fresh consent state, verify **Essential only** loads no Google tag or
   measurement requests; verify the same with Global Privacy Control enabled.
6. Monitor GA4 collection and Google Ads conversion diagnostics after data has
   processed. New imported events may take time to appear in Ads reports.

Tag Assistant's automatic scanner may report no tag before consent or when a
browser blocker prevents Google requests. Do not weaken privacy controls to
make that scanner pass. A real post-consent event check is still required.

## App measurement and privacy wording

The iOS repository `Odin686/VizanciaiOS` was checked on October 6, 2026 at
`30939c80f8b30a3b63dc8963c19464e0d14bf401`, the source commit recorded for 4.2.
It contains no Firebase configuration file, SDK dependency, or initialization.
Its privacy manifest declares no tracking or collected data. Android source
has not been audited in this check. An imported Firebase conversion action in
Google Ads does not establish that either live app emits `first_open`.

The public copy describes the current 4.2 app separately from optional website
measurement. Website acceptance does not enable app analytics. Before an app
release adds Firebase Analytics, document the actual project, SDK, collected
events and identifiers, collection controls, retention, and platform-specific
attribution configuration. Update the matching app privacy notice, manifests,
store disclosures, and website copy in that release; verify collection on a
device. Do not announce Firebase as active solely because a conversion action
or Firebase project exists, and do not remove the current release's privacy
description to imply that an unshipped integration is already live.
