# Implementation handoff

Approved Option A. React TS Vite. Frontend-only. No real auth/mining/integrations. Services are simple asynchronous demo transitions; do not overengineer. Four E2E workflows and Figma fidelity are priority. Read docs/PASPM-AUDIT.md for design evidence.

Domain contract: src/domain/models.ts is owned by root. Ask root for extensions instead of independently changing it.

Service contract: src/services/demo.ts exports createDemoService(storage?: Pick<Storage,'getItem'|'setItem'|'removeItem'>), returning { getSnapshot(): DemoState; subscribe(listener:()=>void):()=>void; dispatch(action: DemoAction, role: Role): Promise<DemoState> }. Also exports singleton demoService. Fixtures exports createSeed():DemoState. Validate permission and essential invariants without backend complexity. Money in cents; Recommendation.lift and profitTarget are dollar aggregate demo values for display; utility same simple numeric units with explicit Simulated provenance.

State contract root implements src/state/DemoContext.tsx exports useDemo() -> { state: DemoState; role:Role; setRole:(role:Role)=>void; run:(action:DemoAction,success?:string)=>Promise<boolean>; busy:boolean; notify:(message:string,kind?:'success'|'error')=>void }. run catches service error and shows toast, returning true on success. Read state before/after rerender. role defaults 'store'.

UI root implements src/components/ui/index.tsx exports:
- Button: native button props + variant?: 'primary'|'secondary'|'ghost'|'danger'; children; default type button.
- Card: native section HTML props, optional className; children.
- Badge: children; tone?: 'green'|'orange'|'red'|'neutral'.
- PageHeader: eyebrow?:string; title:string; description?:string; actions?:ReactNode.
- Field: label:string; hint?:string; error?:string; children (label wraps input).
- Modal: title:string; children; onClose:()=>void (mounted when open; native dialog focus management).
- Empty: title:string; description:string; children?:ReactNode.
- Metric: label:string; value:ReactNode; detail?:string; icon?:ReactNode.
- Progress: value:number; label?:string.
- Confirm: not provided, use Modal with buttons.
- money(cents:number):string, number(value:number):string in src/domain/format.ts.
- downloadText(name,text,type='text/csv') in src/domain/format.ts.

Shared CSS classes root provides: .page, .page-header, .eyebrow, .muted, .small, .card, .card-pad, .section-title, .stack (gap24), .stack-sm (gap12), .row (flex align center gap12), .spread (justify-between), .wrap, .grid-2, .grid-3, .metrics (4cols), .split (main 2fr + aside 1fr), .toolbar, .input, .select, .table-wrap, .data-table, .form-grid (2cols), .actions, .divider, .callout (neutral pale), .callout.warning, .callout.error, .product-thumb, .text-link, .footer-bar, .segmented, .segmented .selected, .empty.

Use imports '../../components/ui' for src/pages/[directory]/X.tsx. Page files use named exports. Root owns router, shell, global CSS, auth, import/mining/recommendation pages, components and state. Agents must not edit those files. Extensions may add a scoped CSS file only for unique layout editor/storefront features. No fake disabled actions; either real demo state change, download, modal or meaningful navigation. No browser tools in subagents to avoid shared browser conflicts. Root will do browser verification. Write concise report under docs/work when done; do not create/commit git changes independently.

Available fixture CSV columns receipt_id,sku,quantity,price,timestamp. Prices CSV in dollars converted to cents. Seed IDs: products p1 coffee,p2 biscotti,p3 olive oil,p4 balsamic,p5 craft beer,p6 pretzels,p7 baguette,p8 brie,p9 peanut butter,p10 seeded bread,p11 honey,p12 herbal tea. Recommendations r1..r6 map consecutive product pairs. Layout l1 'Weekend discovery' slots ['r1',null,null,null] approved, r1 initially approved. Campaign c1 'Weekend discoveries' layout l1 approved (not active), so customer sees no recommended bundles until activation, catalog always visible. Seed imports accepted for mining demo, with reset restoring known starting state.
