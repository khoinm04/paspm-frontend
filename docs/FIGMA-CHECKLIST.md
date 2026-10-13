# Figma implementation state mapping

Source: [Untitled Figma design](https://www.figma.com/design/r5H6UtyItzPETFSSJiB4kA/Untitled). All 13 observed screen frames were exported and reviewed during the audit. The table records implemented UI/state coverage, not a claim of pixel-perfect fidelity or final browser approval. Final runtime and visual verification is recorded in [DELIVERY-REPORT.md](DELIVERY-REPORT.md); screenshots are in `artifacts/screenshots`.

| Reference frame / node | Export | Implemented route and state | Reproduction |
| --- | --- | --- | --- |
| Import POS Data – initial · 7:9 | `import-pos.png` | `/app/import` empty upload | Store role; open Import, or Cancel import |
| Import POS Data – warnings · 7:398 | `import-warnings.png` | `/app/import` warning batch/preview | Load warning sample; valid rows retained, invalid rows excluded |
| Import POS Data – rejected · 7:957 | `import-rejected.png` | `/app/import` schema rejection | Load rejected sample; issues, repair guidance and blocked continuation |
| Product Pairing Setup – data not ready · 7:1534 | `mining-no-data.png` | `/app/mining/setup` missing-data guidance | Expand Demo scenario controls and enable Preview the no-data state; actual missing usable imports also triggers it |
| Product Pairing Setup – invalid threshold · 7:2066 | `mining-invalid.png` | `/app/mining/setup` threshold validation | Enter an invalid algorithm/business threshold; save/start remains guarded |
| Mining Config – ready · 7:2615 | `mining-config.png` | `/app/mining/setup` valid ready configuration | System role; accepted seeded/imported data |
| Mining Results – discovered pairings · 7:3143 | `mining-results.png` | `/app/mining/results` populated output | Complete a simulated discovery run with permissive thresholds |
| Mining Results – no pairings · 7:3974 | `mining-empty.png` | `/app/mining/results` empty output | Complete a run whose utility/profit/exclusion settings remove all candidates |
| Recommendation Detail – evidence/placement · 7:4400 | `recommendation-detail.png` | `/app/recommendations/:id` | Store or Merchandiser role; open a pairing detail |
| Recommendation List – no groups · 7:4905 | `recommendations-empty.png` | `/app/recommendations` threshold/filter empty | Latest completed run with no qualifying candidates, or list filters with no match |
| Recommendation List – ranked · 7:5378 | `recommendations.png` | `/app/recommendations` populated list | Seeded list or eligible completed run; review and layout next steps |
| Mining Running – staged progress · 7:5964 | `mining-running.png` | `/app/mining/running` | Start discovery; transient six-second simulated execution |
| PlanogramIQ – Store Manager Login · 7:6421 | `login.png` | `/login` demo sign-in | Open sign-in; select one of the four supported demo roles |

## Deliberate adaptations

- Preserve the warm background, white panels, forest-green actions, warning/error states, sidebar/topbar and main/context-column hierarchy. Responsive layouts reflow the desktop-only source; there were no supplied mobile frames.
- Fix source clipping, text overflow and action-bar overlap. Desktop spacing is based on verified measurements and raster composition, with responsive adjustments.
- Replace the design’s illustrative 482,150-receipt/38-pair totals with counts derived from actual seeded/imported demo entities. No measured store outcomes are fabricated.
- Keep algorithm minimum utility separate from the simulated monthly profit target and catalog unit margins. Deterministic mining, benchmark and A/B outputs are labeled simulated.
- Warning imports exclude invalid rows and report issues. The implementation does not claim automatic timestamp/quantity repair that the source artwork depicts.
- CSV import is functional. Actual Excel/parquet decoding and external POS/cloud ingestion are outside scope; Excel uses an explicit sample simulation.
- Column mapping is a functional modal extension because no mapping frame was supplied. Review confirmation, route permission guidance and meaningful recovery actions extend source affordances.
- The detail blueprint is a concept schematic. Approval makes a pairing available to layout planning; campaign activation separately controls customer bundle visibility. Work orders download text; no actual PDF, staff dispatch or physical shelf alteration is implied.
- Supplied frames show one manager identity. The four requested roles use guarded navigation and role-specific mutation access; next steps belonging to another role explain the required switch.

## Supporting screens under approved Option A

Users/roles, integrations, products/categories, transactions, benchmarks, reports, overview, utility configuration, layouts, campaigns, A/B experiments and the customer market/product/bundle/cart flows have no dedicated supplied frames. Their implementations reuse the observed design language and shared components. They should be assessed for consistency and behavior rather than exact frame correspondence.

## Remaining visual limits

DM Sans was verified in Figma's typography inspector and is bundled locally using Fontsource. The six source product thumbnails, supermarket shelf photo and login background were exported from individual Figma layers (see ASSETS.md). Source product thumbnails are 108 × 108, so they look soft when enlarged in the design-extension storefront. Six additional catalog products use an original generic market-package illustration.

Sidebar links vary by role; demo controls, truthful metric totals, extra algorithm fields and accessible confirmations add some spacing and height compared with the static frames. The shelf blueprint is simplified. No pixel-perfect claim is made. Full-frame source PNGs are documentation only; all screens use interactive React controls.
