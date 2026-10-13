# PASPM — repository and Figma audit

Date: 2026-10-12. Status: reference review complete; exact typography/assets partly unverified; implementation not started.

## Repository

The supplied FE directory was empty. No package manifest, source code, installed project dependencies, tests, Git repository, or applicable ancestor AGENTS.md was found. The files now present are audit documents and exported references created during this task.

## Evidence and access

Layout/style source: https://www.figma.com/design/r5H6UtyItzPETFSSJiB4kA/Untitled

Figma MCP returned its Starter-plan call-limit error. Direct browser access subsequently worked, first as a guest and later with the editable property panel visible. Page 1 contains 13 screen frames and one separate logo layer.

All 13 screen frames were copied through Figma's own Copy as PNG command, saved in `docs/figma-reference`, and visually reviewed. `manifest.json` records file dimensions, sizes, and SHA-256 hashes; all 13 PNGs decode and have distinct hashes. These are source references, not screenshots of an implemented application. Raster bounds may include shadows and overflowing layers and must not be treated as CSS frame dimensions.

The final attempt to inspect heading properties was not executed: automatic browser approval review could not complete because the account reached its usage limit. No workaround was attempted. Font family, exact type scale, component radii, and original standalone assets still need verification. Attempts to export a PDF and copy CSS did not yield usable local artifacts; no claim relies on those outputs.

## Screen inventory and proposed route mapping

Names below are observed Figma frame names. Roles and routes are proposed PASPM mappings, not Figma-specified permissions. Every page implementation is pending.

| Figma frame | Node | Proposed route/state | Proposed actor | Local reference |
| --- | --- | --- | --- | --- |
| Import POS Data - Natural Earthy Theme (Desktop) | 7:9 | `/app/import` — initial upload | Store Administrator | [PNG](figma-reference/import-pos.png) |
| Import POS Data - Second State (AF-01: Warnings Detected) | 7:398 | `/app/import` — validation warnings/preview | Store Administrator | [PNG](figma-reference/import-warnings.png) |
| Import POS Data - Third State (EF-01: File Rejected - Natural Theme) | 7:957 | `/app/import` — rejected file | Store Administrator | [PNG](figma-reference/import-rejected.png) |
| Product Pairing Setup — Transaction Data Not Ready | 7:1534 | `/app/mining/setup` — missing transactions | System Administrator; read-only guidance for Store Administrator | [PNG](figma-reference/mining-no-data.png) |
| Product Pairing Setup — Invalid Threshold | 7:2066 | `/app/mining/setup` — invalid threshold | System Administrator | [PNG](figma-reference/mining-invalid.png) |
| Mining Config — Clean & Minimalist (Basket Analytics) | 7:2615 | `/app/mining/setup` — ready | System Administrator; merchandising rules separately editable by Merchandiser | [PNG](figma-reference/mining-config.png) |
| Mining Results — Discovered Product Pairings (Natural Earthy Theme) | 7:3143 | `/app/mining/jobs/:id/results` — results | System Administrator; Merchandiser | [PNG](figma-reference/mining-results.png) |
| Mining Results — No Pairings Found (Adjust Threshold) | 7:3974 | `/app/mining/jobs/:id/results` — empty | System Administrator; Merchandiser | [PNG](figma-reference/mining-empty.png) |
| Recommendation Detail — Pairing #01 Evidence & Placement Plan | 7:4400 | `/app/recommendations/:id` | Merchandiser; Store Administrator read-only | [PNG](figma-reference/recommendation-detail.png) |
| Recommendation List — AF-01 (No Product Groups Met Threshold) | 7:4905 | `/app/recommendations` — empty | Merchandiser | [PNG](figma-reference/recommendations-empty.png) |
| Recommendation List — Ranked Product Pairings (Clean Natural Theme) | 7:5378 | `/app/recommendations` — ranked list | Merchandiser | [PNG](figma-reference/recommendations.png) |
| Mining Running — Discovering Product Pairings (Natural Earthy Theme) | 7:5964 | `/app/mining/jobs/:id` — running | System Administrator | [PNG](figma-reference/mining-running.png) |
| PlanogramIQ — Store Manager Login (Organic Minimalist) | 7:6421 | `/login` — demo sign-in | All roles via additional demo selector | [PNG](figma-reference/login.png) |

Additional observed layer: PlanogramIQ Logo. Its original SVG/image has not been exported separately.

## Shared shell and verified visual facts

The displayed brand is **PlanogramIQ**, with English UI copy, a pale warm background, white panels, dark forest-green primary actions, warm neutral borders, and orange/red warning states. Login uses a grocery-store photograph, pale overlay, centered form, and a serif accent for the person's name. Main application screens use a left sidebar, header search, store connection indicator, notifications, user identity, breadcrumbs, and long scrolling content.

Observed sidebar entries:

1. Overview & Health Score
2. Shelf & Planogram Map
3. Import POS Data
4. Basket Analytics
5. Settings & Integration

The sidebar also includes a store selector and an ingestion-health footer. Basket Analytics is the active group throughout the mining/recommendation flow.

