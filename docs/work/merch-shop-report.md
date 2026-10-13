# Merchandising and storefront implementation

Owned files: `src/pages/merchandising/PlanningPages.tsx`, `src/pages/shop/ShopPages.tsx`, `src/styles/extensions.css`.

Implemented layouts index and four-position shelf editor; approved recommendation library; drag/drop and keyboard/touch select/place; unique pairing placement; save draft and approve through service. Campaign creation targets approved layouts and activation/pause delegates role/invariant validation to service. A/B simulations use the service's deterministic results with explicit simulated provenance. Utility weight preferences are saved through service.

Storefront catalog is always available. Active campaigns provide approved bundle recommendations; complete pairing add sends all product IDs in one service action. Product detail, search/category filters, stock-aware single adds, cart quantity and removal controls are wired. No checkout or payment claim is made. Photos use `/assets/p1.png` through `/assets/p12.png`.

Visual evidence reviewed: `docs/figma-reference/recommendations.png`; extension pages adopt warm surfaces, thin neutral borders, forest-green controls and editorial grocery imagery. New screens extend the approved Option A language; no dedicated Figma frames exist for these screens.

Verification: initial `npm run typecheck` could not resolve root-owned `DemoContext`, shared UI or format modules, which were still being implemented. Their missing types caused downstream inference errors; final integration/typecheck and E2E are assigned to root. No browser tools or commits were used.

Expected routes: `/app/layouts`, `/app/layouts/new`, `/app/layouts/:id`, `/app/campaigns`, `/app/experiments`, `/app/utility`, `/shop`, `/shop/products/:id`, `/shop/bundles`, `/shop/cart`.

## Integration follow-up

Added `src/pages/auth/LoginPage.tsx` after reviewing the Figma login PNG. Login uses the root-provided background/CSS, PlanogramIQ identity, serif Kenji accent, full role selector and shared role landing map. Demo preset fields validate email format and a six-character minimum password; visibility, remembered-terminal explanation, credential recovery and SSO explanation are functional. No actual authentication is represented.

Updated utility controls to percentage weights (60/40 seed), automatically balancing to 100%. Live campaign layouts now show pause guidance before save.

Verification after shared modules arrived: `npm run typecheck` and `npm run lint` both passed with exit code 0.
