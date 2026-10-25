# Evidence to Action: classroom studio review

Prepared October 25, 2026. Review draft, not published to vizancia.com.

The owner asked to move from claim evaluation into solving a problem with AI
while retaining human judgment: report the contribution, question it, check it
independently, iterate and explain the final decision. The selected core uses
prepared AI exchanges plus an optional adult-operated demonstration.

The editable Figma file is:
https://www.figma.com/design/OOMZDMjhMC6ntGYMvnnd1I

It contains 29 editable publication frames, nine reusable print components,
semantic color variables and shared Inter text styles. Every frame was composed
as text, component instances and auto-layout groups, not flattened page images.
The initial cover passed font/layer checks and visual review. Figma's Starter
MCP quota was reached after all frames were composed. A subsequent cover band,
board grouping and spacing refinement did not execute and are not claimed as
applied. The frame/variable/component ledger is saved alongside this record.

PDF review copies are built with `scripts/build-classroom-studio.py` from
`data/evidence-to-action-studio.json`, using the same print content, typography,
palette and block vocabulary. Native Figma browser export was attempted but
could not be retrieved. The local files are not described as native Figma
exports. The renderer adjusts one writing area's height to keep the final
student page clear of the footer; text is not shrunk to fit.

The complete/teacher/student review PDFs contain 29/14/15 pages. They have
searchable text, embedded fonts, language metadata and bookmarks. They are not
PDF/UA tagged or fillable. All 29 pages were rendered and visually inspected.
Strict PDF parsing, page counts, source fidelity and teacher/student separation
were checked. The twelve original fictional evidence records remain unchanged.

The short baseline and independent first transfer response are kept separate
from coached revision. Feedback is descriptive; do not pool it with the older
0-8 rubric, infer causal gains or claim the programme is validated. The proposed
four-period timing requires an educator dry run. The broader Think First labs
and portfolio remain separate, unpublished work.

No public download, projection, mobile app or live-site file is changed by this
review. Publishing the new pedagogy would require aligning those materials;
this branch preserves it for review first.

Build using the existing PDF environment:

```sh
python scripts/build-classroom-studio.py
```

Outputs are ignored under `output/pdf/`; the current published edition remains
in `teachers/activity/`. Keep both editions distinct during review.
