import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../../state/DemoContext";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Metric,
  Modal,
  PageHeader,
} from "../../components/ui";
import { downloadText, money } from "../../domain/format";
import type { Connection, DemoUser, Role } from "../../domain/models";
export function UsersPage() {
  const { state, run, busy } = useDemo();
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<DemoUser | null>(null);
  const [archive, setArchive] = useState<DemoUser | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="SYSTEM ADMINISTRATION"
        title="Users & roles"
        description="Demo identities control access to operational modules. No real accounts or authentication are created."
        actions={
          <Button
            onClick={() => {
              setError("");
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                email: "",
                role: "store",
                active: true,
              });
            }}
          >
            Add user
          </Button>
        }
      />
      <Card className="card-pad stack-sm">
        <input
          className="input"
          aria-label="Search users"
          placeholder="Search name, email or role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.users
                .filter((u) =>
                  `${u.name} ${u.email} ${u.role}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div className="muted small">{u.email}</div>
                    </td>
                    <td>{u.role}</td>
                    <td>
                      <Badge tone={u.active ? "green" : "neutral"}>
                        {u.active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td>
                      <div className="actions">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setError("");
                            setEdit({ ...u });
                          }}
                        >
                          Edit user
                        </Button>
                        {u.active ? (
                          <Button variant="ghost" onClick={() => setArchive(u)}>
                            Archive
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() =>
                              run(
                                {
                                  type: "saveUser",
                                  user: { ...u, active: true },
                                },
                                "User restored",
                              )
                            }
                          >
                            Restore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      {edit && (
        <Modal title="User details" onClose={() => setEdit(null)}>
          <form
            className="stack-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!edit.name.trim() || !/^\S+@\S+\.\S+$/.test(edit.email)) {
                setError("Enter a name and valid email address.");
                return;
              }
              if (
                state.users.some(
                  (u) =>
                    u.id !== edit.id &&
                    u.email.toLowerCase() === edit.email.trim().toLowerCase(),
                )
              ) {
                setError("This email is already registered.");
                return;
              }
              if (
                await run(
                  {
                    type: "saveUser",
                    user: {
                      ...edit,
                      name: edit.name.trim(),
                      email: edit.email.trim(),
                    },
                  },
                  "User saved",
                )
              )
                setEdit(null);
            }}
          >
            <Field label="Full name">
              <input
                className="input"
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className="input"
                required
                type="email"
                value={edit.email}
                onChange={(e) => setEdit({ ...edit, email: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <select
                className="select"
                value={edit.role}
                onChange={(e) =>
                  setEdit({ ...edit, role: e.target.value as Role })
                }
              >
                <option value="system">System Administrator</option>
                <option value="store">Store Administrator</option>
                <option value="merchandiser">Merchandiser</option>
                <option value="customer">End-Customer</option>
              </select>
            </Field>
            {error && (
              <p role="alert" className="callout error">
                {error}
              </p>
            )}
            <div className="actions">
              <Button type="submit" disabled={busy}>
                Save user
              </Button>
              <Button variant="secondary" onClick={() => setEdit(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {archive && (
        <Modal title="Archive user?" onClose={() => setArchive(null)}>
          <p>
            Archive {archive.name}? Their demo identity will become inactive.
          </p>
          <div className="actions">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    { type: "deleteUser", id: archive.id },
                    "User archived",
                  )
                )
                  setArchive(null);
              }}
            >
              Archive user
            </Button>
            <Button variant="secondary" onClick={() => setArchive(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function IntegrationsPage() {
  const { state, run, busy } = useDemo();
  const [edit, setEdit] = useState<Connection | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="SETTINGS & INTEGRATION"
        title="Store connections"
        description="Configure simulated POS connections. Sync updates the demo status; no external network calls are made."
      />
      <div className="callout">
        Demo integration · Use an example endpoint only. Credentials are neither
        requested nor stored.
      </div>
      <div className="grid-2">
        {state.connections.map((c) => (
          <Card key={c.id} className="card-pad stack">
            <div className="row spread">
              <h2 className="section-title">{c.name}</h2>
              <Badge tone={c.status === "connected" ? "green" : "neutral"}>
                {c.status}
              </Badge>
            </div>
            <div>
              <p>{c.provider}</p>
              <p className="muted small">
                {c.endpoint || "No endpoint configured"}
              </p>
              <p className="small">
                Last simulated sync:{" "}
                {c.lastSync ? new Date(c.lastSync).toLocaleString() : "Never"}
              </p>
            </div>
            <div className="actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setError("");
                  setEdit({ ...c });
                }}
              >
                Configure
              </Button>
              <Button
                disabled={busy || c.status !== "connected"}
                onClick={() =>
                  run(
                    { type: "syncConnection", id: c.id },
                    "Simulated sync completed",
                  )
                }
              >
                Simulate sync
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {edit && (
        <Modal title="Configure demo connection" onClose={() => setEdit(null)}>
          <form
            className="stack-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const u = new URL(edit.endpoint);
                if (
                  !["https:", "http:"].includes(u.protocol) ||
                  u.username ||
                  u.password ||
                  u.search ||
                  u.hash
                )
                  throw Error();
              } catch {
                setError(
                  "Use an HTTP(S) example URL without credentials, query parameters or fragments.",
                );
                return;
              }
              if (
                await run(
                  { type: "saveConnection", connection: edit },
                  "Demo connection saved",
                )
              )
                setEdit(null);
            }}
          >
            <Field
              label="Example endpoint"
              hint="Configuration only; no request is sent."
              error={error}
            >
              <input
                className="input"
                type="url"
                required
                value={edit.endpoint}
                onChange={(e) => setEdit({ ...edit, endpoint: e.target.value })}
              />
            </Field>
            <Field label="Connection state">
              <select
                className="select"
                value={edit.status}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    status: e.target.value as Connection["status"],
                  })
                }
              >
                <option value="connected">Connected (simulated)</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </Field>
            <Button type="submit" disabled={busy}>
              Save connection
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function BenchmarkPage() {
  const { state } = useDemo();
  const completed = state.jobs.filter((j) => j.status === "completed");
  const latest = [...completed].sort((a, b) => b.startedAt - a.startedAt)[0];
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="BASKET ANALYTICS"
        title="Algorithm benchmark"
        description="Compare HUI-Miner and EFIM against the same completed demo configuration."
      />
      <div className="callout warning">
        Simulated estimates only. These values are derived from demo jobs and
        are not measured algorithm performance.
      </div>
      {latest ? (
        <Card className="card-pad stack">
          <div className="row spread">
            <h2 className="section-title">
              Comparison for job {latest.id.slice(0, 8)}
            </h2>
            <Badge tone="orange">Simulated</Badge>
          </div>
          <p className="muted">
            Minimum utility {latest.config.minUtility} · {latest.count}{" "}
            discovered groups · {completed.length} completed demo runs
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Estimated duration</th>
                  <th>Estimated memory</th>
                  <th>Groups</th>
                </tr>
              </thead>
              <tbody>
                {(["HUI-Miner", "EFIM"] as const).map((algorithm) => {
                  const baseline =
                    latest.config.algorithm === "EFIM" ? 1 / 0.72 : 1;
                  const factor = algorithm === "EFIM" ? 0.72 : 1;
                  return (
                    <tr key={algorithm}>
                      <td>
                        <strong>{algorithm}</strong>
                      </td>
                      <td>
                        {(latest.duration * baseline * factor).toFixed(1)} s
                      </td>
                      <td>
                        {(
                          latest.memory *
                          (latest.config.algorithm === "EFIM" ? 1 / 0.8 : 1) *
                          (algorithm === "EFIM" ? 0.8 : 1)
                        ).toFixed(1)}{" "}
                        MB
                      </td>
                      <td>{latest.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            Demo model: EFIM estimates use 72% of HUI-Miner duration and 80% of
            memory. Output counts are identical by construction.
          </p>
          <Link className="text-link" to="/app/mining/setup">
            Change algorithm and run another simulation →
          </Link>
        </Card>
      ) : (
        <Empty
          title="Complete a discovery run first"
          description="A completed demo job provides the configuration and baseline for this comparison."
        >
          <Link className="text-link" to="/app/mining/setup">
            Configure product pairing →
          </Link>
        </Empty>
      )}
    </div>
  );
}
export function OverviewPage() {
  const { state, role } = useDemo();
  const rows = state.imports
    .filter((b) => b.status !== "rejected")
    .flatMap((b) => b.rows);
  const completed = state.jobs.filter((j) => j.status === "completed");
  const links =
    role === "system"
      ? [
          ["Configure discovery", "/app/mining/setup"],
          ["Manage users", "/app/users"],
          ["Review connections", "/app/integrations"],
        ]
      : role === "merchandiser"
        ? [
            ["Review recommendations", "/app/recommendations"],
            ["Plan shelf displays", "/app/layouts"],
            ["Manage campaigns", "/app/campaigns"],
          ]
        : [
            ["Import POS data", "/app/import"],
            ["Manage products", "/app/products"],
            ["View transactions", "/app/transactions"],
          ];
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="RETAIL INTELLIGENCE"
        title="Overview & health"
        description="A live summary of your local demo store and merchandising activity."
      />
      <div className="metrics">
        <Metric
          label="Available products"
          value={state.products.filter((p) => !p.archived).length}
          detail="Active catalog"
        />
        <Metric
          label="Imported receipts"
          value={new Set(rows.map((r) => r.receiptId)).size}
          detail={`${rows.length} validated sale lines`}
        />
        <Metric
          label="Completed discovery"
          value={completed.length}
          detail="Simulated mining runs"
        />
        <Metric
          label="Active campaigns"
          value={state.campaigns.filter((c) => c.status === "active").length}
          detail="Visible in customer storefront"
        />
      </div>
      <div className="split">
        <Card className="card-pad stack">
          <h2 className="section-title">Your next steps</h2>
          {links.map(([label, to]) => (
            <Link key={to} className="row spread text-link callout" to={to}>
              {label}
              <span>→</span>
            </Link>
          ))}
        </Card>
        <Card className="card-pad stack-sm">
          <h2 className="section-title">Store readiness</h2>
          <div className="row spread">
            <span>POS data</span>
            <Badge tone={rows.length ? "green" : "orange"}>
              {rows.length ? "Ready" : "Import needed"}
            </Badge>
          </div>
          <div className="row spread">
            <span>Connections</span>
            <span>
              {state.connections.filter((c) => c.status === "connected").length}{" "}
              connected
            </span>
          </div>
          <div className="row spread">
            <span>Approved pairings</span>
            <span>
              {
                state.recommendations.filter((r) => r.status === "approved")
                  .length
              }
            </span>
          </div>
          <p className="muted small">
            All data stays in this browser. Mining and campaign outcomes are
            explicitly simulated.
          </p>
        </Card>
      </div>
    </div>
  );
}
export function ReportsPage() {
  const { state } = useDemo();
  const active = state.campaigns.filter((c) => c.status === "active");
  const jobs = state.jobs.filter((j) => j.status === "completed");
  const exportReport = () =>
    downloadText(
      "planogramiq-demo-report.csv",
      [
        "type,name,status,value",
        "campaigns,Active campaigns,live demo," + active.length,
        ...jobs.map((j) => `mining,${j.id},simulated completed,${j.count}`),
        ...state.experiments.map(
          (e) =>
            `experiment,${e.id},simulated conversion lift,${((e.bConversion - e.aConversion) * 100).toFixed(2)}`,
        ),
      ].join("\n"),
    );
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="STORE PERFORMANCE"
        title="Reports & insights"
        description="Operational campaign state and completed simulation outcomes."
        actions={
          <Button variant="secondary" onClick={exportReport}>
            Export report CSV
          </Button>
        }
      />
      <div className="metrics">
        <Metric label="Active campaigns" value={active.length} />
        <Metric label="Completed jobs" value={jobs.length} detail="Simulated" />
        <Metric
          label="A/B simulations"
          value={state.experiments.length}
          detail="Synthetic visitor outcomes"
        />
        <Metric
          label="Imported sales"
          value={money(
            state.imports
              .filter((b) => b.status !== "rejected")
              .flatMap((b) => b.rows)
              .reduce((s, r) => s + r.quantity * r.price, 0),
          )}
          detail="From accepted transaction lines"
        />
      </div>
      <Card className="card-pad stack-sm">
        <h2 className="section-title">Active campaigns</h2>
        {active.length ? (
          active.map((c) => (
            <div className="row spread callout" key={c.id}>
              <strong>{c.name}</strong>
              <Badge tone="green">Active</Badge>
            </div>
          ))
        ) : (
          <p className="muted">
            No active campaigns. Approved layouts can be activated from campaign
            management.
          </p>
        )}
      </Card>
      <Card className="card-pad stack-sm">
        <h2 className="section-title">Completed A/B simulations</h2>
        {state.experiments.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Experiment</th>
                  <th>Visitors</th>
                  <th>A conversion</th>
                  <th>B conversion</th>
                  <th>A / B revenue</th>
                </tr>
              </thead>
              <tbody>
                {state.experiments.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.name}
                      <div className="muted small">Simulated</div>
                    </td>
                    <td>{e.visitors}</td>
                    <td>{(e.aConversion * 100).toFixed(1)}%</td>
                    <td>{(e.bConversion * 100).toFixed(1)}%</td>
                    <td>
                      {money(e.aRevenue)} / {money(e.bRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            Run an A/B simulation to compare placement outcomes.
          </p>
        )}
      </Card>
      <Card className="card-pad stack-sm">
        <h2 className="section-title">Completed discovery runs</h2>
        {jobs.length ? (
          jobs.map((j) => (
            <div className="row spread callout" key={j.id}>
              <span>
                {j.config.algorithm} · {j.count} groups
              </span>
              <Badge tone="orange">Simulated · {j.duration.toFixed(1)} s</Badge>
            </div>
          ))
        ) : (
          <p className="muted">No completed discovery runs yet.</p>
        )}
      </Card>
    </div>
  );
}
