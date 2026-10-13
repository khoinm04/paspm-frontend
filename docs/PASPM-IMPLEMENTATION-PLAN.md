# PASPM implementation proposal

Date: 2026-10-12. **Option A approved by user; implemented as a frontend-only demo. See README and FIGMA-CHECKLIST for final scope and verification.**

This is the concise approval plan requested in Phase 2 of the brief. [PASPM-AUDIT.md](PASPM-AUDIT.md) contains the actual Figma inventory and known limitations. Once approved, execute in this chat in the order below, expanding each task into concrete implementation/test steps before changing code.

## Goal and recommended scope

Deliver a frontend-only PASPM demo covering all four roles. Reproduce the 13 observed Figma frames as reusable route states, then extend the same visual system to missing modules. Keep explicit evidence tags in the delivery checklist: `Figma-derived` or `Design extension`. No payment, shipping, fulfillment, real authentication, actual HUI mining, or external messaging.

Preserve the reference's English copy and PlanogramIQ brand initially; PASPM remains the project/domain name. Use $ amounts as shown in the reference with one consistent formatter. Demo indicators must remain visible even where the original says live/actual/verified.

## Architecture

Use React + TypeScript + Vite, React Router, Tailwind CSS with extracted CSS variables, and Lucide React. Use custom reusable components where they fit the Figma, adding accessible primitives only when needed. Use React context/reducers and focused hooks; do not add a second state-management stack. Lock installed package versions and document the Node version actually tested.

Proposed file responsibilities:

| Path | Responsibility |
| --- | --- |
| `src/app/router.tsx`, `src/app/permissions.ts` | Routes, actor capabilities, direct-route access checks |
| `src/app/providers.tsx` | Mock session, service dependency and demo state |
| `src/layouts/AdminLayout.tsx`, `src/layouts/StorefrontLayout.tsx` | Role-aware shell, mobile navigation, header, content boundaries |
| `src/components/ui/` | Buttons, inputs, select, dialog, badges, alerts, tables, empty/loading states |
| `src/components/domain/` | Import stepper, pairing card, metrics, mining progress, layout slots |
| `src/pages/auth/`, `system/`, `store/`, `merchandising/`, `shop/` | Route-level composition; no direct localStorage writes |
| `src/domain/` | IDs, typed entities, status transitions, validation and service contracts |
| `src/mocks/fixtures/` | Deterministic, linked users/products/transactions/jobs/recommendations/campaigns |
| `src/services/` | Promise-based service interfaces and mock implementations |
| `src/state/`, `src/hooks/` | Subscriptions, async state, cancellation, demo session |
| `src/styles/tokens.css`, `src/styles/global.css` | Verified design values, semantic roles, responsive rules |
| `public/assets/`, `public/demo/` | Original exported assets and valid/warning/invalid import fixtures |
| `tests/unit/`, `tests/components/`, `tests/e2e/` | Vitest, React Testing Library and Playwright |
| `docs/`, `artifacts/screenshots/` | Setup, frame checklist, API mapping, validation evidence |

Mock services accept typed DTOs and return Promises. Components receive loading/success/empty/error states through hooks. Mock persistence sits behind a repository adapter; replacing it with ASP.NET Core REST calls must not require rewriting pages.

Use versioned localStorage for demo domain state. Persist session selection separately; never persist a real password. Seed once, keep IDs stable, validate stored schema, and provide Reset Demo Data with confirmation. Reset removes only PASPM-owned keys, cancels pending simulations, and restores the exact seed. Recover gracefully if localStorage is unavailable or corrupted.

## Domain and consistency rules

- Money: integer cents plus currency; counts: integers. Store formula results separately from original prices/costs.
- Product/category records are shared by imports, recommendations, layout slots and cart. Prevent destructive deletion when a record is referenced; allow archiving instead.
- An import batch links to its validated transactions and issues. Failed import never silently enables mining.
- Mining config separates `algorithm`, `minUtility`, optional schedule, and merchandising filters such as projected profit target, confidence and lift.
- Mining jobs follow queued → running → completed/failed/cancelled. Guard duplicate starts, cancellation, reset, background navigation and refresh.
- HUI patterns are fixtures with explicit simulated provenance, utility values and linked products. Recommendations link back to patterns and evidence. Do not implement HUI-Miner/EFIM in the browser.
- Recommendations follow pending → approved/rejected. Approved records may be placed in a draft layout; Store Administrator activates an approved, valid campaign.
- A/B simulation uses deterministic inputs and labeled fixture/formula outputs. Display sample size and simulation assumptions; never claim causal or production results.
- Only active campaigns feed the storefront. Bundle add-to-cart updates all constituent products atomically and validates stock. Cart reflects the same catalog prices and quantities.

## Role and route scope

| Role | Routes and capabilities |
| --- | --- |
| System Administrator | `/app/users`; `/app/integrations`; `/app/mining/setup`; `/app/mining/jobs`; `/app/mining/jobs/:id`; `/app/mining/jobs/:id/results`; `/app/benchmarks` |
| Store Administrator | `/app/products`; `/app/categories`; `/app/import`; `/app/transactions`; `/app/integrations` (store connection/status); `/app/campaigns`; `/app/reports` |
| Merchandiser | `/app/utility`; `/app/recommendations`; `/app/recommendations/:id`; `/app/layouts`; `/app/layouts/:id`; `/app/experiments`; read access to mining evidence |
| End-Customer | `/shop`; `/shop/products/:id`; `/shop/bundles`; `/shop/cart` |
| Shared | `/login`; role picker; reset action; not-found and unauthorized views; `/app/overview` with role-appropriate demo data |

