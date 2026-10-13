# Replacing the demo service with ASP.NET Core APIs

The React UI obtains its shared snapshot through `DemoProvider` (`src/state/DemoContext.tsx`). It reads `demoService.getSnapshot()`, subscribes to changes, and sends typed `DemoAction` commands through the asynchronous `dispatch(action, role)` method. Prices, costs, cart totals and A/B revenue use integer cents; projected monthly pairing lift and mining profit target use aggregate dollars.

`src/domain/models.ts` defines the DTOs. `src/services/demo.ts` contains the local mutation adapter, role checks and persistence. `src/mocks/fixtures.ts` contains deterministic sample entities. These are the primary replacement points; shared UI controls and page composition can remain in place.

| UI domain | Current mock commands | Future API responsibility |
| --- | --- | --- |
| Catalog | saveProduct, deleteProduct, saveCategory, deleteCategory | Catalog CRUD, archive/history and stock validation |
| Imports | importCsv | File upload, parsing, mapping, validation and batch history |
| Mining | saveConfig, startMining, completeMining, cancelMining, failMining | Configuration, real job lifecycle and progress polling/events |
| Recommendations | reviewRecommendation | Mining-derived candidates, evidence, approval history |
| Planning | saveLayout, saveCampaign, activateCampaign, pauseCampaign | Layout persistence, campaign validation and publication |
| Experiments | runExperiment | Historical/simulated comparison or measured campaign reporting |
| Administration | saveUser, deleteUser, saveConnection, syncConnection, saveUtility | Identity/authorization, integration setup and preferences |
| Customer market | addCart, setCartQuantity | Catalog, active bundles and basket persistence |

An API adapter should publish refreshed DTO snapshots after successful requests and preserve the Promise rejection behavior used by `run()` for toast feedback. Read loading/error states and background job polling will need to be added when remote reads replace synchronous local snapshots.

The role selector and service checks are demo behavior. Production authorization belongs on the server. Replace the seeded mining selector, synthetic benchmarks/A/B formulas, and six-second completion timer when real job endpoints exist. No API server, endpoint contract, credentials or integration is provisioned in this frontend task.
