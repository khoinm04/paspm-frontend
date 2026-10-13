import { ArrowRight, Check, Lightbulb, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Recommendation } from "../domain/models";
import { useDemo } from "../state/DemoContext";
import { Badge, Button, Card } from "./ui";
export const dollars = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export function PairingCard({
  pairing,
  review = true,
  actions,
}: {
  pairing: Recommendation;
  review?: boolean;
  actions?: ReactNode;
}) {
  const { state, run, role } = useDemo();
  const products = pairing.productIds
    .map((id) => state.products.find((p) => p.id === id))
    .filter((p) => !!p);
  return (
    <Card className="pair-card">
      <div className="row spread wrap pair-heading">
        <div className="row">
          <span className="pair-rank">
            Rank #{pairing.id.replace("r", "").padStart(2, "0")} ·{" "}
            <span>{pairing.title}</span>
          </span>
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
        </div>
        <span className="small muted">{pairing.minutes} min setup</span>
      </div>
      <div className="pair-products">
        {products.map((product, index) => (
          <div key={product.id} style={{ display: "contents" }}>
            {index > 0 && (
              <div className="pair-plus">
                <Plus size={14} />
              </div>
            )}
            <div className="pair-product">
              <img
                className="product-thumb"
                src={product.image}
                alt={product.name}
              />
              <div>
                <span className="eyebrow">{product.category}</span>
                <strong>{product.name}</strong>
                <small>SKU: {product.sku}</small>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="pair-stats">
        <div>
          <span className="eyebrow">Est. monthly profit lift</span>
          <strong>+{dollars(pairing.lift)}</strong>
          <small>Simulated opportunity</small>
        </div>
        <div>
          <span className="eyebrow">Basket affinity</span>
          <strong>{pairing.affinity}%</strong>
          <small>Purchased together</small>
        </div>
        <div>
          <span className="eyebrow">Recommended location</span>
          <strong style={{ fontSize: 14 }}>{pairing.location}</strong>
          <small>{pairing.minutes} min shelf adjustment</small>
        </div>
      </div>
      <div className="pair-advice">
        <Lightbulb size={16} />
        <span>
          <strong>Why this works: </strong>
          {pairing.advice}
        </span>
      </div>
      <div className="pair-footer">
        <p>Placement: {pairing.location}</p>
        <div className="actions">
          <Link
            className="button secondary"
            to={`/app/recommendations/${pairing.id}`}
          >
            View Pairing Details <ArrowRight size={15} />
          </Link>
          {actions}
          {review &&
            ["merchandiser", "store"].includes(role) &&
            pairing.status === "pending" && (
              <Button
                onClick={() =>
                  run(
                    {
                      type: "reviewRecommendation",
                      id: pairing.id,
                      status: "approved",
                    },
                    "Pairing approved. Ready for your planogram.",
                  )
                }
              >
                <Check size={16} /> Approve
              </Button>
            )}
        </div>
      </div>
    </Card>
  );
}
