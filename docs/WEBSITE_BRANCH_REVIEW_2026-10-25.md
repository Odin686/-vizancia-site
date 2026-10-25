# Website repository consolidation, October 25, 2026

The owner requested that GitHub and local main be up to date and branches be
removed safely. The reviewed website main is `82ee1025d1370a969310554454976922b0297e03`;
the privacy repository main is `7f5841621a60bf27161552c7b63583ee746d75f5`.
The website and privacy-policy changes were already pushed and published.

## Local preview reconciled explicitly

The Desktop-only `codex/schools-passport-site` branch contains one unique commit,
`1f98f2a8894ae077a71fdad69512acb3dffbbc4c`, authored September 7. It includes
school/Passport demonstration pages, school artwork and offline classroom
materials, older release facts, and navigation/consent changes. It was never
published. It is not patch-equivalent to current main.

This consolidation preserves that complete commit as a merge parent while
retaining the current site's files. This is an explicit historical reconciliation,
not a claim that every preview feature was shipped:

- Current `teachers/` is the published classroom route; the separate `schools/`
  and Passport website demonstrations remain historical, recoverable from the
  preserved commit. They are not introduced by repository housekeeping.
- Current published 4.2 records and upcoming iOS/Android 4.3 disclosures supersede
  the preview's public 3.6 and upcoming 3.8 labels and exact marketing counts.
- Current synchronous v7 opt-in website measurement, canonical branded policy,
  withdrawal behavior and consent tests supersede the preview's older loader.
- Current homepage/navigation and generic catalog wording remain the design
  approved by the owner on October 25. No old navigation or release claims return.
- The preview's original files, assets and materials remain retrievable with
  `git show 1f98f2a:PATH` or by checking out that commit in an isolated worktree.

An `ours` strategy merge records this decision without combining obsolete
product files. Only this review record changes the current tree. The old local
branch may be deleted only after the preservation merge is reachable from
GitHub main and no worktree or open PR uses the branch.

## Remote branches eligible for deletion

Freshly fetched tips below were all reachable from main with zero unique
commits, no open pull requests, and no branch protection:

| Repository | Branch | Reviewed tip |
| --- | --- | --- |
| Website | agent/ios-website-consistency | 438714b50a7bc6fda7a9c627f519d8dbc1207424 |
| Website | claude/trusting-shannon-ohoy0g | 61774876cc0762386d7037121cbe1a2ef7a4744e |
| Website | codex/combined-google-tag-loader | 4ca2d7a5c60859ad90a768b07fc91b491943aa9b |
| Website | codex/privacy-wording-4-2 | 3dc03e55fb90b94eda11067441a1cb76491828df |
| Website | codex/website-engagement-tracking | d74cc99995cb456598382aa19de4ca0dcb5159bd |
| Privacy | claude/privacy-policy-audit-fjtk4l | bfdca1387ff1c5de8bcbeb873538bf25e4b5603e |
| Privacy | claude/privacy-policy-audit-s1kp9o | deaa2d4d06908cfd5d1d5c5ac8a0256255631acf |

Deletion rechecks current tips and ancestry. Main is never force-pushed.

## Validation

`npm run build` must pass for the preservation PR. This merge changes no
public HTML, assets, scripts or measurement behavior. The existing 26 tests,
release checks, app-disclosure synchronization and static build remain the gates.
The October 25 UI/content work separately passed the responsive audit of 33
pages across four widths. After merge, synchronize clean checkouts by fast-forward
and verify that both GitHub Pages deployments still reference their main tips.
