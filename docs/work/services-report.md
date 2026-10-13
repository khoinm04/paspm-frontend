# Demo services handoff

Implemented `src/services/demo.ts` with the exact `createDemoService(storage?)`, subscribe, snapshot and async dispatch contract. Default singleton accesses browser storage safely; unavailable storage still permits an in-memory demo. Key: `paspm-demo-v1`. Invalid JSON or invalid state shape recovers to the seed. Successful dispatches clone state, validate, persist and notify; failures leave the prior snapshot intact.

Typed seed exports `createSeed` from `src/mocks/fixtures.ts`: 12 products and asset paths p1–p12, 6 recommendations, approved r1/l1/c1, accepted demo import, users and demo POS. Campaign c1 starts approved; activation drives customer visibility. Shared selectMiningRecommendations filters utility, dollar profit target, exclusions, archived products and department scope. Simulated mining uses explicit completion, deterministic count/duration/memory and preserves approved recommendation references.

Permission mapping: system owns mining/config/users; store owns catalog/import/campaign activation/integrations; merchandiser owns layouts/experiments/utility and can prepare campaigns/review recommendations; customer owns cart. System may also update utility/integrations. Reset is available to all management roles.

Checks cover approved recommendation/layout/campaign linkage, active-layout edit protection, role permissions, partial/rejected CSV imports with quoted fields and cents conversion, stock and atomic bundle add, record-preserving archive, unique SKU/email/category, last admin protection, subscriber notifications, persistence/corruption/reset, concurrent mining prevention, stale completion after reset and utility percentage total.

Verification: `npm test -- --run tests/unit/demo.test.ts` — 15 passed. Initial test invocation occurred before dependencies existed and failed with missing Vitest. Project typecheck was attempted while shared UI/context files were still being authored; no service/fixture errors appeared, but missing shared modules prevented full-project success. Root owns final integrated checks and browser verification.

CSV sample known SKU: COF-001. Rejected imports are retained with issues for review; mixed valid/invalid rows produce warning status. Prices are dollars on input, integer cents in state. No backend requests, credentials, genuine mining or integrations.
