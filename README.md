# PASPM / PlanogramIQ frontend

A React + TypeScript + Vite demo of product association, shelf planning and merchandising across four roles. The interface retains the PlanogramIQ branding and natural palette of the supplied Figma file. Approved scope Option A includes the supplied screens plus supporting workflows designed in the same visual language.

## Run locally

Requires Node.js 22 or later and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). Sign in through `/login` or select a demo role in the header. The local sign-in is an interface simulation; it does not create a real authenticated session.

```sh
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run preview
```

For a fresh Playwright installation, run `npx playwright install chromium` before E2E tests. Component/service tests use Vitest and Testing Library. E2E tests exercise the role workflows through the browser. Build and final verification results are reported separately from these setup instructions.

## Four role workflows

| Role | Landing page | Main responsibilities |
| --- | --- | --- |
| System Administrator | `/app/mining/setup` | Mining configuration and simulated execution, algorithm benchmark, users/roles, connections and utility settings |
| Store Administrator | `/app/import` | POS import, product/category management, transaction review, recommendation approval, campaign activation and reports |
| Merchandiser | `/app/recommendations` | Pairing review, shelf layouts, utility weights, campaign preparation and simulated A/B experiments |
| End-Customer | `/shop` | Catalog/product browsing, active recommended bundles and a stock-validated cart |

1. **Store data:** Choose Store Administrator. In Import POS Data, load a valid or warning sample, or browse/drop a CSV. Confirm column mapping. Review imported transactions, products and categories. Missing headers/no usable rows produce rejection; warning batches retain valid rows and exclude invalid rows with an issue log.
2. **Discover pairings:** Choose System Administrator. Configure algorithm minimum utility separately from the simulated merchandising profit target. Run discovery and inspect progress/results. High thresholds can produce a meaningful empty state; lower thresholds and rerun. Benchmark estimates are explicitly simulated.
3. **Plan and activate:** Choose Merchandiser. Open a recommendation, approve it and confirm the review. Assign approved pairings to a shelf layout and approve the layout. Prepare a campaign. Choose Store Administrator to activate an approved campaign. A/B experiments generate synthetic conversion/revenue outcomes; reports label them accordingly.
4. **Shop:** Choose End-Customer. Browse products and active campaign bundles, add products to the cart and change quantities. Stock constraints and prices come from the shared catalog. Bundle approval alone does not publish a customer recommendation; campaign activation does.

Roles have guarded routes and service-level mutation checks. A role switch changes the available workspace. Where a next step belongs to another role, use the header selector.

## Routes

Operational routes are under `/app`: `overview`, `import`, `transactions`, `products`, `categories`, `mining/setup`, `mining/running`, `mining/results`, `recommendations`, `recommendations/:id`, `layouts`, `layouts/new`, `layouts/:id`, `campaigns`, `experiments`, `utility`, `users`, `integrations`, `benchmarks` and `reports`. Customer routes are `/shop`, `/shop/products/:id`, `/shop/bundles` and `/shop/cart`. Unknown routes show recovery guidance.

## Data and scope

The seed includes a 12-product catalog, recommendations, a shelf layout, an approved campaign, users and simulated connections. Demo mutations persist in browser local storage; the selected role persists in session storage. **Reset Demo Data** restores the seed. No backend, real account authentication, POS connection, credential storage, real mining algorithm, production deployment or payment processing is included.

CSV input uses `receipt_id,sku,quantity,price,timestamp`, catalog SKUs, positive integer quantities, dollar sale prices and valid timestamps. The application stores money in cents. Uploads support CSV up to 50 MB. Excel is a labeled sample simulation; export an actual workbook to CSV first. Downloads provide templates, issues, merchandising sheets and work orders.

Discovery uses deterministic seeded recommendations filtered by configuration. Utility values are demo numeric units; recommendation lift and profit target represent simulated aggregate dollar values. These are distinct from catalog unit margins. Benchmarks and A/B outcomes are synthetic; the interface does not present them as measured algorithm/store performance.

## Design evidence

See `docs/PASPM-AUDIT.md` for the source audit and verified observations; `docs/FIGMA-CHECKLIST.md` maps all 13 exported reference states to implemented routes. The original frames are in `docs/figma-reference`, with an export manifest. Supporting modules have no supplied Figma frames and were designed under approved Option A. DM Sans and eight source image assets are bundled locally; see `docs/ASSETS.md`. Visual adaptations are documented in the frame checklist. This project makes no pixel-perfect fidelity claim.


## Source of truth and verification

Layout source: https://www.figma.com/design/r5H6UtyItzPETFSSJiB4kA/Untitled

Style/color source: https://www.figma.com/design/r5H6UtyItzPETFSSJiB4kA/Untitled

Both currently point to the same supplied file. Its layout and style take precedence over generic UI defaults. The shared tokens are in `src/styles/tokens.css`.

See `docs/DELIVERY-REPORT.md` for final verification, `docs/API-BOUNDARY.md` for the service replacement points, and `artifacts/screenshots` for desktop/mobile captures. Example CSVs are available in `public/demo`.
