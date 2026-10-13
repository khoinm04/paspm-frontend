import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  Download,
  Filter,
  History,
  Lightbulb,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Metric,
  Modal,
  PageHeader,
  Progress,
} from "../../components/ui";
import { PairingCard, dollars } from "../../components/PairingCard";
import { useDemo } from "../../state/DemoContext";
import { selectMiningRecommendations } from "../../services/demo";
import { csvCell, downloadText } from "../../domain/format";
import type { MiningConfig } from "../../domain/models";
function Steps({ step }: { step: number }) {
  return (
    <Card className="stepper">
      {[
        ["POS Sales Loaded", "Validated receipt data"],
        ["Pairing Rules", "Profit target & display rules"],
        ["Shelf Recommendations", "Review discovered product pairings"],
      ].map(([title, sub], i) => (
        <div
          className={`step ${step === i ? "active" : step > i ? "complete" : ""}`}
          key={title}
        >
          <span className="step-number">
            {step > i ? <Check size={16} /> : i + 1}
          </span>
          <div>
            <span className="eyebrow">STEP {i + 1}</span>
            <strong>{title}</strong>
            <p>{sub}</p>
          </div>
        </div>
      ))}
    </Card>
  );
}
function DataAside() {
  const { state } = useDemo();
  const rows = state.imports
    .filter((i) => i.status !== "rejected")
    .flatMap((i) => i.rows).length;
  return (
    <aside className="stack">
      <Card className="card-pad stack-sm">
        <div className="row spread">
          <h3>Target Health Check</h3>
          <Activity size={17} />
        </div>
        <p className="small muted">
          Your target strikes a balance between discovery and actionable
          insights.
        </p>
        <div className="health-scale">
          <span />
          <span />
          <span />
        </div>
        <div className="row spread small muted">
          <span>Exploratory</span>
          <strong style={{ color: "var(--forest)" }}>Balanced</strong>
          <span>Focused</span>
        </div>
        <div className="divider" />
        <div className="stat-list">
          <div>
            <span>Available transactions</span>
            <strong>{rows.toLocaleString()}</strong>
          </div>
          <div>
            <span>Products in catalog</span>
            <strong>{state.products.filter((p) => !p.archived).length}</strong>
          </div>
          <div>
            <span>Data source</span>
            <strong>Demo POS</strong>
          </div>
        </div>
      </Card>
      <div className="note-card">
        <img src="/assets/store-aisle.png" alt="Supermarket aisle" />
        <div className="row">
          <Lightbulb size={18} />
          <h3>A smarter way to merchandise</h3>
        </div>
        <p>
          The best pairings are already in your customers' baskets. Bring those
          products closer together to make their next visit a little easier.
        </p>
      </div>
      <Card className="card-pad stack-sm">
        <div className="row">
          <History size={17} />
          <h3>Recent Discoveries</h3>
        </div>
        {state.jobs.length ? (
          state.jobs.slice(0, 3).map((j) => (
            <Link
              to={
                j.status === "running"
                  ? "/app/mining/running"
                  : "/app/mining/results"
              }
              key={j.id}
              className="history-item"
            >
              <div className="row spread">
                <strong>{j.config.algorithm}</strong>
                <Badge tone={j.status === "completed" ? "green" : "neutral"}>
                  {j.status}
                </Badge>
              </div>
              <p>
                {j.count} pairings · {dollars(j.config.profitTarget)} target
              </p>
            </Link>
          ))
        ) : (
          <p className="small muted">
            Your discovery history will appear here after your first run.
          </p>
        )}
      </Card>
    </aside>
  );
}
export function MiningSetupPage() {
  const { state, role, run, busy, notify } = useDemo();
  const navigate = useNavigate();
  const [config, setConfig] = useState<MiningConfig>({
    ...state.config,
    excluded: [...state.config.excluded],
  });
  const [error, setError] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [exclude, setExclude] = useState("");
  const [dataMode, setDataMode] = useState(false);
  const rows = state.imports
    .filter((i) => i.status !== "rejected")
    .flatMap((i) => i.rows).length;
  const ready = rows > 0 && !dataMode;
  const editable = role === "system";
  const change = <K extends keyof MiningConfig>(
    key: K,
    value: MiningConfig[K],
  ) => setConfig((c) => ({ ...c, [key]: value }));
  function valid() {
    if (!Number.isFinite(config.profitTarget) || config.profitTarget <= 0) {
      setError("Enter a profit target greater than $0 to start discovery.");
      return false;
    }
    if (!Number.isFinite(config.minUtility) || config.minUtility <= 0) {
      setError("Minimum utility must be greater than 0.");
      return false;
    }
    if (
      config.confidence < 0 ||
      config.confidence > 100 ||
      config.frequency < 0 ||
      config.frequency > 100 ||
      config.lift < 0
    ) {
      setError(
        "Frequency and confidence must be 0–100; lift cannot be negative.",
      );
      return false;
    }
    setError("");
    return true;
  }
  async function start() {
    if (!valid()) return;
    if (!ready) {
      setError("Import transaction data before starting discovery.");
      return;
    }
    if (
      (await run({ type: "saveConfig", config })) &&
      (await run({ type: "startMining" }))
    )
      navigate("/app/mining/running");
  }
  return (
    <div className="page mining-page">
      <PageHeader
        title="Product Pairing Setup"
        description="Set your profit target and display rules to discover products to place together on shelves."
        actions={
          <Badge>
            <ShieldCheck size={13} /> {ready ? "Data ready" : "Import needed"}
          </Badge>
        }
      />
      <Steps step={1} />
      {!editable && (
        <div className="callout">
          Discovery configuration is managed by the System Administrator. Switch
          the demo role to run a discovery.
        </div>
      )}
      {!ready && (
        <div className="callout warning">
          <strong>No transaction data available</strong>
          <p>
            Import your POS sales to start discovering meaningful product
            pairings.
          </p>
          {role === "store" ? (
            <Link className="text-link" to="/app/import">
              Import POS Data <ArrowRight size={15} />
            </Link>
          ) : (
            <p className="small">
              Switch to Store Administrator to import POS data, then return to
              System Administrator to run discovery.
            </p>
          )}
        </div>
      )}
      <div className="split">
        <div className="stack">
          <Card className="source-ledger">
            <span className="file-icon">
              <FileSpreadsheet size={22} />
            </span>
            <div className="source-ledger-copy">
              <strong>
                {ready
                  ? state.imports.find(
                      (i) => i.status !== "rejected" && i.rows.length,
                    )?.name
                  : "No transaction file selected"}
              </strong>
              <p>
                {ready
                  ? `${rows.toLocaleString()} sale lines ready · ${state.products.filter((p) => !p.archived).length} catalog products`
                  : "Upload a receipt file to prepare your discovery"}
              </p>
            </div>
            <Badge tone={ready ? "green" : "orange"}>
              {ready ? "Ready to mine" : "Data needed"}
            </Badge>
          </Card>
          <Card className="card-pad stack">
            <div className="section-title" style={{ margin: 0 }}>
              <Target size={21} />
              <div>
                <h2>Minimum Profit Target per Bundle</h2>
                <p className="small muted">
                  What would a successful pairing look like for your store?
                </p>
              </div>
            </div>
            <div className="target-config stack-sm">
              <div className="target-grid">
                <Field
                  label="Minimum profit target"
                  hint="Estimated additional monthly profit ($)"
                >
                  <input
                    aria-label="Minimum profit target"
                    type="number"
                    min="1"
                    className="input"
                    disabled={!editable}
                    value={config.profitTarget}
                    aria-invalid={!!error && config.profitTarget <= 0}
                    onChange={(e) =>
                      change("profitTarget", Number(e.target.value))
                    }
                  />
                </Field>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 10 }}>
                    Quick target presets
                  </p>
                  <div className="presets">
                    {[
                      [800, "Explore"],
                      [1200, "Balanced"],
                      [2500, "High impact"],
                    ].map(([amount, label]) => (
                      <button
                        disabled={!editable}
                        key={amount}
                        className={`preset ${config.profitTarget === amount ? "active" : ""}`}
                        onClick={() => change("profitTarget", Number(amount))}
                      >
                        <strong>{dollars(Number(amount))}</strong>
                        <small>{label}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="small muted">
                A higher target focuses on fewer, more profitable combinations.
              </p>
            </div>
            <div>
              <h3 style={{ marginBottom: 15 }}>Fine-tune your discovery</h3>
              <div className="grid-3">
                {(
                  [
                    [
                      "frequency",
                      "Minimum frequency",
                      "% of baskets",
                      "How often products appear together.",
                    ],
                    [
                      "confidence",
                      "Pairing confidence",
                      "%",
                      "How likely one product leads to the other.",
                    ],
                    [
                      "lift",
                      "Affinity lift",
                      "×",
                      "Stronger than a chance pairing.",
                    ],
                  ] as const
                ).map(([key, label, unit, hint]) => (
                  <div className="rule-metric" key={key}>
                    <Field label={label}>
                      <div className="row">
                        <input
                          type="number"
                          min="0"
                          max={key === "lift" ? undefined : 100}
                          step="0.1"
                          disabled={!editable}
                          value={config[key]}
                          onChange={(e) => change(key, Number(e.target.value))}
                        />
                        <span className="small muted">{unit}</span>
                      </div>
                    </Field>
                    <p>{hint}</p>
                  </div>
                ))}
              </div>
            </div>
            <details
              className="advanced-options"
              open={!!error && config.minUtility <= 0}
            >
              <summary>Algorithm & advanced settings</summary>
              <div className="advanced-content">
                <div className="form-grid">
                  <Field
                    label="Algorithm"
                    hint="Both options simulate discovery using the same seeded product pairs."
                  >
                    <select
                      aria-label="Algorithm"
                      disabled={!editable}
                      value={config.algorithm}
                      onChange={(e) =>
                        change(
                          "algorithm",
                          e.target.value as MiningConfig["algorithm"],
                        )
                      }
                    >
                      <option>EFIM</option>
                      <option>HUI-Miner</option>
                    </select>
                  </Field>
                  <Field
                    label="Minimum utility"
                    hint="Filter demo pairs by their utility score."
                  >
                    <input
                      aria-label="Minimum utility"
                      disabled={!editable}
                      type="number"
                      min="1"
                      value={config.minUtility}
                      onChange={(e) =>
                        change("minUtility", Number(e.target.value))
                      }
                    />
                  </Field>
                </div>
              </div>
            </details>
          </Card>
          <Card className="card-pad stack">
            <div className="section-title" style={{ margin: 0 }}>
              <Settings2 size={21} />
              <div>
                <h2>Shelf Placement & Merchandising Rules</h2>
                <p className="small muted">
                  Keep discoveries relevant to your store and your customers.
                </p>
              </div>
            </div>
            <div className="placement-rules-grid">
              <div>
                <p className="field" style={{ marginBottom: 12 }}>
                  Product group size
                </p>
                <div className="segmented">
                  {[
                    [2, "Pairs", "2 products"],
                    [3, "Trios", "3 products"],
                    [4, "Family bundles", "4 products"],
                  ].map(([size, label, sub]) => (
                    <button
                      key={size}
                      disabled={!editable}
                      className={config.size === size ? "selected" : ""}
                      onClick={() => change("size", Number(size))}
                    >
                      {label}
                      <br />
                      <small>{sub}</small>
                    </button>
                  ))}
                </div>
                <p className="small muted" style={{ marginTop: 8 }}>
                  Pair examples shown; group sizes are saved preferences.
                </p>
              </div>
              <label className="row spread callout cross-department">
                <div>
                  <strong>Allow cross-department pairings</strong>
                  <p className="small muted">
                    Discover opportunities beyond the same aisle.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.crossDepartment}
                  disabled={!editable}
                  onChange={(e) => change("crossDepartment", e.target.checked)}
                />
              </label>
            </div>
            <Field
              label="Exclude departments"
              hint="Keep selected categories out of this discovery."
            >
              <select
                value={exclude}
                disabled={!editable}
                onChange={(e) => {
                  setExclude("");
                  if (
                    e.target.value &&
                    !config.excluded.includes(e.target.value)
                  )
                    change("excluded", [...config.excluded, e.target.value]);
                }}
              >
                <option value="">Select a department...</option>
                {state.categories
                  .filter((c) => !config.excluded.includes(c))
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
            </Field>
            <div className="row wrap">
              {config.excluded.map((c) => (
                <span className="chip" key={c}>
                  {c}
                  <button
                    aria-label={`Include ${c}`}
                    disabled={!editable}
                    onClick={() =>
                      change(
                        "excluded",
                        config.excluded.filter((x) => x !== c),
                      )
                    }
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <details className="advanced-options">
              <summary>Discovery schedule</summary>
              <div className="advanced-content">
                <Field
                  label="Discovery schedule"
                  hint="Saved preference only; discovery runs when you press the start button."
                >
                  <select
                    disabled={!editable}
                    value={config.schedule}
                    onChange={(e) => change("schedule", e.target.value)}
                  >
                    <option>Manual</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </Field>
              </div>
            </details>
          </Card>
          <div className="ready-panel">
            <Sparkles size={34} />
            <div>
              <span className="eyebrow">READY WHEN YOU ARE</span>
              <h3>Let's uncover your next opportunity.</h3>
              <p>Your receipt data is ready for a simulated discovery.</p>
            </div>
          </div>
          {error && (
            <div className="callout error" role="alert">
              {error}
            </div>
          )}
          <details className="demo-tools small muted">
            <summary>Demo scenario controls</summary>
            <label className="row" style={{ marginTop: 10 }}>
              <input
                type="checkbox"
                checked={dataMode}
                onChange={(e) => setDataMode(e.target.checked)}
              />{" "}
              Preview the no-data state
            </label>
          </details>
        </div>
        <DataAside />
      </div>
      <footer className="footer-bar">
        <Button
          variant="ghost"
          disabled={!editable}
          onClick={() => {
            setConfig({
              ...state.config,
              excluded: [...state.config.excluded],
            });
            setError("");
            notify("Saved configuration restored.");
          }}
        >
          <RefreshCw size={16} /> Reset changes
        </Button>
        <div className="actions">
          <Button
            variant="secondary"
            disabled={!editable || busy}
            onClick={async () => {
              if (valid())
                await run(
                  { type: "saveConfig", config },
                  "Configuration saved.",
                );
            }}
          >
            <Save size={16} /> Save Configuration
          </Button>
          <Button
            variant="secondary"
            disabled={!ready}
            onClick={() => {
              if (valid()) setDryRun(true);
            }}
          >
            Dry Run
          </Button>
          <Button disabled={!editable || busy || !ready} onClick={start}>
            <Sparkles size={16} /> Discover Product Pairings{" "}
            <ArrowRight size={16} />
          </Button>
        </div>
      </footer>
      {dryRun && (
        <Modal title="Discovery preview" onClose={() => setDryRun(false)}>
          <div className="stack-sm">
            <p>
              <strong>
                {selectMiningRecommendations(state, config).length} demo
                pairings
              </strong>{" "}
              match your profit, utility and department filters.
            </p>
            <p className="muted">
              Frequency, confidence, affinity, group size and scheduling are
              saved preferences. This frontend preview does not execute a mining
              algorithm.
            </p>
            <Button onClick={() => setDryRun(false)}>
              Return to configuration
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function MiningRunningPage() {
  const { state, role, run } = useDemo();
  const navigate = useNavigate();
  const job = state.jobs[0];
  const [now, setNow] = useState(Date.now());
  const [cancel, setCancel] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (job?.status === "completed")
      navigate("/app/mining/results", { replace: true });
  }, [job?.status, navigate]);
  if (!job || job.status === "cancelled" || job.status === "failed")
    return (
      <div className="page">
        <Card>
          <Empty
            title={job ? "Discovery stopped" : "No discovery running"}
            description="Return to your configuration to start another discovery."
          >
            <Link className="button primary" to="/app/mining/setup">
              Back to Configuration
            </Link>
          </Empty>
        </Card>
      </div>
    );
  const progress = Math.min(98, Math.max(3, (now - job.startedAt) / 60));
  const stage = Math.min(3, Math.floor(progress / 25));
  return (
    <div className="page">
      <PageHeader
        title="Discovering Your Next Best Pairings"
        description="We're connecting the dots across your baskets to find the combinations that make a difference."
        actions={
          <Badge>
            <Activity size={13} /> Discovery in progress
          </Badge>
        }
      />
      <Steps step={1} />
      <div className="split">
        <div className="stack">
          <Card className="card-pad stack">
            <div className="row spread">
              <div>
                <span className="eyebrow">SIMULATED DISCOVERY</span>
                <h2 style={{ marginTop: 8 }}>
                  Finding the products that belong together
                </h2>
              </div>
              <Sparkles size={30} color="var(--forest)" />
            </div>
            <Progress value={progress} label="Discovery progress" />
            <div className="progress-stages">
              {[
                "Prepare data",
                "Explore baskets",
                "Find pairings",
                "Rank opportunities",
              ].map((s, i) => (
                <div
                  key={s}
                  className={i < stage ? "done" : i === stage ? "active" : ""}
                >
                  {i < stage ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                  <strong>{s}</strong>
                </div>
              ))}
            </div>
            <div className="grid-3">
              <div>
                <p className="eyebrow">Time elapsed</p>
                <h2>
                  {Math.min(6, Math.floor((now - job.startedAt) / 1000))} sec
                </h2>
              </div>
              <div>
                <p className="eyebrow">Profit target</p>
                <h2>{dollars(job.config.profitTarget)}</h2>
              </div>
              <div>
                <p className="eyebrow">Algorithm</p>
                <h2>{job.config.algorithm}</h2>
              </div>
            </div>
            <div className="callout success">
              <ShieldCheck size={17} /> Your work is safe. You can navigate away
              while this demo discovery finishes.
            </div>
          </Card>
          <Card className="card-pad stack-sm">
            <h2>Live Discovery Feed</h2>
            <p className="small muted">
              A preview of the sample combinations being evaluated.
            </p>
            {state.recommendations.slice(0, Math.max(1, stage + 1)).map((r) => (
              <div className="history-item row spread" key={r.id}>
                <div>
                  <strong>{r.title}</strong>
                  <p>Evaluating basket affinity and profit potential</p>
                </div>
                <Badge>Evaluating</Badge>
              </div>
            ))}
          </Card>
        </div>
        <DataAside />
      </div>
      <footer className="footer-bar">
        <span className="small muted">Estimated demo time: 6 seconds</span>
        <div className="actions">
          <Button
            variant="secondary"
            disabled={role !== "system"}
            onClick={() => setCancel(true)}
          >
            Cancel Discovery
          </Button>
          <Link className="button primary" to="/app/overview">
            Continue in Background <ArrowRight size={16} />
          </Link>
        </div>
      </footer>
      {cancel && (
        <Modal title="Cancel this discovery?" onClose={() => setCancel(false)}>
          <div className="stack-sm">
            <p>
              Your configuration stays saved. You can start a fresh discovery at
              any time.
            </p>
            <div className="actions">
              <Button variant="secondary" onClick={() => setCancel(false)}>
                Keep discovering
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (
                    await run(
                      { type: "cancelMining", id: job.id },
                      "Discovery cancelled.",
                    )
                  )
                    navigate("/app/mining/setup");
                }}
              >
                Confirm cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function MiningResultsPage() {
  const { state, role } = useDemo();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All departments");
  const [sort, setSort] = useState("profit");
  const [page, setPage] = useState(1);
  const job = state.jobs.find((j) => j.status === "completed");
  const matching = selectMiningRecommendations(
    state,
    job?.config || state.config,
  ).map(
    (r) => state.recommendations.find((current) => current.id === r.id) || r,
  );
  const filtered = matching
    .filter(
      (r) =>
        (department === "All departments" ||
          r.department === department ||
          r.productIds.some(
            (id) =>
              state.products.find((p) => p.id === id)?.category === department,
          )) &&
        [
          r.title,
          ...r.productIds.map(
            (id) => state.products.find((p) => p.id === id)?.name || "",
          ),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "affinity"
        ? b.affinity - a.affinity
        : sort === "time"
          ? a.minutes - b.minutes
          : b.lift - a.lift,
    );
  const count = Math.max(1, Math.ceil(filtered.length / 5));
  const currentPage = Math.min(page, count);
  return (
    <div className="page">
      <PageHeader
        title="Your Product Pairing Discoveries"
        description="From everyday shopping patterns to profitable shelf decisions. Explore the combinations with the most potential."
        actions={
          <>
            <Link className="button secondary" to="/app/mining/setup">
              <Settings2 size={16} /> Adjust Discovery
            </Link>
            <Button
              variant="secondary"
              onClick={() =>
                downloadText(
                  "pairing-discoveries.csv",
                  [
                    "pairing,profit_lift,affinity,utility",
                    ...filtered.map((r) =>
                      [r.title, r.lift, r.affinity, r.utility]
                        .map(csvCell)
                        .join(","),
                    ),
                  ].join("\n"),
                )
              }
            >
              <Download size={16} /> Export
            </Button>
          </>
        }
      />
      <Steps step={2} />
      <div className="metrics">
        <Metric
          label="Pairings discovered"
          value={matching.length}
          detail="Matching your saved discovery"
          icon={<Sparkles />}
        />
        <Metric
          label="Potential monthly lift"
          value={dollars(matching.reduce((s, r) => s + r.lift, 0))}
          detail="Illustrative demo estimate"
          icon={<TrendingUp />}
        />
        <Metric
          label="Average affinity"
          value={`${matching.length ? Math.round(matching.reduce((s, r) => s + r.affinity, 0) / matching.length) : 0}%`}
          detail="Across matching combinations"
          icon={<Activity />}
        />
        <Metric
          label="Discovery time"
          value={`${job?.duration || 0}s`}
          detail={
            job
              ? `${job.config.algorithm} · Simulated`
              : "Preview · run discovery to benchmark"
          }
          icon={<Clock3 />}
        />
      </div>
      <div className="split">
        <div className="stack">
          <Card className="card-pad">
            <div className="row spread" style={{ marginBottom: 18 }}>
              <h2>High-Impact Product Pairings</h2>
              <Badge>{filtered.length} opportunities</Badge>
            </div>
            <div className="toolbar">
              <input
                className="input"
                aria-label="Search pairings"
                placeholder="Search products or pairings..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="select"
                aria-label="Sort pairings"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="profit">Highest profit lift</option>
                <option value="affinity">Highest affinity</option>
                <option value="time">Quickest to implement</option>
              </select>
            </div>
            <div className="filter-chips">
              {["All departments", ...state.categories].map((c) => (
                <button
                  key={c}
                  className={department === c ? "active" : ""}
                  onClick={() => {
                    setDepartment(c);
                    setPage(1);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>
          {filtered.length ? (
            filtered
              .slice((currentPage - 1) * 5, currentPage * 5)
              .map((r) => <PairingCard key={r.id} pairing={r} review={false} />)
          ) : (
            <Card>
              <Empty
                title="No product pairings found"
                description={
                  matching.length
                    ? "Try another search or department to explore more opportunities."
                    : "Your current target is too focused for the demo data. Lower your profit target or include more departments."
                }
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setDepartment("All departments");
                  }}
                >
                  Clear filters
                </Button>
                <Link className="button primary" to="/app/mining/setup">
                  Adjust Discovery Settings
                </Link>
              </Empty>
            </Card>
          )}
          <Card className="pagination">
            <span>
              Showing {filtered.length ? (currentPage - 1) * 5 + 1 : 0}–
              {Math.min(currentPage * 5, filtered.length)} of {filtered.length}{" "}
              pairings
            </span>
            <div className="actions">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span>
                {currentPage} / {count}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage === count}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>
        <aside className="stack">
          <Card className="card-pad stack-sm">
            <div className="row">
              <ShieldCheck size={19} />
              <h3>Discovery Summary</h3>
            </div>
            <p className="small muted">
              Your results are filtered against the configuration captured for
              this run.
            </p>
            <div className="stat-list">
              <div>
                <span>Algorithm</span>
                <strong>
                  {job?.config.algorithm || state.config.algorithm}
                </strong>
              </div>
              <div>
                <span>Profit target</span>
                <strong>
                  {dollars(
                    job?.config.profitTarget || state.config.profitTarget,
                  )}
                </strong>
              </div>
              <div>
                <span>Minimum utility</span>
                <strong>
                  {job?.config.minUtility || state.config.minUtility}
                </strong>
              </div>
              <div>
                <span>Model</span>
                <strong>Simulated dataset</strong>
              </div>
            </div>
            {role === "system" && job && (
              <Link className="button secondary" to="/app/benchmarks">
                View benchmark <ArrowRight size={15} />
              </Link>
            )}
          </Card>
          <Card className="card-pad stack-sm">
            <div className="row">
              <Filter size={18} />
              <h3>Actionability at a Glance</h3>
            </div>
            <p className="small muted">
              Start with pairings that fit your shelf space and daily routine.
            </p>
            <Progress value={83} label="Easy to implement" />
            <Progress value={67} label="Within the same aisle" />
          </Card>
          <div className="note-card">
            <Lightbulb size={24} />
            <h3 style={{ marginTop: 12 }}>Small changes. Better baskets.</h3>
            <p>
              Review a pairing with your merchandising team before publishing it
              to the shop.
            </p>
            {role !== "system" && (
              <Link
                className="button secondary"
                style={{ marginTop: 18 }}
                to="/app/recommendations"
              >
                Review Recommendations
              </Link>
            )}
          </div>
        </aside>
      </div>
      <footer className="footer-bar">
        <div className="row small muted">
          <Database size={16} /> Local demo · no mining server connected
        </div>
        <Link className="button primary" to="/app/mining/setup">
          <Play size={15} /> Start a New Discovery
        </Link>
      </footer>
    </div>
  );
}
