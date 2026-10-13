import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  Database,
  Download,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Field,
  Metric,
  Modal,
  PageHeader,
  Progress,
} from "../../components/ui";
import { useDemo } from "../../state/DemoContext";
import { downloadText, money } from "../../domain/format";
const columns = ["receipt_id", "sku", "quantity", "price", "timestamp"];
export function ImportPage() {
  const { state, run, busy, notify } = useDemo();
  const input = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState(false);
  const [mapped, setMapped] = useState(false);
  const [help, setHelp] = useState(false);
  const [source, setSource] = useState<{
    name: string;
    text: string;
  } | null>(null);
  const [mappingValues, setMappingValues] = useState<Record<string, string>>(
    {},
  );
  const batch =
    selection === null
      ? null
      : selection === "latest"
        ? state.imports[0]
        : state.imports.find((b) => b.id === selection);
  const rejected = !!localError || batch?.status === "rejected";
  const ready = !!batch && batch.status !== "rejected";
  const issues = localError ? [localError] : batch?.issues || [];
  const sample = () => {
    const p = state.products.filter((p) => !p.archived);
    return [
      "receipt_id,sku,quantity,price,timestamp",
      ...p
        .slice(0, 6)
        .map(
          (product, i) =>
            `REC-${Math.floor(i / 2) + 1001},${product.sku},${(i % 2) + 1},${(product.price / 100).toFixed(2)},2026-10-10T10:15:00Z`,
        ),
    ].join("\n");
  };
  const submit = async (name: string, text: string) => {
    setLoading(true);
    setLocalError("");
    setMapped(false);
    setFileName(name);
    setSource({ name, text });
    setSelection(null);
    try {
      if (await run({ type: "importCsv", name, text })) {
        setSelection("latest");
      }
    } finally {
      setLoading(false);
    }
  };
  const upload = async (file: File) => {
    setFileName(file.name);
    setSelection(null);
    setMapped(false);
    setSource(null);
    setLocalError("");
    if (file.size > 50 * 1024 * 1024) {
      setLocalError(
        "File exceeds the 50 MB limit. Split the export into smaller CSV batches.",
      );
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setLocalError(
        "Unsupported file type. Upload a CSV file. Excel files must be exported as CSV; the Excel demo below is a simulation.",
      );
      return;
    }
    setLoading(true);
    try {
      const text = await file.text();
      await submit(file.name, text);
    } catch {
      setLocalError("This file could not be read. Select another CSV file.");
    } finally {
      setLoading(false);
      if (input.current) input.current.value = "";
    }
  };
  const chooseDemo = (kind: "valid" | "warning" | "invalid" | "excel") => {
    let text = sample();
    if (kind === "warning")
      text += "\nREC-INVALID,UNKNOWN-SKU,-1,4.5,not-a-date";
    if (kind === "invalid") text = "product_name,units\nCoffee,2";
    void submit(
      kind === "excel"
        ? "Excel-export-simulation.csv"
        : `demo-${kind}-transactions.csv`,
      text,
    );
    if (kind === "excel")
      notify(
        "Excel simulation uses sample CSV data. Actual Excel parsing is not supported.",
      );
  };
  const clear = () => {
    setSelection(null);
    setLocalError("");
    setFileName("");
    setSource(null);
    setMapped(false);
  };
  const exportIssues = () =>
    downloadText(
      "import-issues.csv",
      "issue\n" +
        issues
          .map((issue) => '"' + issue.replaceAll('"', '""') + '"')
          .join("\n"),
    );
  const openMapping = () => {
    const headers = (source?.text.split(/\r?\n/)[0] || columns.join(","))
      .replace(/^\uFEFF/, "")
      .split(",")
      .map((v) => v.trim());
    setMappingValues(
      Object.fromEntries(columns.map((c) => [c, headers.includes(c) ? c : ""])),
    );
    setMapping(true);
  };
  return (
    <div className="page stack">
      <div className="breadcrumbs">
        <Link to="/app/overview">Home</Link>
        <span>/</span>
        <span>Data Management</span>
        <span>/</span>
        <span>Import POS Transactions</span>
      </div>
      <PageHeader
        title="Import POS Transaction Data"
        description="Upload your store’s receipt logs and checkout sales. Discover which products shoppers buy together and plan complementary shelf placements."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => downloadText("sample-store-ledger.csv", sample())}
            >
              <Download size={15} />
              Download Sample Store Ledger
            </Button>
            <Button variant="ghost" onClick={() => setHelp(true)}>
              <BookOpen size={15} />
              Documentation
            </Button>
          </>
        }
      />
      <Card className="stepper">
        {[
          [
            "Upload File",
            loading
              ? "Validating your receipt batch"
              : rejected
                ? "Fix the file and re-upload"
                : ready
                  ? "Receipt batch validated"
                  : "Select or drag a receipt batch",
          ],
          [
            "Column Mapping",
            mapped
              ? "Column mapping confirmed"
              : "Match your transaction columns",
          ],
          ["Product Pairings & Placement", "Simulated shelf recommendations"],
        ].map(([title, detail], i) => (
          <div
            key={title}
            className={`step ${i === 0 ? (rejected ? "warning" : ready ? "complete" : "active") : i === 1 && mapped && ready ? "complete" : ""}`}
          >
            <div className="step-number">
              {i === 0 && ready ? <Check size={16} /> : i + 1}
            </div>
            <div>
              <div className="eyebrow">
                STEP 0{i + 1} ·{" "}
                {i === 0
                  ? loading
                    ? "VALIDATING"
                    : rejected
                      ? "REJECTED"
                      : ready
                        ? "COMPLETE"
                        : "ACTIVE"
                  : i === 1 && mapped && ready
                    ? "COMPLETE"
                    : "UPCOMING"}
              </div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
          </div>
        ))}
      </Card>
      <div className="split">
        <div className="stack">
          {(!batch && !localError) || loading ? (
            <Card className="card-pad">
              <div
                className={`drop-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && !loading && !busy) void upload(file);
                }}
              >
                <div className="upload-icon">
                  <UploadCloud size={30} />
                </div>
                <h2>
                  {loading
                    ? "Validating your transaction file…"
                    : "Drag & drop your store sales file here"}
                </h2>
                <p>
                  Upload daily or weekly transactions as CSV. Files up to 50 MB
                  are supported. Export Excel spreadsheets to CSV first.
                </p>
                {loading ? (
                  <Progress value={50} label="Reading and validating" />
                ) : (
                  <Button
                    onClick={() => input.current?.click()}
                    disabled={busy}
                  >
                    <FileSpreadsheet size={16} />
                    Browse Files
                  </Button>
                )}
                <div className="format-tags">
                  <span>.CSV</span>
                  <span>UTF-8</span>
                  <span>50 MB maximum</span>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="file-summary">
                <div className="file-icon">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="file-meta">
                  <strong>{batch?.name || fileName}</strong>
                  <p>
                    {batch
                      ? `${batch.rows.length} usable rows · ${new Date(batch.createdAt).toLocaleString()}`
                      : "Upload not accepted"}
                  </p>
                </div>
                <Badge
                  tone={
                    rejected
                      ? "red"
                      : batch?.status === "warning"
                        ? "orange"
                        : "green"
                  }
                >
                  {rejected
                    ? "Rejected"
                    : batch?.status === "warning"
                      ? "Warnings detected"
                      : "Ready to use"}
                </Badge>
              </Card>
              <Card className="card-pad stack">
                <div
                  className={`callout ${rejected ? "error" : batch?.status === "warning" ? "warning" : "success"}`}
                >
                  <div className="row">
                    <AlertCircle size={20} />
                    <strong>
                      {rejected
                        ? "File rejected: action required"
                        : batch?.status === "warning"
                          ? "Some rows were excluded"
                          : "All transaction rows passed validation"}
                    </strong>
                  </div>
                  <p>
                    {rejected
                      ? "Correct the issues below and upload the revised CSV. No unusable data is included in analysis."
                      : batch?.status === "warning"
                        ? "Valid rows are available for analysis. Invalid rows were excluded rather than automatically repaired."
                        : "Receipt IDs, known SKUs, quantities, sale prices and timestamps are ready for analysis."}
                  </p>
                </div>
                {issues.length > 0 && (
                  <div className="stack-sm">
                    {issues.map((issue, i) => (
                      <div key={i} className="required-item">
                        <strong>Issue {String(i + 1).padStart(2, "0")}</strong>
                        <p>{issue}</p>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={exportIssues}>
                      <Download size={15} />
                      Export Issues Log (.CSV)
                    </Button>
                  </div>
                )}
                {batch && batch.rows.length > 0 && (
                  <>
                    <div className="row spread">
                      <h2 className="section-title">Data preview</h2>
                      <span className="small muted">
                        First {Math.min(5, batch.rows.length)} of{" "}
                        {batch.rows.length} usable rows
                      </span>
                    </div>
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Receipt ID</th>
                            <th>Timestamp</th>
                            <th>SKU / product</th>
                            <th>Qty</th>
                            <th>Unit price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batch.rows.slice(0, 5).map((r, i) => (
                            <tr key={i}>
                              <td>
                                <strong>{r.receiptId}</strong>
                              </td>
                              <td>{r.timestamp}</td>
                              <td>
                                {r.sku}
                                <div className="small muted">
                                  {
                                    state.products.find((p) => p.sku === r.sku)
                                      ?.name
                                  }
                                </div>
                              </td>
                              <td>{r.quantity}</td>
                              <td>{money(r.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Card>
              {rejected && (
                <Card className="card-pad">
                  <div
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) void upload(f);
                    }}
                  >
                    <UploadCloud size={28} />
                    <h2>Upload corrected file to re-validate</h2>
                    <p>
                      Check column names, valid product SKUs and ISO timestamps
                      before submitting again.
                    </p>
                    <div className="actions">
                      <Button onClick={() => input.current?.click()}>
                        Select Repaired POS CSV File
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          downloadText("clean-pos-template.csv", sample())
                        }
                      >
                        <Download size={15} />
                        Download Clean Sample Template
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            aria-label="Upload transaction CSV"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Card className="card-pad stack-sm">
            <div className="row spread">
              <h2 className="section-title">Try a demo receipt batch</h2>
              <Badge tone="neutral">Demo fixtures</Badge>
            </div>
            <p className="small muted">
              Explore each validation state without preparing a file.
            </p>
            <div className="actions">
              <Button
                variant="secondary"
                disabled={loading || busy}
                onClick={() => chooseDemo("valid")}
              >
                Load valid sample
              </Button>
              <Button
                variant="secondary"
                disabled={loading || busy}
                onClick={() => chooseDemo("warning")}
              >
                Load warning sample
              </Button>
              <Button
                variant="secondary"
                disabled={loading || busy}
                onClick={() => chooseDemo("invalid")}
              >
                Load rejected sample
              </Button>
              <Button
                variant="ghost"
                disabled={loading || busy}
                onClick={() => chooseDemo("excel")}
              >
                Simulate Excel export
              </Button>
            </div>
          </Card>
          <Card className="card-pad stack">
            <div className="row spread">
              <div>
                <h2 className="section-title">Direct POS & Cloud Connectors</h2>
                <p className="small muted">
                  Configure simulated checkout and warehouse connections.
                </p>
              </div>
              <Badge>Demo connections</Badge>
            </div>
            <div className="grid-2">
              {["Retail POS Sync", "Cloud Storage & Warehouses"].map((name) => (
                <div className="required-item stack-sm" key={name}>
                  <Database size={22} />
                  <h3>{name}</h3>
                  <p>
                    Connection status and sync timestamps are simulated. No
                    external data is transferred.
                  </p>
                  <Link className="text-link" to="/app/integrations">
                    Configure connection <ArrowRight size={15} />
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <aside className="stack">
          <Card className="card-pad stack-sm">
            <div className="row spread">
              <h2>
                {batch || localError
                  ? "Data Quality Summary"
                  : "Required Information"}
              </h2>
              <Badge tone={rejected ? "red" : ready ? "green" : "neutral"}>
                {rejected
                  ? "Action required"
                  : ready
                    ? "Validated"
                    : "Auto-detects"}
              </Badge>
            </div>
            {batch && (
              <>
                <Progress
                  value={
                    batch.status === "rejected"
                      ? 0
                      : (100 * batch.rows.length) /
                        (batch.rows.length +
                          batch.issues.filter((s) => s.startsWith("Row "))
                            .length)
                  }
                  label="Usable rows"
                />
                <div className="grid-2">
                  <Metric label="Usable rows" value={batch.rows.length} />
                  <Metric label="Issues" value={batch.issues.length} />
                </div>
                <p className="small muted">
                  {new Set(batch.rows.map((r) => r.receiptId)).size} shopper
                  baskets recognized
                </p>
              </>
            )}
            {columns.map((column, i) => (
              <div key={column} className="required-item">
                <div className="row spread">
                  <strong>
                    {
                      [
                        "Receipt Number",
                        "Product SKU / Barcode",
                        "Quantity",
                        "Unit Sale Price",
                        "Checkout Timestamp",
                      ][i]
                    }
                  </strong>
                  <Badge tone="neutral">Required</Badge>
                </div>
                <p>
                  <code>{column}</code> ·{" "}
                  {
                    [
                      "Group items from the same checkout",
                      "Must match an existing catalog SKU",
                      "Positive whole units",
                      "Dollar amount, e.g. 3.49",
                      "ISO date and time",
                    ][i]
                  }
                </p>
              </div>
            ))}
            <Button
              variant="secondary"
              onClick={() =>
                downloadText("pos-template.csv", columns.join(",") + "\n")
              }
            >
              <Download size={15} />
              Download CSV Template
            </Button>
          </Card>
          {rejected && (
            <Card className="card-pad stack-sm">
              <h2>Store Manager Fast Fix Checklist</h2>
              <p className="small">1. Use the exact required headers.</p>
              <p className="small">
                2. Remove blank receipts and unknown SKUs.
              </p>
              <p className="small">
                3. Use positive quantities and valid timestamps.
              </p>
              {source && (
                <Button variant="secondary" onClick={openMapping}>
                  Map alternative column names
                </Button>
              )}
            </Card>
          )}
          <Card className="card-pad stack-sm">
            <div className="row spread">
              <h2>Recent Ingestion Logs</h2>
              <Link to="/app/transactions" className="text-link">
                View all
              </Link>
            </div>
            {state.imports.slice(0, 3).map((b) => (
              <button
                key={b.id}
                className="history-item"
                type="button"
                onClick={() => {
                  setSelection(b.id);
                  setLocalError("");
                  setSource(null);
                  setMapped(false);
                }}
              >
                <div className="row spread">
                  <strong>{b.name}</strong>
                  <Badge
                    tone={
                      b.status === "rejected"
                        ? "red"
                        : b.status === "warning"
                          ? "orange"
                          : "green"
                    }
                  >
                    {b.status}
                  </Badge>
                </div>
                <p>
                  {b.rows.length} usable rows ·{" "}
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </Card>
          <div className="note-card">
            <div className="row">
              <BookOpen size={19} />
              <h3>How PlanogramIQ uses this</h3>
            </div>
            <p>
              Receipt groups reveal products customers buy together. Valid
              transaction data supports simulated product pairing and
              complementary shelf plans.
            </p>
            <p>
              Your data remains in this browser. No real mining or POS
              integration runs.
            </p>
          </div>
        </aside>
      </div>
      <div className="footer-bar">
        <Button variant="ghost" onClick={clear}>
          Cancel import
        </Button>
        <div className="actions">
          {(batch || localError) && (
            <Button variant="secondary" onClick={() => input.current?.click()}>
              Upload another file
            </Button>
          )}
          <span className="small muted">
            {rejected
              ? "Cannot proceed until usable rows are imported"
              : mapped
                ? "Column mapping confirmed"
                : ready
                  ? "Valid rows ready for mapping"
                  : "Select a CSV to continue"}
          </span>
          {mapped && ready ? (
            <Link className="button primary" to="/app/mining/setup">
              Continue to Product Pairing <ArrowRight size={16} />
            </Link>
          ) : (
            <Button disabled={!ready || busy || loading} onClick={openMapping}>
              Continue to Column Mapping <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
      {mapping && (
        <Modal title="Column mapping" onClose={() => setMapping(false)}>
          <form
            className="stack-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                new Set(Object.values(mappingValues)).size !== columns.length ||
                Object.values(mappingValues).some((v) => !v)
              ) {
                notify(
                  "Map each required field to a different source column.",
                  "error",
                );
                return;
              }
              if (source && columns.some((c) => mappingValues[c] !== c)) {
                const headers = source.text
                  .split(/\r?\n/)[0]
                  .replace(/^\uFEFF/, "")
                  .split(",")
                  .map((v) => v.trim());
                const renamed = headers.map(
                  (h) => columns.find((c) => mappingValues[c] === h) || h,
                );
                const text = [
                  renamed.join(","),
                  ...source.text.split(/\r?\n/).slice(1),
                ].join("\n");
                if (
                  await run(
                    { type: "importCsv", name: source.name, text },
                    "Column mapping confirmed",
                  )
                ) {
                  setSelection("latest");
                  setLocalError("");
                  setMapped(true);
                  setMapping(false);
                }
              } else {
                setMapped(true);
                setMapping(false);
                notify("Existing validated columns confirmed.");
              }
            }}
          >
            <p className="muted small">
              Map header names to the five required fields. Values are validated
              again; matching columns does not repair invalid rows.
            </p>
            {columns.map((c) => (
              <Field key={c} label={c}>
                <select
                  className="select"
                  required
                  value={mappingValues[c] || ""}
                  onChange={(e) =>
                    setMappingValues({ ...mappingValues, [c]: e.target.value })
                  }
                >
                  <option value="">Select source column</option>
                  {(source?.text.split(/\r?\n/)[0] || columns.join(","))
                    .replace(/^\uFEFF/, "")
                    .split(",")
                    .map((h) => h.trim())
                    .map((h, i) => (
                      <option key={i} value={h}>
                        {h}
                      </option>
                    ))}
                </select>
              </Field>
            ))}
            <Button type="submit" disabled={busy}>
              Confirm mapping
            </Button>
          </form>
        </Modal>
      )}
      {help && (
        <Modal title="POS import documentation" onClose={() => setHelp(false)}>
          <div className="stack-sm">
            <p>
              CSV must include receipt_id, sku, quantity, price and timestamp.
              Prices are in dollars; the demo stores money in cents. Use catalog
              SKUs and ISO timestamps.
            </p>
            <p>
              Valid rows are retained. Invalid rows are excluded with an issue
              log. Missing headers or no valid rows rejects the batch. Excel
              export is a labeled sample simulation.
            </p>
            <Button
              variant="secondary"
              onClick={() => downloadText("sample-store-ledger.csv", sample())}
            >
              Download sample CSV
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
