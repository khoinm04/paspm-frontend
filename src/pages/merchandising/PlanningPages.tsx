import { useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import type { Layout } from "../../domain/models";
import { money } from "../../domain/format";
import "../../styles/extensions.css";

export function LayoutsPage() {
  const { state } = useDemo();
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="Shelf & planogram map"
        title="Make discovery part of the aisle"
        description="Build a four-position display from approved product pairings."
        actions={
          <Link className="text-link" to="/app/layouts/new">
            Create layout →
          </Link>
        }
      />
      <div className="grid-3">
        {state.layouts.map((l) => (
          <Card className="card-pad stack-sm" key={l.id}>
            <Badge tone={l.status === "approved" ? "green" : "neutral"}>
              {l.status}
            </Badge>
            <h2>{l.name}</h2>
            <div className="mini-shelf">
              {l.slots.map((r, i) => (
                <span key={i}>{r ? "●" : "○"}</span>
              ))}
            </div>
            <p className="muted">
              {l.slots.filter(Boolean).length} of 4 positions planned
            </p>
            <Link className="text-link" to={`/app/layouts/${l.id}`}>
              Edit display →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
export function LayoutEditorPage() {
  const { id } = useParams();
  const { state } = useDemo();
  if (id && !state.layouts.some((l) => l.id === id))
    return (
      <div className="page">
        <Empty
          title="Layout not found"
          description="Return to the planogram map to select an available display."
        >
          <Link className="text-link" to="/app/layouts">
            View layouts →
          </Link>
        </Empty>
      </div>
    );
  return <LayoutEditor key={id ?? "new"} />;
}
function LayoutEditor() {
  const { id } = useParams();
  const { state, run, busy, notify } = useDemo();
  const existing = state.layouts.find((l) => l.id === id);
  const [name, setName] = useState(existing?.name ?? "New discovery display");
  const [slots, setSlots] = useState<(string | null)[]>(
    existing?.slots ?? [null, null, null, null],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [layoutId] = useState(existing?.id ?? `l${Date.now()}`);
  const activeCampaign = state.campaigns.find(
    (c) => c.layoutId === layoutId && c.status === "active",
  );
  const approved = state.recommendations.filter((r) => r.status === "approved");
  function place(index: number, rid: string | null) {
    if (!rid) return;
    setSlots((old) =>
      old.map((value, i) => (i === index ? rid : value === rid ? null : value)),
    );
    setSelected(null);
  }
  async function save(status: Layout["status"]) {
    await run(
      { type: "saveLayout", layout: { id: layoutId, name, slots, status } },
      status === "approved"
        ? "Layout approved. Ready for a campaign."
        : "Layout saved.",
    );
  }
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="Shelf & planogram map / Editor"
        title="Plan your next discovery"
        description="Select a pairing, then select a shelf position. You can also drag pairings onto the shelf."
      />
      <div className="split">
        <Card className="card-pad stack">
          {activeCampaign && (
            <div className="callout warning">
              Pause “{activeCampaign.name}” before saving changes to this live
              display.{" "}
              <Link className="text-link" to="/app/campaigns">
                Manage campaigns →
              </Link>
            </div>
          )}
          <Field label="Layout name">
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="shelf-heading">
            <span>FOUR-POSITION END CAP</span>
            <span>Front view</span>
          </div>
          <div className="planogram">
            {slots.map((rid, i) => {
              const rec = state.recommendations.find((r) => r.id === rid);
              return (
                <div
                  className="shelf-slot"
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = e.dataTransfer.getData("text/plain");
                    if (approved.some((r) => r.id === dropped))
                      place(i, dropped);
                  }}
                >
                  <button
                    className="slot-place"
                    onClick={() =>
                      selected
                        ? place(i, selected)
                        : notify("Select an approved pairing first.")
                    }
                    aria-label={`Place selected pairing in position ${i + 1}`}
                  >
                    <span className="eyebrow">Position {i + 1}</span>
                    {rec ? (
                      <>
                        <div className="pair-images">
                          {rec.productIds.map((pid) => (
                            <img
                              key={pid}
                              src={
                                state.products.find((p) => p.id === pid)?.image
                              }
                              alt={
                                state.products.find((p) => p.id === pid)
                                  ?.name ?? pid
                              }
                            />
                          ))}
                        </div>
                        <strong>{rec.title}</strong>
                        <span className="small muted">{rec.location}</span>
                      </>
                    ) : (
                      <>
                        <span className="slot-plus">+</span>
                        <span className="muted">
                          {selected
                            ? "Place selected pairing"
                            : "Choose a pairing"}
                        </span>
                      </>
                    )}
                  </button>
                  {rid && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setSlots((old) =>
                          old.map((v, j) => (j === i ? null : v)),
                        )
                      }
                    >
                      Remove position {i + 1}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="callout">
            Each pairing has one position. Moving a pairing clears its previous
            position.
          </div>
          <div className="actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => save("draft")}
            >
              Save draft
            </Button>
            <Button disabled={busy} onClick={() => save("approved")}>
              Save & approve layout
            </Button>
          </div>
        </Card>
        <aside className="stack">
          <Card className="card-pad stack-sm">
            <h2 className="section-title">Approved pairing library</h2>
            <p className="muted small">
              Only reviewed recommendations are available.
            </p>
            {approved.length ? (
              approved.map((r) => (
                <button
                  key={r.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", r.id)
                  }
                  onClick={() => setSelected(r.id)}
                  className={`library-pair ${selected === r.id ? "selected" : ""}`}
                  aria-pressed={selected === r.id}
                >
                  <strong>{r.title}</strong>
                  <span className="small muted">
                    {r.department} · {r.minutes} min setup
                  </span>
                  <span className="small">
                    {selected === r.id
                      ? "Selected — choose a position"
                      : "Select or drag →"}
                  </span>
                </button>
              ))
            ) : (
              <Empty
                title="Review a pairing first"
                description="Approve recommendations to begin your display."
              >
                <Link to="/app/recommendations">Review recommendations</Link>
              </Empty>
            )}
          </Card>
          <Link className="text-link" to="/app/campaigns">
            Manage campaigns →
          </Link>
        </aside>
      </div>
    </div>
  );
}
export function CampaignsPage() {
  const { state, run, busy, role } = useDemo();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [layoutId, setLayout] = useState("");
  const [startsAt, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="Merchandising / Campaigns"
        title="Bring your display to shoppers"
        description="An active campaign publishes its approved pairings in the customer storefront."
        actions={<Button onClick={() => setOpen(true)}>Create campaign</Button>}
      />
      <div className="callout">
        Activation is a Store Administrator action. Current demo role: {role}.
      </div>
      {state.campaigns.map((c) => (
        <Card key={c.id} className="card-pad row spread wrap">
          <div>
            <Badge tone={c.status === "active" ? "green" : "neutral"}>
              {c.status}
            </Badge>
            <h2>{c.name}</h2>
            <p className="muted">
              {state.layouts.find((l) => l.id === c.layoutId)?.name} · Starts{" "}
              {c.startsAt}
            </p>
          </div>
          <div className="actions">
            {c.status === "active" ? (
              <Button
                variant="secondary"
                disabled={busy || role !== "store"}
                onClick={() =>
                  run({ type: "pauseCampaign", id: c.id }, "Campaign paused.")
                }
              >
                Pause campaign
              </Button>
            ) : (
              <Button
                disabled={busy || role !== "store"}
                onClick={() =>
                  run(
                    { type: "activateCampaign", id: c.id },
                    "Campaign active. Bundles are now visible to shoppers.",
                  )
                }
              >
                Activate campaign
              </Button>
            )}
            <span className="small muted">
              Switch to End-Customer to preview the market.
            </span>
          </div>
        </Card>
      ))}
      {open && (
        <Modal title="Create a campaign" onClose={() => setOpen(false)}>
          <form
            className="stack-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run(
                  {
                    type: "saveCampaign",
                    campaign: {
                      id: `c${Date.now()}`,
                      name,
                      layoutId,
                      status: "approved",
                      startsAt,
                    },
                  },
                  "Campaign created.",
                )
              )
                setOpen(false);
            }}
          >
            <Field label="Campaign name">
              <input
                required
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Approved layout">
              <select
                required
                className="select"
                value={layoutId}
                onChange={(e) => setLayout(e.target.value)}
              >
                <option value="">Choose layout</option>
                {state.layouts
                  .filter((l) => l.status === "approved")
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Start date">
              <input
                required
                type="date"
                className="input"
                value={startsAt}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              Create campaign
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function ExperimentsPage() {
  const { state, run, busy } = useDemo();
  const [layoutId, setLayout] = useState(
    state.layouts.find((l) => l.status === "approved")?.id ?? "",
  );
  const [name, setName] = useState("Discovery display comparison");
  const [visitors, setVisitors] = useState(1000);
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="Merchandising / A/B simulation"
        title="Explore the display’s potential"
        description="Deterministic demo outcomes compare a standard shelf (A) with your planned display (B). No real shopper data is collected."
      />
      <Card className="card-pad">
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              { type: "runExperiment", layoutId, name, visitors },
              "Simulation complete.",
            );
          }}
        >
          <Field label="Experiment name">
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Approved display">
            <select
              className="select"
              required
              value={layoutId}
              onChange={(e) => setLayout(e.target.value)}
            >
              <option value="">Choose layout</option>
              {state.layouts
                .filter((l) => l.status === "approved")
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Simulated visitors">
            <input
              type="number"
              min="100"
              max="100000"
              required
              className="input"
              value={visitors}
              onChange={(e) => setVisitors(Number(e.target.value))}
            />
          </Field>
          <div className="actions">
            <Button type="submit" disabled={busy}>
              Run simulation
            </Button>
          </div>
        </form>
      </Card>
      {state.experiments.map((x) => (
        <Card key={x.id} className="card-pad stack-sm">
          <div className="row spread">
            <h2>{x.name}</h2>
            <Badge tone="orange">Simulated</Badge>
          </div>
          <p className="muted">
            {x.visitors.toLocaleString()} visitors ·{" "}
            {state.layouts.find((l) => l.id === x.layoutId)?.name}
          </p>
          <div className="grid-2">
            <Metric
              label="A · Standard shelf conversion"
              value={`${(x.aConversion * 100).toFixed(1)}%`}
              detail={`Revenue ${money(x.aRevenue)}`}
            />
            <Metric
              label="B · Planned display conversion"
              value={`${(x.bConversion * 100).toFixed(1)}%`}
              detail={`Revenue ${money(x.bRevenue)}`}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
export function UtilityPage() {
  const { state, run, busy } = useDemo();
  const [utility, setUtility] = useState(state.utility);
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="Merchandising / Utility model"
        title="Define what a useful pairing means"
        description="Demo weights combine profit and quantity, with a total of 100%. These preferences are separate from the mining threshold."
      />
      <Card className="card-pad">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            run({ type: "saveUtility", utility }, "Utility preferences saved.");
          }}
        >
          <div className="form-grid">
            <Field
              label="Profit weight (%)"
              hint="Changing this weight balances quantity automatically."
            >
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={utility.profit}
                onChange={(e) => {
                  const profit = Number(e.target.value);
                  setUtility({ ...utility, profit, quantity: 100 - profit });
                }}
              />
            </Field>
            <Field
              label="Quantity weight (%)"
              hint="Changing this weight balances profit automatically."
            >
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="1"
                required
                value={utility.quantity}
                onChange={(e) => {
                  const quantity = Number(e.target.value);
                  setUtility({ ...utility, quantity, profit: 100 - quantity });
                }}
              />
            </Field>
            <Field label="Merchandising priority">
              <select
                className="select"
                value={utility.priority}
                onChange={(e) =>
                  setUtility({ ...utility, priority: e.target.value })
                }
              >
                <option value="profit">Profit</option>
                <option value="quantity">Quantity</option>
                <option value="balanced">Balanced</option>
              </select>
            </Field>
          </div>
          <div className="callout">
            Profit {utility.profit}% + quantity {utility.quantity}% ={" "}
            {utility.profit + utility.quantity}% · Simulated preferences
          </div>
          <Button type="submit" disabled={busy}>
            Save utility preferences
          </Button>
        </form>
      </Card>
    </div>
  );
}
