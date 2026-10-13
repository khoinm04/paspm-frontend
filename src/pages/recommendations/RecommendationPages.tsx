import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Clock3,
  Download,
  Lightbulb,
  Map,
  TrendingUp,
} from "lucide-react";
import { PairingCard, dollars } from "../../components/PairingCard";
import {
  Badge,
  Button,
  Card,
  Empty,
  Metric,
  Modal,
  PageHeader,
  Progress,
} from "../../components/ui";
import { useDemo } from "../../state/DemoContext";
import { downloadText, money, csvCell } from "../../domain/format";
import { selectMiningRecommendations } from "../../services/demo";
import type { ReactNode } from "react";
import type { Recommendation } from "../../domain/models";
function ReviewDialog({
  pairing,
  status,
  onClose,
}: {
  pairing: Recommendation;
  status: "approved" | "rejected";
  onClose: () => void;
}) {
  const { run, busy } = useDemo();
  return (
    <Modal
      title={status === "approved" ? "Approve pairing?" : "Reject pairing?"}
      onClose={onClose}
    >
      <div className="stack-sm">
        <p>
          {status === "approved"
            ? `Approve ${pairing.title} for use in your shelf plan. Choose its position in the layout editor after approval.`
            : `Reject ${pairing.title}? It will remain in the review history. Approved layouts may prevent rejection.`}
        </p>
        <p className="muted small">
          This updates local demo state. No staff task is dispatched or real
          store shelf changed.
        </p>
        <div className="actions">
          <Button
            variant={status === "approved" ? "primary" : "danger"}
            disabled={busy}
            onClick={async () => {
              if (
                await run(
                  { type: "reviewRecommendation", id: pairing.id, status },
                  status === "approved"
                    ? "Pairing approved. Add it to your planogram."
                    : "Pairing rejected",
                )
              )
                onClose();
            }}
          >
            {status === "approved" ? "Confirm approval" : "Confirm rejection"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
export function RecommendationsPage() {
  const { state, role } = useDemo();
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("lift");
  const [page, setPage] = useState(1);
  const [review, setReview] = useState<{
    pairing: Recommendation;
    status: "approved" | "rejected";
  } | null>(null);
  const canReview = ["store", "merchandiser"].includes(role);
  const latest = [...state.jobs]
    .filter((j) => j.status === "completed")
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const eligible = latest
    ? selectMiningRecommendations(state, latest.config).map(
        (r) =>
          state.recommendations.find((existing) => existing.id === r.id) || r,
      )
    : state.recommendations.filter(
        (r) =>
          !r.productIds.some(
            (id) => state.products.find((p) => p.id === id)?.archived,
          ),
      );
  const items = eligible
    .filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (department === "all" || r.department === department) &&
        `${r.title} ${r.location} ${r.department} ${r.productIds
          .map((id) => {
            const p = state.products.find((p) => p.id === id);
            return `${p?.name} ${p?.sku}`;
          })
          .join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "affinity"
        ? b.affinity - a.affinity
        : sort === "minutes"
          ? a.minutes - b.minutes
          : b.lift - a.lift,
    );
  const approved = eligible.filter((r) => r.status === "approved");
  const pages = Math.max(1, Math.ceil(items.length / 3));
  const current = Math.min(page, pages);
  const minutes = eligible.length
    ? Math.round(
        eligible.reduce((sum, r) => sum + r.minutes, 0) / eligible.length,
      )
    : 0;
  const receipts = new Set(
    state.imports
      .filter((b) => b.status !== "rejected")
      .flatMap((b) => b.rows)
      .map((r) => r.receiptId),
  ).size;
  const exportSheet = () =>
    downloadText(
      "merchandising-sheet.csv",
      [
        "id,title,status,location,simulated_monthly_lift,setup_minutes",
        ...items.map((r) =>
          [r.id, r.title, r.status, r.location, r.lift, r.minutes]
            .map(csvCell)
            .join(","),
        ),
      ].join("\n"),
    );
  const clear = () => {
    setQuery("");
    setDepartment("all");
    setStatus("all");
    setPage(1);
  };
  return (
    <div className="page stack recommendations-page">
      <div className="breadcrumbs">
        <Link to="/app/overview">Home</Link>
        <span>/</span>
        <span>Basket Analytics</span>
        <span>/</span>
        <span>Recommendations</span>
      </div>
      <div className="row wrap">
        <Badge tone="neutral">POS Ledger: Central Supermarket #01</Badge>
        <span className="demo-label">
          Seeded recommendations · Simulated opportunities
        </span>
      </div>
      <PageHeader
        title="Ranked Product Recommendations"
        description="Actionable merchandise pairings ranked by profit lift and shelf compatibility."
        actions={
          <>
            <Link className="button secondary" to="/app/mining/setup">
              Adjust Threshold
            </Link>
            <Button variant="secondary" onClick={exportSheet}>
              <Download size={15} />
              Export Merchandising Sheet
            </Button>
          </>
        }
      />
      <div className="metrics">
        <Metric
          label="Total recommendations"
          value={`${eligible.length} Pairs`}
          detail={`${items.length} matching current filters`}
          icon={<Map />}
        />
        <Metric
          label="Projected monthly lift"
          value={`+${dollars(eligible.reduce((sum, r) => sum + r.lift, 0))}`}
          detail="Simulated aggregate opportunity"
          icon={<TrendingUp />}
        />
        <Metric
          label="Implementation time"
          value={`~${minutes} mins`}
          detail="Average per shelf display"
          icon={<Clock3 />}
        />
        <Metric
          label="Approved pairings"
          value={`${approved.length} / ${eligible.length}`}
          detail="Ready to place in a layout"
          icon={<Check />}
        />
      </div>
      <div className="split">
        <div className="stack">
          <Card className="card-pad">
            <div className="toolbar">
              <input
                className="input"
                aria-label="Search recommendations"
                placeholder="Search SKU, product pairing, aisle or bay…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
              <select
                className="select"
                aria-label="Sort recommendations"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="lift">Highest Profit Lift</option>
                <option value="affinity">Highest Basket Affinity</option>
                <option value="minutes">Quickest Setup</option>
              </select>
              <select
                className="select"
                aria-label="Recommendation status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="filter-chips">
              <button
                type="button"
                className={department === "all" ? "active" : ""}
                onClick={() => {
                  setDepartment("all");
                  setPage(1);
                }}
              >
                All Pairs ({eligible.length})
              </button>
              {[...new Set(eligible.map((r) => r.department))].map((d) => (
                <button
                  type="button"
                  key={d}
                  className={department === d ? "active" : ""}
                  onClick={() => {
                    setDepartment(d);
                    setPage(1);
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </Card>
          {items.length ? (
            items.slice((current - 1) * 3, current * 3).map((r) => (
              <PairingCard
                key={r.id}
                pairing={r}
                review={false}
                actions={
                  canReview && (
                    <>
                      <Button
                        disabled={r.status === "approved"}
                        onClick={() =>
                          setReview({ pairing: r, status: "approved" })
                        }
                      >
                        <Check size={15} />{" "}
                        {r.status === "approved"
                          ? "Approved"
                          : "Approve pairing"}
                      </Button>
                      {r.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          aria-label={`Reject ${r.title}`}
                          onClick={() =>
                            setReview({ pairing: r, status: "rejected" })
                          }
                        >
                          Reject
                        </Button>
                      )}
                    </>
                  )
                }
              />
            ))
          ) : (
            <Card className="card-pad">
              <Empty
                title={
                  eligible.length
                    ? "No pairings match your filters"
                    : "No Product Groups Met Your Current Threshold"
                }
                description={
                  eligible.length
                    ? "Try a different department, status or search term."
                    : `Your latest discovery configuration produced no eligible pairings. ${receipts} imported baskets are available. Review minimum utility and exclusions, then run discovery again.`
                }
              >
                <Button variant="secondary" onClick={clear}>
                  Clear filters
                </Button>
                <Link className="button primary" to="/app/mining/setup">
                  Adjust discovery thresholds
                </Link>
              </Empty>
              <div className="callout warning">
                Minimum utility filters algorithm output. The merchandising
                profit target is a separate simulated business rule.
              </div>
            </Card>
          )}
          <Card className="pagination">
            <span>
              Showing {items.length ? (current - 1) * 3 + 1 : 0}–
              {Math.min(current * 3, items.length)} of {items.length}{" "}
              recommendations
            </span>
            <div className="actions">
              <Button
                variant="secondary"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </Button>
              <span>
                {current} / {pages}
              </span>
              <Button
                variant="secondary"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                Next
              </Button>
            </div>
          </Card>
        </div>
        <aside className="stack">
          <Card className="card-pad stack-sm">
            <div className="row spread">
              <h2>Execution Progress</h2>
              <Badge>Demo</Badge>
            </div>
            <div className="row spread small">
              <span>Pairs Approved</span>
              <strong>
                {approved.length} of {eligible.length}
              </strong>
            </div>
            <Progress
              value={
                eligible.length ? (100 * approved.length) / eligible.length : 0
              }
              label="Approval progress"
            />
            <div className="grid-2">
              <div className="required-item">
                <span className="eyebrow">Setup labor</span>
                <h3>{approved.reduce((sum, r) => sum + r.minutes, 0)} mins</h3>
                <p>Approved pairings only</p>
              </div>
              <div className="required-item">
                <span className="eyebrow">Placements</span>
                <h3>
                  {state.layouts.reduce(
                    (sum, l) => sum + l.slots.filter(Boolean).length,
                    0,
                  )}{" "}
                  slots
                </h3>
                <p>Across demo layouts</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                downloadText(
                  "staff-task-sheet.txt",
                  approved
                    .map(
                      (r) =>
                        `${r.title}\nLocation: ${r.location}\nSetup: ${r.minutes} minutes\n${r.advice}`,
                    )
                    .join("\n\n"),
                  "text/plain",
                )
              }
            >
              Generate Staff Task Sheet
            </Button>
          </Card>
          <Card className="card-pad stack-sm">
            <h2>Department Synergy Breakdown</h2>
            {[...new Set(eligible.map((r) => r.department))].map((d) => {
              const count = eligible.filter((r) => r.department === d).length;
              return (
                <div className="stack-sm" key={d}>
                  <div className="row spread small">
                    <span>{d}</span>
                    <strong>{count} pairs</strong>
                  </div>
                  <Progress
                    value={
                      eligible.length ? (100 * count) / eligible.length : 0
                    }
                  />
                </div>
              );
            })}
            {!eligible.length && (
              <p className="muted small">
                No eligible pairings for this discovery configuration.
              </p>
            )}
          </Card>
          <div className="callout">
            <div className="row">
              <Lightbulb size={18} />
              <strong>Store Manager Tip</strong>
            </div>
            <p className="small">
              Review stock availability and fixture clearance before placing
              complementary products. Demo approval makes a pairing available in
              the shelf editor.
            </p>
            <LayoutLink className="text-link">
              Open Shelf & Planogram Map →
            </LayoutLink>
          </div>
        </aside>
      </div>
      <div className="footer-bar">
        <p>{approved.length} approved combinations ready for shelf planning</p>
        <LayoutLink className="button primary">
          Confirm & Update Planogram Map →
        </LayoutLink>
      </div>
      {review && <ReviewDialog {...review} onClose={() => setReview(null)} />}
    </div>
  );
}
export function RecommendationDetailPage() {
  const { id } = useParams();
  const { state, role } = useDemo();
  const [review, setReview] = useState<"approved" | "rejected" | null>(null);
  const pairing = state.recommendations.find((r) => r.id === id);
  const canReview = ["store", "merchandiser"].includes(role);
  if (!pairing)
    return (
      <div className="page">
        <Empty
          title="Pairing not found"
          description="This recommendation may no longer exist in the current demo."
        >
          <Link className="button secondary" to="/app/recommendations">
            Back to Recommendations
          </Link>
        </Empty>
      </div>
    );
  const products = pairing.productIds
    .map((pid) => state.products.find((p) => p.id === pid))
    .filter((p) => !!p);
  const margin = products.reduce((s, p) => s + p.price - p.cost, 0);
  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const solo = products[0];
  const soloMargin = solo ? solo.price - solo.cost : 0;
  const workOrder = () =>
    downloadText(
      `shelf-work-order-${pairing.id}.txt`,
      [
        "SIMULATED SHELF WORK ORDER",
        pairing.title,
        `Status: ${pairing.status}`,
        `Location: ${pairing.location}`,
        `Estimated setup: ${pairing.minutes} minutes`,
        ...products.map(
          (p) => `${p.name} (${p.sku}) — ${p.stock} units in stock`,
        ),
        pairing.advice,
        "Verify stock, fixture load and aisle clearance before execution.",
      ].join("\n"),
      "text/plain",
    );
  return (
    <div className="page stack detail-page">
      <div className="breadcrumbs">
        <Link to="/app/overview">Home</Link>
        <span>/</span>
        <span>Basket Analytics</span>
        <span>/</span>
        <Link to="/app/recommendations">Recommendations</Link>
        <span>/</span>
        <span>Pairing {pairing.id} Details</span>
      </div>
      <Link className="text-link" to="/app/recommendations">
        <ArrowLeft size={16} />
        Back to Recommendations
      </Link>
      <Card className="card-pad stack detail-intro">
        <div className="row wrap">
          <Badge
            tone={
              pairing.status === "approved"
                ? "green"
                : pairing.status === "rejected"
                  ? "red"
                  : "orange"
            }
          >
            {pairing.status === "pending" ? "Ready for review" : pairing.status}
          </Badge>
          <span className="small muted">
            {pairing.location} · {pairing.minutes} min setup
          </span>
        </div>
        <PageHeader
          title={products.map((p) => p.name).join(" × ")}
          description={`${pairing.department} · ${pairing.title}`}
          actions={
            <>
              <Button variant="secondary" onClick={workOrder}>
                <Download size={15} />
                Download Shelf Work-Order
              </Button>
              {canReview && pairing.status !== "approved" && (
                <Button onClick={() => setReview("approved")}>
                  <Check size={15} />
                  Approve & Push to Planogram
                </Button>
              )}
              {pairing.status === "approved" && (
                <LayoutLink className="button primary">
                  Place approved pairing →
                </LayoutLink>
              )}
            </>
          }
        />
      </Card>
      <div className="metrics">
        <Metric
          label="Projected monthly lift"
          value={`+${dollars(pairing.lift)}`}
          detail="Simulated gross profit opportunity"
          icon={<TrendingUp />}
        />
        <Metric
          label="Basket co-occurrence"
          value={`${pairing.affinity.toFixed(1)}%`}
          detail="Seeded demo affinity"
        />
        <Metric
          label="Pair utility"
          value={pairing.utility}
          detail="Simulated numeric utility units"
        />
        <Metric
          label="Implementation time"
          value={`~${pairing.minutes} mins`}
          detail={pairing.location}
          icon={<Clock3 />}
        />
      </div>
      <div className="split">
        <div className="stack">
          <Card className="card-pad stack">
            <div className="row spread">
              <div>
                <h2>Why This Pairing Works (Store Evidence)</h2>
                <p className="muted small">
                  Illustrative basket comparison using catalog prices.
                </p>
              </div>
              <Badge tone="neutral">Simulated evidence</Badge>
            </div>
            <div className="evidence-comparison">
              <div className="evidence-panel">
                <div className="row spread">
                  <span className="eyebrow">Single-product basket</span>
                  <Badge tone="neutral">Baseline</Badge>
                </div>
                <div className="evidence-value">
                  {money(solo?.price ?? 0)} <span>basket value</span>
                </div>
                <div className="stat-list">
                  <div>
                    <span>Gross margin</span>
                    <strong>
                      {solo?.price
                        ? ((100 * soloMargin) / solo.price).toFixed(1)
                        : 0}
                      %
                    </strong>
                  </div>
                  <div>
                    <span>Gross profit</span>
                    <strong>{money(soloMargin)}</strong>
                  </div>
                  <div>
                    <span>Products</span>
                    <strong>1 item</strong>
                  </div>
                </div>
              </div>
              <div className="evidence-panel paired">
                <div className="row spread">
                  <span className="eyebrow">Paired basket</span>
                  <Badge tone="green">{pairing.affinity}% affinity</Badge>
                </div>
                <div className="evidence-value">
                  {money(totalPrice)} <span>basket value</span>
                </div>
                <div className="stat-list">
                  <div>
                    <span>Gross margin</span>
                    <strong>
                      {totalPrice
                        ? ((100 * margin) / totalPrice).toFixed(1)
                        : 0}
                      %
                    </strong>
                  </div>
                  <div>
                    <span>Gross profit</span>
                    <strong>{money(margin)}</strong>
                  </div>
                  <div>
                    <span>Products</span>
                    <strong>{products.length} items</strong>
                  </div>
                </div>
                <div className="evidence-gain">
                  Additional unit profit{" "}
                  <strong>+{money(margin - soloMargin)}</strong>
                </div>
              </div>
            </div>
            <div className="affinity-summary">
              <div className="row spread">
                <h3>Basket co-occurrence</h3>
                <span className="small muted">Illustrative pairing model</span>
              </div>
              <div
                className="affinity-track"
                aria-label={`${pairing.affinity}% basket affinity`}
              >
                <span style={{ width: `${pairing.affinity}%` }} />
              </div>
              <div className="row spread small">
                <strong>{pairing.affinity}% purchased together</strong>
                <span className="muted">
                  {100 - pairing.affinity}% other baskets
                </span>
              </div>
            </div>
            <div className="callout warning">
              <div className="row">
                <Lightbulb size={18} />
                <strong>Merchandising observation</strong>
              </div>
              <p>{pairing.advice}</p>
            </div>
            {role === "store" && (
              <Link className="text-link" to="/app/transactions">
                Review imported receipt evidence →
              </Link>
            )}
          </Card>
          <Card className="card-pad stack">
            <div className="row spread">
              <div>
                <h2>Physical Shelf Placement Blueprint</h2>
                <p className="muted small">
                  Suggested placement at {pairing.location}
                </p>
              </div>
              <Badge tone="neutral">Concept schematic</Badge>
            </div>
            <div className="shelf blueprint">
              <div className="row spread blueprint-title">
                <strong>{pairing.location} · Front view</strong>
                <span className="small muted">4 shelf levels</span>
              </div>
              <div className="blueprint-grid">
                <div className="blueprint-shelves">
                  <div className="blueprint-level">
                    <span>Shelf 4 · Upper assortment</span>
                    <p>Existing products</p>
                  </div>
                  <div className="blueprint-level anchor">
                    <div className="row spread">
                      <strong>Shelf 3 · Eye-level anchor</strong>
                      <Badge>Primary</Badge>
                    </div>
                    {solo && (
                      <div className="blueprint-product">
                        <img src={solo.image} alt={solo.name} />
                        <div>
                          <strong>{solo.name}</strong>
                          <small>{solo.sku}</small>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="blueprint-level">
                    <span>Shelf 2 · Everyday assortment</span>
                    <p>Existing products</p>
                  </div>
                  <div className="blueprint-level">
                    <span>Shelf 1 · Lower assortment</span>
                    <p>Existing products</p>
                  </div>
                </div>
                <div className="blueprint-strip">
                  <span className="eyebrow">Attach clip-strip</span>
                  {products.slice(1).map((p) => (
                    <div className="strip-product" key={p.id}>
                      <img src={p.image} alt={p.name} />
                      <strong>{p.name}</strong>
                      <small>{p.sku}</small>
                    </div>
                  ))}
                  <div className="strip-guidance">
                    <span>Eye-level placement</span>
                    <span>Face shopper traffic</span>
                    <span>Keep aisle clear</span>
                  </div>
                  <Badge tone="green">Review clearance</Badge>
                </div>
              </div>
              <p className="blueprint-caption">
                Concept placement. Verify fixture load and aisle clearance in
                store.
              </p>
            </div>
            <LayoutLink className="button secondary">
              Open layout editor to assign this pairing →
            </LayoutLink>
          </Card>
        </div>
        <aside className="stack">
          <Card className="card-pad stack-sm">
            <div className="row spread">
              <h2>Execution Checklist</h2>
              <Badge>{pairing.minutes} mins</Badge>
            </div>
            {[
              "Confirm available product stock",
              "Choose a compatible shelf or endcap",
              "Approve pairing, then assign a layout slot",
            ].map((step, i) => (
              <div key={step} className="required-item">
                <div className="row">
                  <span className="step-number">{i + 1}</span>
                  <strong>{step}</strong>
                </div>
              </div>
            ))}
            <Button variant="secondary" onClick={workOrder}>
              Export staff work order
            </Button>
          </Card>
          <Card className="card-pad stack-sm">
            <h2>Inventory Feasibility</h2>
            <div className="stat-list">
              {products.map((p) => (
                <div key={p.id}>
                  <span>{p.name}</span>
                  <strong>{p.stock} units</strong>
                </div>
              ))}
              <div>
                <span>Available bundle sets</span>
                <strong>
                  {products.length
                    ? Math.min(...products.map((p) => p.stock))
                    : 0}
                </strong>
              </div>
            </div>
            <p className="small muted">Current catalog stock.</p>
          </Card>
          <div className="callout success stack-sm">
            <h3>Ready to activate this pairing?</h3>
            <p className="small">
              Add this pairing to your shelf plan, then activate a campaign.
            </p>
            {pairing.status === "approved" ? (
              <LayoutLink className="button primary">
                Place approved pairing
              </LayoutLink>
            ) : canReview ? (
              <Button onClick={() => setReview("approved")}>
                Approve pairing for layout
              </Button>
            ) : (
              <p className="small">
                Switch to a Store Administrator or Merchandiser to review.
              </p>
            )}
          </div>
          {canReview && pairing.status !== "rejected" && (
            <Button variant="ghost" onClick={() => setReview("rejected")}>
              Reject pairing
            </Button>
          )}
        </aside>
      </div>
      {review && (
        <ReviewDialog
          pairing={pairing}
          status={review}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  );
}

function LayoutLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  const { role } = useDemo();
  return role === "merchandiser" ? (
    <Link className={className} to="/app/layouts">
      {children}
    </Link>
  ) : (
    <span className="small muted">
      Switch to Merchandiser to assign approved pairings to a layout.
    </span>
  );
}