| Property | Evidence | Status |
| --- | --- | --- |
| Import POS frame width 1280 px; height 1619 px | Figma property panel on node 7:9 | Verified |
| Main frame left padding 288 px | Figma property panel on import/config frames | Verified; sidebar allowance |
| Import top header 992 × 64 px at x=288 | Figma property panel on node 7:311 | Verified for this frame |
| Header horizontal padding 32 px | Same header property panel | Verified |
| Header white fill at 90% | Same header property panel | Verified |
| Header border `#E4DFD5`, 1 px inside | Same header property panel | Verified |
| Import background `#F7F5F0` | Frame property panel | Verified |
| Mining background `#FAF8F5` | Frame property panel and exported pixels | Verified |
| Primary green `#1E3A2F` | Sidebar layer name explicitly includes the hex; matching major raster color | Strong evidence; fill panel not inspected |
| White `#FFFFFF`, neutral `#E7E2D8`, text `#191C1B`, muted `#707973` | Frequent colors sampled from Mining Config PNG | Raster evidence only; proposed semantic assignments |
| Sans-serif body; serif accent on login | Visual inspection | Family/weights/sizes unverified |
| Main column plus narrower context column; four metric cards | Visual inspection of relevant screens | Verified composition; exact grid gaps unverified |
| Mobile layouts and breakpoints | No mobile frames present in the observed page | Implementation adaptation required |

The component inventory includes sidebar items, search fields, store selectors, status pills, breadcrumbs, progress steppers, file drop zones, validation banners, preview tables, number inputs, preset buttons, switches, exclusion chips, progress bars, metric cards, recommendation pair cards, filters, sorting, pagination, evidence panels, placement diagrams, and bottom action bars. No complete dialog/hover/focus variant library was identified.

## Observed workflows

- **Import:** CSV/Excel upload, sample/template download, quality summary, repaired-data warnings, data preview, fatal schema errors, error-log export, re-upload, column-mapping continuation, mock POS/cloud connector actions.
- **Setup:** receipt readiness; minimum profit target; $800/$1,200/$2,500 presets; sales frequency, confidence and lift; pair/trio/family size; cross-department toggle; excluded staples; save/reset preset; dry run; start discovery.
- **Running:** staged progress, elapsed/remaining estimates, live pairing feed, background execution and cancel controls.
- **Results:** search, category filters, sorting, pagination, pair evidence, placement recommendation, approval, export, rerun, and empty-result recovery through threshold presets.
- **Recommendations:** ranked cards, approval progress, detail view, supporting evidence and shelf-placement blueprint, simulated approval/dispatch/work-order export.
- **Login:** email/password, password visibility, remember-terminal, recovery and SSO affordances. All must remain demo behavior.

## Differences and missing scope

1. All visible screen identities describe a Store Manager. The user brief requires System Administrator, Store Administrator, Merchandiser, and End-Customer. Role mapping above is an implementation proposal.
2. No dedicated frames were found for users/roles, product/category CRUD, algorithm benchmarking, scheduling, utility-formula configuration, campaign management, A/B simulation, storefront, product detail, bundles, or cart.
3. Shelf & Planogram Map exists in navigation and the detail screen includes a shelf blueprint. A complete drag-and-drop editor is not designed in the supplied frames.
4. Column Mapping is a step/CTA but has no separate frame.
5. The brief uses PASPM while the file uses PlanogramIQ. Default proposal: preserve visible PlanogramIQ branding for fidelity; use PASPM in project documentation until a rebrand is requested.
6. The design's profit target and association measures (frequency/confidence/lift) must not be silently equated with HUI algorithm minUtil. Model these separately and identify all derived metrics as simulated.
7. Several source layouts have cropped store/product labels, overflowing text, action bars overlapping content, or content extending outside the frame. Preserve hierarchy and appearance while fixing clipping/overlap in the responsive implementation; document those deliberate differences.
8. Figures such as 482,150 receipts, 142 mining pairs and 38 recommendations are design examples, not a real dataset. Use coherent seeded entities and derive demo totals; do not imply actual mining of those counts.
9. Photo/icon/brand assets are embedded in reference PNGs but have not been exported as implementation assets. Full-screen PNGs must never replace interactive UI. Exact assets and font verification remain outstanding.
10. Figma displays a Missing fonts control. Browser-rendered text may contain substitutions; do not claim the rendered font is the original font.

## Scope options

**A — Complete the four-role demo using this design language (recommended).** Recreate all 13 reference states, then create the missing screens with the same shell/tokens/components. Label frame-derived and newly designed pages separately in the checklist. This satisfies the requested workflows but needs approval for the missing screen designs.

**B — Implement only supplied frames first.** Highest immediate design certainty, but it does not meet the full four-role definition of done. Additional designs or a later scope decision would still be needed.

**C — Wait for additional Figma frames for the missing modules.** Strongest visual specification across every role, but implementation of the full scope must wait for those references.

## Current checklist

- [x] Inspect repository and existing constraints.
- [x] Attempt Figma MCP and establish a working browser alternative.
- [x] Inventory all 13 supplied screen frames.
- [x] Export, save, and visually review all 13 references.
- [x] Record verified shell measurements and color evidence.
- [x] Map observed states to proposed routes and roles.
- [x] Identify unrepresented workflows, visual defects, and asset limitations.
- [x] Prepare a reviewable implementation proposal.
- [ ] Receive scope/plan approval required by Phase 2 of the user's brief.
- [ ] Finish exact typography and individual asset extraction.
- [ ] Implement and verify the application.

No application has been scaffolded. Build, lint, typecheck, unit tests, E2E tests, and implementation screenshot comparisons have not run.
