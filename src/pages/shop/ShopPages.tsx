import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDemo } from "../../state/DemoContext";
import { Badge, Button, Card, Empty, PageHeader } from "../../components/ui";
import { money } from "../../domain/format";
import type { DemoState, Product } from "../../domain/models";
import "../../styles/extensions.css";
function activeBundles(state: DemoState) {
  const ids = new Set(
    state.campaigns
      .filter((c) => c.status === "active")
      .flatMap(
        (c) =>
          state.layouts
            .find((l) => l.id === c.layoutId)
            ?.slots.filter((x): x is string => !!x) ?? [],
      ),
  );
  return state.recommendations.filter(
    (r) => ids.has(r.id) && r.status === "approved",
  );
}
function ProductTile({ product: p }: { product: Product }) {
  const { run, busy } = useDemo();
  return (
    <Card className="shop-product">
      <Link to={`/shop/products/${p.id}`} className="shop-product-image">
        <img src={p.image} alt={p.name} />
      </Link>
      <div className="stack-sm card-pad">
        <span className="eyebrow">{p.category}</span>
        <Link className="product-name" to={`/shop/products/${p.id}`}>
          {p.name}
        </Link>
        <div className="row spread">
          <strong>{money(p.price)}</strong>
          <span className="small muted">{p.stock} in stock</span>
        </div>
        <Button
          variant="secondary"
          disabled={busy || p.stock === 0}
          onClick={() =>
            run(
              { type: "addCart", productIds: [p.id] },
              `${p.name} added to your basket.`,
            )
          }
        >
          {p.stock === 0 ? "Out of stock" : "Add to basket"}
        </Button>
      </div>
    </Card>
  );
}
export function ShopPage() {
  const { state } = useDemo();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const products = state.products.filter(
    (p) =>
      !p.archived &&
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const bundles = activeBundles(state);
  return (
    <div className="page stack">
      <section className="shop-hero">
        <div>
          <span className="eyebrow">THE CENTRAL MARKET EDIT</span>
          <h1>Good things belong together.</h1>
          <p>
            Everyday essentials. Thoughtful discoveries.
            <br />A little inspiration for your next basket.
          </p>
          <Link className="shop-cta" to="/shop/bundles">
            Explore curated pairings →
          </Link>
        </div>
        <img src="/assets/p1.png" alt="Artisan coffee from our market" />
      </section>
      {bundles.length > 0 && (
        <div className="callout row spread wrap">
          <div>
            <strong>
              Discover {bundles.length} curated{" "}
              {bundles.length === 1 ? "pairing" : "pairings"}
            </strong>
            <p className="muted small">
              Selected for you from our current store display.
            </p>
          </div>
          <Link className="text-link" to="/shop/bundles">
            Shop the collection →
          </Link>
        </div>
      )}
      <div className="row spread wrap">
        <h2>Explore the market</h2>
        <Link className="text-link" to="/shop/cart">
          Your basket ({Object.values(state.cart).reduce((a, b) => a + b, 0)}) →
        </Link>
      </div>
      <div className="toolbar">
        <input
          className="input"
          aria-label="Search products"
          placeholder="Find something delicious…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="select"
          aria-label="Product category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>
          {state.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="shop-grid">
        {products.map((p) => (
          <ProductTile key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && (
        <Empty
          title="No products found"
          description="Try another category or search term."
        />
      )}
    </div>
  );
}
export function ProductPage() {
  const { id } = useParams();
  const { state, run, busy } = useDemo();
  const p = state.products.find((p) => p.id === id && !p.archived);
  if (!p)
    return (
      <div className="page">
        <Empty
          title="Product unavailable"
          description="Return to the market to discover our current selection."
        >
          <Link to="/shop">Browse products</Link>
        </Empty>
      </div>
    );
  const relatedIds = new Set(
    activeBundles(state)
      .filter((r) => r.productIds.includes(p.id))
      .flatMap((r) => r.productIds),
  );
  const related = state.products
    .filter(
      (item) =>
        item.id !== p.id &&
        !item.archived &&
        (relatedIds.has(item.id) || item.category === p.category),
    )
    .slice(0, 3);
  return (
    <div className="page stack">
      <Link className="text-link" to="/shop">
        ← Back to the market
      </Link>
      <div className="product-detail">
        <div className="detail-photo">
          <img src={p.image} alt={p.name} />
        </div>
        <div className="stack">
          <PageHeader
            eyebrow={p.category}
            title={p.name}
            description={p.description}
          />
          <strong className="product-price">{money(p.price)}</strong>
          <p className="muted">
            {p.stock > 0
              ? `${p.stock} available in our store`
              : "Currently out of stock"}{" "}
            · SKU {p.sku}
          </p>
          <Button
            disabled={busy || p.stock === 0}
            onClick={() =>
              run(
                { type: "addCart", productIds: [p.id] },
                `${p.name} added to your basket.`,
              )
            }
          >
            Add to basket
          </Button>
          <Link className="text-link" to="/shop/cart">
            View your basket →
          </Link>
        </div>
      </div>
      {related.length > 0 && (
        <section className="stack">
          <h2>Good alongside your selection</h2>
          <div className="shop-grid">
            {related.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export function BundlesPage() {
  const { state, run, busy } = useDemo();
  const bundles = activeBundles(state);
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="The market / Curated pairings"
        title="Better together"
        description="Thoughtfully paired products from our active in-store displays."
        actions={
          <Link className="text-link" to="/shop/cart">
            View basket →
          </Link>
        }
      />
      {bundles.length ? (
        <div className="grid-2">
          {bundles.map((r) => {
            const ps = r.productIds
              .map((id) => state.products.find((p) => p.id === id))
              .filter((p): p is Product => !!p);
            return (
              <Card key={r.id} className="card-pad stack">
                <Badge tone="green">Store-selected pairing</Badge>
                <div className="bundle-images">
                  {ps.map((p) => (
                    <Link to={`/shop/products/${p.id}`} key={p.id}>
                      <img src={p.image} alt={p.name} />
                    </Link>
                  ))}
                </div>
                <h2>{r.title}</h2>
                <p className="muted">{ps.map((p) => p.name).join(" + ")}</p>
                <div className="row spread">
                  <strong>
                    {money(ps.reduce((sum, p) => sum + p.price, 0))}
                  </strong>
                  <span className="small muted">
                    {ps.length} products · regular prices
                  </span>
                </div>
                <Button
                  disabled={busy}
                  onClick={() =>
                    run(
                      { type: "addCart", productIds: r.productIds },
                      "The complete pairing was added to your basket.",
                    )
                  }
                >
                  Add complete pairing
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty
          title="A new collection is on its way"
          description="Our team is preparing the next display. Explore the full market while we curate it."
        >
          <Link className="text-link" to="/shop">
            Browse all products →
          </Link>
        </Empty>
      )}
      <Link className="text-link" to="/shop">
        ← Explore the market
      </Link>
    </div>
  );
}
export function CartPage() {
  const { state, run, busy } = useDemo();
  const entries = Object.entries(state.cart)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => ({ p: state.products.find((p) => p.id === id), q }))
    .filter((x): x is { p: Product; q: number } => !!x.p);
  const total = entries.reduce((sum, { p, q }) => sum + p.price * q, 0);
  return (
    <div className="page stack">
      <PageHeader
        eyebrow="The market / Your basket"
        title="Your good finds"
        description="Update quantities and keep discovering. This demo basket does not process payments."
      />
      {entries.length ? (
        <div className="split">
          <Card className="card-pad stack">
            {entries.map(({ p, q }) => (
              <div className="cart-item" key={p.id}>
                <img src={p.image} alt={p.name} />
                <div className="stack-sm">
                  <Link className="product-name" to={`/shop/products/${p.id}`}>
                    {p.name}
                  </Link>
                  <span className="small muted">
                    {money(p.price)} each · {p.stock} in stock
                  </span>
                  <div className="row">
                    <label htmlFor={`quantity-${p.id}`} className="small">
                      Quantity
                    </label>
                    <input
                      id={`quantity-${p.id}`}
                      className="input cart-quantity"
                      type="number"
                      min="1"
                      max={p.stock}
                      value={q}
                      disabled={busy}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isInteger(v) && v > 0)
                          run({
                            type: "setCartQuantity",
                            productId: p.id,
                            quantity: v,
                          });
                      }}
                    />
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        run(
                          {
                            type: "setCartQuantity",
                            productId: p.id,
                            quantity: 0,
                          },
                          "Product removed.",
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <strong>{money(p.price * q)}</strong>
              </div>
            ))}
          </Card>
          <Card className="card-pad stack-sm basket-summary">
            <span className="eyebrow">BASKET SUMMARY</span>
            <h2>
              {entries.reduce((sum, x) => sum + x.q, 0)} items, thoughtfully
              chosen.
            </h2>
            <div className="row spread divider">
              <span>Subtotal</span>
              <strong>{money(total)}</strong>
            </div>
            <p className="muted small">
              Demo basket only. Tax, delivery, checkout and payment are outside
              this prototype.
            </p>
            <Link className="shop-cta" to="/shop">
              Continue shopping →
            </Link>
          </Card>
        </div>
      ) : (
        <Empty
          title="Your basket is ready for discovery"
          description="Explore everyday essentials and our store-selected pairings."
        >
          <Link className="shop-cta" to="/shop">
            Explore the market →
          </Link>
        </Empty>
      )}
    </div>
  );
}
