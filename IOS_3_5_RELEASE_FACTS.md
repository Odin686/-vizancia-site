# Vizancia iOS 3.5 release facts

Verified July 16, 2026 against `Odin686/VizanciaiOS` commit `cda28fe` (`3.5.0`, build `4`). These facts describe the iPhone and iPad codebase. Do not apply them to Android without checking the Android release separately.

## Public product facts

- 16 learning categories
- 96 lessons
- 580 authored questions across six interaction types
- 17 registered mini-games: Speed Round, AI Pairs, Buzzword Buster, Jargon Match, AI Timeline, Fact or Fiction, Who Made It?, Word Scramble, Falling Words, Memory Grid, AI Word Matrix, Prompt Builder, AI Startup, Token Budget, Neural Assembly, Circuit Slide, and Self-Driving Sprint
- Separate hands-on activities: Prompt Lab and Train the Robot
- 12 XP levels and 28 local achievements
- Four grade-band settings (K–2, 3–5, 6–8, and 9–12) plus an Adult / Lifelong Learner onboarding choice
- Primary design target: grades 6–8; public marketing should use “best suited to learners 10+” rather than promising fully rewritten experiences for every grade band
- Minimum deployment: iOS 17.0 and iPadOS 17.0

## Privacy and availability boundaries

- Core lessons, games, Campus, avatar, simulations, and progress work offline on iOS 3.5.
- No Vizancia account, third-party analytics SDK, advertising SDK, chatbot, or live AI-service call is present in the iOS app.
- An optional first name or nickname can be entered during onboarding. It stays on the device and can be left blank.
- Global Game Center leaderboards and online duels are optional and limited to profiles that explicitly select Adult / Lifelong Learner. Student grade selections do not enable them.
- The online AI Sandbox is a website-only limited beta. It is not included in the offline iOS app.
- The iOS target has no widget extension. Do not claim widget support.
- French, Spanish, and Portuguese resources exist, but the repository translation audit did not pass on July 16. Do not advertise complete four-language support until the audit passes and the store metadata exposes those localizations.
- The public Canadian App Store page still showed version 3.4.1 when checked on July 16. Website copy may describe the submitted 3.5 release, but should tell visitors to check the version currently shown by their App Store during processing or rollout.

## Maintenance

Before changing a count or platform claim, verify it in the current app source and update this file, the marketing page, the changelog, and any stale-claim guard in `scripts/audit-site.mjs` together.
