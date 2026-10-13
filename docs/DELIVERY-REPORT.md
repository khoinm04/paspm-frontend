# PASPM frontend delivery

Verified on 2026-10-13 using Node 22.22.3, npm 10.9.8 and Playwright Chromium 1248. Approved scope: Option A, frontend-only with deterministic mock data.

## Implemented

The 13 inspected Figma frames map to interactive login, POS import (initial/warnings/rejected), mining setup (ready/no-data/invalid), running/results/empty discovery, and recommendation list/empty/detail states. `FIGMA-CHECKLIST.md` provides the exact node IDs, routes and reproduction steps.

Supporting screens reuse the same design system: overview, products/categories, transaction history, integrations, users, utility settings, benchmarks, reports, shelf layout editor, campaign preparation/activation, A/B simulation, storefront, product/related-product details, bundles and cart.

Shared React components cover forms, buttons, panels, metrics, badges, progress, dialogs, empty states and product-pair cards. The role selector controls route visibility; the asynchronous mock service also checks mutation permissions. Local storage persists shared entities, session storage persists the selected role, and Reset Demo Data restores the seed.

## Source of truth

Both layout and style URLs currently refer to the supplied file:
https://www.figma.com/design/r5H6UtyItzPETFSSJiB4kA/Untitled

Verified foundations include the warm #FAF8F5 page background, #1E3A2F primary green, white panels, subdued borders, 288 px source sidebar and DM Sans typography. Individual Figma image-layer exports are documented in `ASSETS.md`. Full-frame PNG references are documentation, not production interface assets. Supporting screens extend this design system under the approved scope.

## Final verification

| Check | Result |
| --- | --- |
| npm run typecheck | Passed |
| npm run lint | Passed |
| npm test | 25 passed across 4 files |
| npm run build | Passed; production output in dist |
| npm run test:e2e | 12 passed in 19.4 seconds |

The four role workflows passed: system configuration → discovery → benchmark; store product create/edit/archive → CSV import → transaction review → campaign activation; merchandiser review/approval → shelf placement → A/B simulation; customer product details → active bundle → basket quantity/removal. Additional coverage verifies malformed CSV/invalid thresholds, persisted connection state/reset, empty searches, and route scroll restoration.

Desktop 1440 × 900 and mobile 390 × 844 checks cover all 13 source states plus catalog/storefront. Browser assertions check document overflow, successful image loading, runtime page errors, and console errors on the Figma-state tours. Thirty full-page captures plus one preview are saved in `artifacts/screenshots`. Screenshots were visually inspected for source layout/color consistency, overflow and overlap. Native browser interactions also verified sign-in, warning import feedback and recommendation rendering.

Review found and fixed archive semantics, percentage/cents display, category filtering, current approval status, route permission guidance, layout editor identity, a missing favicon, retained route scroll, and connection status consistency. Final checks contain no failing tests.

## Remaining differences and scope limits

- Role-specific navigation, demo controls, algorithm fields, confirmations and truthful seed-derived totals change some spacing and screen heights. Layout/card hierarchy, palette and type system follow the supplied source; this is not a pixel-perfect reproduction claim.
- The source has desktop frames only. Mobile layouts reflow the same components; they are design extensions.
- Source product photos are 108 × 108 exports and look soft when enlarged in the storefront. Six additional products use a generic authored package illustration. Login's serif accent uses Georgia; UI vectors use Lucide.
- The shelf blueprint is a simplified concept diagram. Work orders are text downloads. No real staff dispatch or physical shelf change occurs.
- CSV parsing/mapping is functional. Excel is an explicitly labeled sample simulation; actual XLSX/parquet decoding is not included.
- HUI-Miner/EFIM jobs, benchmark estimates, A/B figures, POS sync and login are simulated. Frequency/confidence/lift/group-size/schedule preferences are saved; only utility/profit/category filters drive the demo candidate selector. Scheduling does not create real jobs.
- Local role checks are demo behavior, not production authorization. Backend API work, identity providers, external integrations, deployment and payment are outside approved scope.

## Backend replacement points

Typed DTOs live in `src/domain/models.ts`; asynchronous commands, persistence and mock invariants live in `src/services/demo.ts`; `src/state/DemoContext.tsx` binds snapshots and feedback to React. These are the adapter boundaries for future ASP.NET Core REST integration. `API-BOUNDARY.md` describes what must be replaced, including remote read states and real job progress. Shared UI and page composition are reusable.