Permissions are capabilities evaluated both by routes and service mutations. Demo switching changes the active actor and redirects to an allowed landing route. These checks demonstrate workflow restrictions; they are not real security.

## Ordered implementation tasks and acceptance

### 1. Reference assets, shell and demo navigation

- [ ] Confirm remaining font/asset details when browser approval is available; record original exports with provenance and local paths. Do not substitute full-screen screenshots for UI.
- [ ] Scaffold project and scripts for `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- [ ] Implement tokens, reusable controls, login, sidebar/header, route guards, role picker and mobile drawer.
- [ ] Compare the import and mining shell against source at 1280 px and at the required 1440 × 900 viewport. At 390 × 844, stack content and expose keyboard-accessible mobile navigation. Mobile behavior is a documented design extension.
- [ ] Verify direct-route role restrictions and that focus is restored after dialogs/drawers close.

### 2. Mock repository and service boundary

- [ ] Implement models, linked fixtures, persistence/reset and common async error handling.
- [ ] Add unit tests for corrupt storage recovery, selective reset, permission checks, referenced-product archiving and reproducible seeds.
- [ ] Verify all summary counters derive from actual fixtures or visibly labeled simulated aggregates. No random values during render.

### 3. Catalog, import and connections

- [ ] Build validated product/category CRUD; search, sorting, pagination and empty states.
- [ ] Reproduce import initial/warning/rejected states, preview, issue export, sample download and retry.
- [ ] Provide local CSV parsing and validation. For Excel, offer an explicitly labeled demo simulation with provided fixture selection; do not claim to parse arbitrary workbooks without adding and testing a parser. Parquet is shown in the reference but unsupported input must return a clear error.
- [ ] Validate receipt ID, SKU, positive quantity, parseable timestamp and numeric money fields. Warnings/corrections must match the displayed rows. A column-mapping form is a design extension.
- [ ] Mock API connection form, sync status, scheduled configuration and history. No external API credentials or calls.
- [ ] Test successful import, warning import, missing columns, invalid values, empty file, unsupported extension and oversized file; then verify mining readiness changes only after acceptance.

### 4. Mining setup, execution and benchmark

- [ ] Implement setup's ready/no-data/invalid-target states and all visible rule controls.
- [ ] Add algorithm selector, minUtil and schedule controls as design extensions; keep them distinct from projected profit target.
- [ ] Implement deterministic staged execution, cancellation/background behavior, history and completed/empty/error results.
- [ ] Implement benchmark comparison for the same dataset/config: duration, memory and itemset count, all labeled Simulated.
- [ ] Test invalid configuration blocks execution; cancellation stays cancelled; navigation preserves execution; identical inputs reproduce results; strict filters produce the expected empty result.

### 5. Recommendations and evidence

- [ ] Reproduce ranked list, empty list, results pair cards, pagination and detail/evidence/blueprint.
- [ ] Implement filters/search/sort, approve/reject with visible status, preset recovery, mock task sheet/export and navigation to layout.
- [ ] Implement utility formula/priority configuration with validated coefficients and a deterministic preview as a design extension.
- [ ] Test no-result filter recovery, stable pagination, approval propagation, rejected recommendation exclusion and shared product details.

### 6. Layout, campaigns and A/B simulation

- [ ] Build a layout editor with a recommendation palette, defined placement slots, drag/drop, keyboard move controls, save and preview. This is a design extension informed by the evidence blueprint.
- [ ] Prevent overlapping/invalid placement and placement of rejected recommendations. Touch users can select and place through accessible controls.
- [ ] Implement draft/review/approved/active campaign states and activation confirmation. Only authorized Store Administrator can activate.
- [ ] Implement A/B setup, deterministic simulation, comparison metrics and clear assumptions.
- [ ] Test approval → placement → saved layout → campaign activation and rejected/invalid paths, including refresh persistence.

### 7. Storefront and cart

- [ ] Create the missing storefront, product detail, bundle listing and cart with the same palette/type/components.
- [ ] Show products and merchandising from the active mock campaign; provide deliberate empty states when no campaign is active.
- [ ] Implement quantity controls, product add-to-cart, whole-bundle addition, removal, subtotal and stock feedback. Stop at the cart; no checkout/payment flow.
- [ ] Test atomic bundle addition, repeated additions, unavailable products and correct totals after edits/removal.

### 8. Cross-role QA and delivery

- [ ] Playwright: System Administrator configures algorithm/minUtil, starts a simulated job and views results/benchmark.
- [ ] Playwright: Store Administrator edits a product, imports a valid and an invalid CSV, and activates an approved campaign.
- [ ] Playwright: Merchandiser approves a recommendation, places it in a layout, runs an A/B simulation and reviews metrics.
- [ ] Playwright: End-Customer opens a product, adds a bundle and verifies every cart item and total.
- [ ] Add cross-role persistence, reset, direct-route permissions, loading/error recovery and empty-data checks.
- [ ] Capture and review route/state screenshots at 1440 × 900 and 390 × 844; also use 1280 px for source-width comparisons. Check overflowing pages, overlapping action bars, focus/labels, console errors and failed local assets.
- [ ] Run build, lint, typecheck, unit/component tests and E2E; fix failures and rerun affected checks.
- [ ] Deliver README commands, test results, all screenshot paths, frame-to-page checklist, mock/API adapter documentation, and explicit visual deviations/remaining limitations.

## Decisions to approve

Approve **Option A**: recreate supplied frames and extend the same design language for missing four-role workflows, retain current reference branding, fix source clipping, and adapt to mobile. This is the smallest complete scope that can satisfy the original definition of done with the supplied Figma file.

If Option A is not approved, Option B limits the first delivery to supplied frames or Option C waits for additional designs. Neither is represented as completion of the original four-role task.
