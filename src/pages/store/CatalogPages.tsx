import { useState } from "react";
import { Link } from "react-router-dom";
import { useDemo } from "../../state/DemoContext";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Modal,
  PageHeader,
} from "../../components/ui";
import { money } from "../../domain/format";
import type { Product } from "../../domain/models";
export function ProductsPage() {
  const { state, run, busy } = useDemo();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [remove, setRemove] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const products = state.products
    .filter(
      (p) =>
        !p.archived &&
        `${p.name} ${p.sku} ${p.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price" ? a.price - b.price : a.name.localeCompare(b.name),
    );
  const pages = Math.max(1, Math.ceil(products.length / 8));
  const current = Math.min(page, pages);
  const save = async () => {
    if (!editing) return;
    if (
      !editing.name.trim() ||
      !editing.sku.trim() ||
      !editing.category ||
      editing.price <= 0 ||
      editing.cost > editing.price ||
      [editing.price, editing.cost, editing.stock].some(
        (v) => !Number.isFinite(v) || v < 0,
      ) ||
      !Number.isInteger(editing.stock)
    ) {
      setError(
        "Enter a name, unique SKU and category. Values must be non-negative, stock a whole number, and cost no greater than price.",
      );
      return;
    }
    if (
      state.products.some(
        (p) =>
          p.id !== editing.id &&
          p.sku.toLowerCase() === editing.sku.trim().toLowerCase(),
      )
    ) {
      setError("This SKU already exists.");
      return;
    }
    if (
      await run(
        {
          type: "saveProduct",
          product: {
            ...editing,
            name: editing.name.trim(),
            sku: editing.sku.trim(),
          },
        },
        "Product saved",
      )
    )
      setEditing(null);
  };
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="STORE CATALOG"
        title="Products"
        description="Maintain the products used in basket analysis and the customer catalog."
        actions={
          <Button
            onClick={() => {
              setError("");
              setEditing({
                id: crypto.randomUUID(),
                name: "",
                sku: "",
                category: state.categories[0] || "",
                price: 0,
                cost: 0,
                stock: 0,
                image: "",
                description: "",
              });
            }}
          >
            Add product
          </Button>
        }
      />
      <Card className="card-pad stack-sm">
        <div className="toolbar">
          <input
            className="input"
            aria-label="Search products"
            placeholder="Search name, SKU or category"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="select"
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="price">Price low to high</option>
          </select>
        </div>
        {products.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price / cost</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice((current - 1) * 8, current * 8).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>{p.sku}</td>
                      <td>{p.category}</td>
                      <td>
                        {money(p.price)} / {money(p.cost)}
                      </td>
                      <td>
                        <Badge tone={p.stock ? "green" : "orange"}>
                          {p.stock}
                        </Badge>
                      </td>
                      <td>
                        <div className="actions">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setError("");
                              setEditing({ ...p });
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setRemove(p)}>
                            Archive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row spread">
              <span className="muted small">
                {products.length} products · Page {current} of {pages}
              </span>
              <div className="actions">
                <Button
                  variant="secondary"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Empty
            title="No products found"
            description="Try another search or add a product."
          />
        )}
      </Card>
      {editing && (
        <Modal
          title={
            state.products.some((p) => p.id === editing.id)
              ? "Edit product"
              : "Add product"
          }
          onClose={() => setEditing(null)}
        >
          <form
            className="stack-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div className="form-grid">
              {(["name", "sku"] as const).map((key) => (
                <Field
                  key={key}
                  label={key === "name" ? "Product name" : "SKU"}
                >
                  <input
                    required
                    className="input"
                    value={editing[key]}
                    onChange={(e) =>
                      setEditing({ ...editing, [key]: e.target.value })
                    }
                  />
                </Field>
              ))}
              <Field label="Category">
                <select
                  required
                  className="select"
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {state.categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              {(["price", "cost", "stock"] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    key === "stock"
                      ? "Stock"
                      : `${key === "price" ? "Price" : "Cost"} ($)`
                  }
                >
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step={key === "stock" ? "1" : "0.01"}
                    required
                    value={key === "stock" ? editing[key] : editing[key] / 100}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        [key]:
                          key === "stock"
                            ? Number(e.target.value)
                            : Math.round(Number(e.target.value) * 100),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Field label="Description">
              <textarea
                className="input"
                value={editing.description}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
                }
              />
            </Field>
            {error && (
              <p role="alert" className="callout error">
                {error}
              </p>
            )}
            <div className="actions">
              <Button type="submit" disabled={busy}>
                Save product
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Archive product?" onClose={() => setRemove(null)}>
          <p>
            {remove.name} will leave the available catalog. Existing history is
            retained.
          </p>
          <div className="actions">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    { type: "deleteProduct", id: remove.id },
                    "Product archived",
                  )
                )
                  setRemove(null);
              }}
            >
              Archive product
            </Button>
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function CategoriesPage() {
  const { state, run, busy } = useDemo();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{
    name: string;
    previous?: string;
  } | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="STORE CATALOG"
        title="Categories"
        description="Organize products into departments for merchandising rules."
        actions={
          <Button
            onClick={() => {
              setError("");
              setEditing({ name: "" });
            }}
          >
            Add category
          </Button>
        }
      />
      <Card className="card-pad stack-sm">
        <input
          className="input"
          aria-label="Search categories"
          placeholder="Search categories"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Available products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.categories
                .filter((c) => c.toLowerCase().includes(query.toLowerCase()))
                .sort()
                .map((c) => (
                  <tr key={c}>
                    <td>
                      <strong>{c}</strong>
                    </td>
                    <td>
                      {
                        state.products.filter(
                          (p) => !p.archived && p.category === c,
                        ).length
                      }
                    </td>
                    <td>
                      <div className="actions">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setError("");
                            setEditing({ name: c, previous: c });
                          }}
                        >
                          Rename
                        </Button>
                        <Button variant="ghost" onClick={() => setRemove(c)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
      {editing && (
        <Modal
          title={editing.previous ? "Rename category" : "Add category"}
          onClose={() => setEditing(null)}
        >
          <form
            className="stack-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editing.name.trim()) {
                setError("Category name is required.");
                return;
              }
              if (
                state.categories.some(
                  (c) =>
                    c !== editing.previous &&
                    c.toLowerCase() === editing.name.trim().toLowerCase(),
                )
              ) {
                setError("This category already exists.");
                return;
              }
              if (
                await run(
                  {
                    type: "saveCategory",
                    name: editing.name.trim(),
                    previous: editing.previous,
                  },
                  "Category saved",
                )
              )
                setEditing(null);
            }}
          >
            <Field label="Category name" error={error}>
              <input
                required
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </Field>
            <Button type="submit" disabled={busy}>
              Save category
            </Button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Delete category?" onClose={() => setRemove(null)}>
          <p>
            Delete {remove}? Categories containing products must be emptied
            first.
          </p>
          <div className="actions">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (
                  await run(
                    { type: "deleteCategory", name: remove },
                    "Category deleted",
                  )
                )
                  setRemove(null);
              }}
            >
              Delete category
            </Button>
            <Button variant="secondary" onClick={() => setRemove(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function TransactionsPage() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [batch, setBatch] = useState("all");
  const [page, setPage] = useState(1);
  const rows = state.imports
    .filter(
      (b) => b.status !== "rejected" && (batch === "all" || batch === b.id),
    )
    .flatMap((b) =>
      b.rows.map((r, i) => ({ ...r, key: `${b.id}-${i}`, batch: b.name })),
    )
    .filter((r) =>
      `${r.receiptId} ${r.sku}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const pages = Math.max(1, Math.ceil(rows.length / 12));
  const current = Math.min(page, pages);
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="POS DATA"
        title="Transactions"
        description="Validated imported line items. Revenue reflects quantity multiplied by sale price."
        actions={
          <Link className="text-link" to="/app/import">
            Import POS data →
          </Link>
        }
      />
      <Card className="card-pad stack-sm">
        <div className="toolbar">
          <input
            className="input"
            aria-label="Search transactions"
            placeholder="Search receipt or SKU"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="select"
            aria-label="Import batch"
            value={batch}
            onChange={(e) => {
              setBatch(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All accepted batches</option>
            {state.imports
              .filter((b) => b.status !== "rejected")
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
        {rows.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt / batch</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Revenue</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice((current - 1) * 12, current * 12).map((r) => (
                    <tr key={r.key}>
                      <td>
                        {r.receiptId}
                        <div className="small muted">{r.batch}</div>
                      </td>
                      <td>{r.sku}</td>
                      <td>{r.quantity}</td>
                      <td>{money(r.quantity * r.price)}</td>
                      <td>{r.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row spread">
              <span className="small muted">
                {rows.length} lines · Page {current} of {pages}
              </span>
              <div className="actions">
                <Button
                  variant="secondary"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Empty
            title="No matching transactions"
            description="Import a CSV or adjust your filters."
          />
        )}
      </Card>
    </div>
  );
}
