import type {
  DemoAction,
  DemoState,
  Role,
  MiningConfig,
} from "../domain/models";
import { createSeed } from "../mocks/fixtures";
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const KEY = "paspm-demo-v1";
const allowed: Record<Role, string[]> = {
  system: [
    "saveUser",
    "deleteUser",
    "saveConnection",
    "syncConnection",
    "saveUtility",
    "saveConfig",
    "startMining",
    "cancelMining",
    "completeMining",
    "failMining",
    "reset",
  ],
  store: [
    "saveProduct",
    "deleteProduct",
    "saveCategory",
    "deleteCategory",
    "importCsv",
    "reviewRecommendation",
    "saveCampaign",
    "activateCampaign",
    "pauseCampaign",
    "saveConnection",
    "syncConnection",
    "reset",
  ],
  merchandiser: [
    "saveLayout",
    "runExperiment",
    "reviewRecommendation",
    "saveUtility",
    "saveCampaign",
    "reset",
  ],
  customer: ["addCart", "setCartQuantity"],
};
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function lookup<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((x) => x.id === id);
  assert(item, "Item no longer exists.");
  return item;
}
function upsert<T extends { id: string }>(items: T[], item: T) {
  const i = items.findIndex((x) => x.id === item.id);
  if (i < 0) items.push(item);
  else items[i] = item;
}
function parseLine(line: string) {
  const values: string[] = [];
  let value = "",
    quote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quote && line[i + 1] === '"') {
        value += '"';
        i++;
      } else quote = !quote;
    } else if (c === "," && !quote) {
      values.push(value.trim());
      value = "";
    } else value += c;
  }
  assert(!quote, "Unclosed CSV quote.");
  values.push(value.trim());
  return values;
}
function validStored(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const s = value as DemoState;
  return (
    s.version === 1 &&
    [
      "products",
      "categories",
      "recommendations",
      "jobs",
      "imports",
      "layouts",
      "campaigns",
      "experiments",
      "users",
      "connections",
    ].every((k) =>
      Array.isArray((s as unknown as Record<string, unknown>)[k]),
    ) &&
    !!s.config &&
    !!s.utility &&
    !!s.cart &&
    s.products.every(
      (p) =>
        typeof p.id === "string" &&
        Number.isFinite(p.price) &&
        Number.isFinite(p.stock),
    ) &&
    s.layouts.every((l) => Array.isArray(l.slots))
  );
}
export function selectMiningRecommendations(
  state: DemoState,
  config: MiningConfig,
) {
  return createSeed().recommendations.filter(
    (r) =>
      r.utility >= config.minUtility &&
      r.lift >= config.profitTarget &&
      r.productIds.every((pid) => {
        const p = state.products.find((product) => product.id === pid);
        return (
          p &&
          !p.archived &&
          !config.excluded.includes(pid) &&
          !config.excluded.includes(p.category)
        );
      }) &&
      (config.crossDepartment ||
        new Set(r.productIds.map((pid) => lookup(state.products, pid).category))
          .size === 1),
  );
}
export function createDemoService(storage?: StorageLike) {
  let state = createSeed();
  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (validStored(parsed)) state = parsed;
      else storage?.removeItem(KEY);
    }
  } catch {
    try {
      storage?.removeItem(KEY);
    } catch {
      /* restricted storage */
    }
  }
  const listeners = new Set<() => void>();
  let serial = 0;
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async dispatch(action: DemoAction, role: Role) {
      await Promise.resolve();
      assert(
        allowed[role]?.includes(action.type),
        "Permission denied for this role.",
      );
      let next = structuredClone(state);
      const id = (prefix: string) => `${prefix}${Date.now()}-${++serial}`;
      switch (action.type) {
        case "reset":
          next = createSeed();
          break;
        case "saveProduct": {
          const p = action.product;
          assert(
            p.name.trim() && p.sku.trim(),
            "Product name and SKU are required.",
          );
          assert(
            next.categories.includes(p.category),
            "Choose an existing category.",
          );
          assert(
            Number.isInteger(p.price) &&
              p.price > 0 &&
              Number.isInteger(p.cost) &&
              p.cost >= 0 &&
              Number.isInteger(p.stock) &&
              p.stock >= 0,
            "Prices and stock must be valid positive values.",
          );
          assert(
            !next.products.some(
              (x) =>
                x.id !== p.id && x.sku.toLowerCase() === p.sku.toLowerCase(),
            ),
            "SKU already exists.",
          );
          assert(
            (next.cart[p.id] ?? 0) <= p.stock,
            "Stock cannot be below cart quantity.",
          );
          upsert(next.products, { ...p });
          break;
        }
        case "deleteProduct": {
          const p = lookup(next.products, action.id);
          assert(
            !next.recommendations.some((r) => r.productIds.includes(p.id)),
            "This product is used by a recommendation.",
          );
          p.archived = true;
          delete next.cart[p.id];
          break;
        }
        case "saveCategory": {
          const name = action.name.trim();
          assert(name, "Category name is required.");
          assert(
            !next.categories.some(
              (x) =>
                x.toLowerCase() === name.toLowerCase() && x !== action.previous,
            ),
            "Category already exists.",
          );
          if (action.previous) {
            assert(
              next.categories.includes(action.previous),
              "Category does not exist.",
            );
            next.categories = next.categories.map((x) =>
              x === action.previous ? name : x,
            );
            next.products.forEach((p) => {
              if (p.category === action.previous) p.category = name;
            });
          } else next.categories.push(name);
          break;
        }
        case "deleteCategory":
          assert(
            !next.products.some((p) => p.category === action.name),
            "Category contains products.",
          );
          next.categories = next.categories.filter((x) => x !== action.name);
          break;
        case "importCsv": {
          const rows: DemoState["imports"][number]["rows"] = [];
          const issues: string[] = [];
          try {
            const lines = action.text
              .replace(/^\uFEFF/, "")
              .trim()
              .split(/\r?\n/);
            const headers = parseLine(lines.shift() ?? "");
            assert(
              ["receipt_id", "sku", "quantity", "price", "timestamp"].every(
                (x) => headers.includes(x),
              ),
              "Required columns: receipt_id, sku, quantity, price, timestamp.",
            );
            lines.forEach((line, i) => {
              if (!line.trim()) return;
              const values = parseLine(line);
              const get = (k: string) => values[headers.indexOf(k)] ?? "";
              const quantity = Number(get("quantity")),
                price = Number(get("price"));
              if (
                !get("receipt_id") ||
                !next.products.some((p) => p.sku === get("sku")) ||
                !Number.isInteger(quantity) ||
                quantity <= 0 ||
                !get("price") ||
                !Number.isFinite(price) ||
                price < 0 ||
                !get("timestamp") ||
                !Number.isFinite(Date.parse(get("timestamp")))
              ) {
                issues.push(
                  `Row ${i + 2}: invalid receipt, SKU, quantity, price or timestamp.`,
                );
                return;
              }
              rows.push({
                receiptId: get("receipt_id"),
                sku: get("sku"),
                quantity,
                price: Math.round(price * 100),
                timestamp: get("timestamp"),
              });
            });
            if (!rows.length) issues.push("No valid transaction rows found.");
          } catch (e) {
            issues.push(e instanceof Error ? e.message : "Invalid CSV.");
          }
          next.imports.unshift({
            id: id("i"),
            name: action.name,
            status: rows.length
              ? issues.length
                ? "warning"
                : "accepted"
              : "rejected",
            rows,
            issues,
            createdAt: Date.now(),
          });
          break;
        }
        case "saveConfig": {
          const c = action.config;
          assert(
            ["HUI-Miner", "EFIM"].includes(c.algorithm) &&
              [
                c.minUtility,
                c.profitTarget,
                c.frequency,
                c.confidence,
                c.lift,
                c.size,
              ].every(Number.isFinite) &&
              c.minUtility > 0 &&
              c.profitTarget > 0 &&
              c.frequency >= 0 &&
              c.frequency <= 100 &&
              c.confidence >= 0 &&
              c.confidence <= 100 &&
              c.lift >= 0 &&
              Number.isInteger(c.size) &&
              c.size >= 2 &&
              c.size <= 12,
            "Invalid mining thresholds.",
          );
          assert(
            !next.jobs.some((j) => j.status === "running"),
            "Cancel the running job before changing settings.",
          );
          next.config = { ...c };
          break;
        }
        case "startMining":
          assert(
            !next.jobs.some((j) => j.status === "running"),
            "A mining job is already running.",
          );
          assert(
            next.imports.some((i) => i.status !== "rejected" && i.rows.length),
            "Import valid transactions first.",
          );
          next.jobs.unshift({
            id: id("j"),
            config: structuredClone(next.config),
            startedAt: Date.now(),
            status: "running",
            count: 0,
            duration: 0,
            memory: 0,
          });
          break;
        case "cancelMining":
        case "failMining":
        case "completeMining": {
          const j = lookup(next.jobs, action.id);
          assert(j.status === "running", "This job is no longer running.");
          j.status =
            action.type === "completeMining"
              ? "completed"
              : action.type === "cancelMining"
                ? "cancelled"
                : "failed";
          j.duration =
            action.type === "completeMining"
              ? 2.4
              : Math.max(0, (Date.now() - j.startedAt) / 1000);
          if (j.status === "completed") {
            const seed = selectMiningRecommendations(next, j.config);
            j.count = seed.length;
            j.memory = 24;
            for (const r of seed)
              if (!next.recommendations.some((x) => x.id === r.id))
                next.recommendations.push(r);
          }
          break;
        }
        case "reviewRecommendation": {
          const r = lookup(next.recommendations, action.id);
          assert(
            action.status !== "rejected" ||
              !next.layouts.some(
                (l) => l.status === "approved" && l.slots.includes(r.id),
              ),
            "An approved layout uses this recommendation.",
          );
          r.status = action.status;
          break;
        }
        case "saveLayout": {
          const l = action.layout;
          assert(
            l.name.trim() && l.slots.length > 0,
            "Layout name and slots are required.",
          );
          const occupied = l.slots.filter((s): s is string => !!s);
          assert(
            new Set(occupied).size === occupied.length,
            "A recommendation can appear only once.",
          );
          occupied.forEach((r) => lookup(next.recommendations, r));
          if (l.status === "approved") {
            assert(occupied.length, "Add a recommendation before approval.");
            assert(
              occupied.every(
                (r) => lookup(next.recommendations, r).status === "approved",
              ),
              "All recommendations must be approved.",
            );
          }
          assert(
            !next.campaigns.some(
              (c) => c.layoutId === l.id && c.status === "active",
            ),
            "Pause active campaigns before editing their layout.",
          );
          upsert(next.layouts, structuredClone(l));
          break;
        }
        case "saveCampaign": {
          const c = action.campaign;
          assert(
            c.name.trim() && Number.isFinite(Date.parse(c.startsAt)),
            "Campaign name and valid start date are required.",
          );
          const l = lookup(next.layouts, c.layoutId);
          assert(c.status !== "active", "Use Activate to start a campaign.");
          assert(
            c.status === "draft" || l.status === "approved",
            "Approve the layout first.",
          );
          assert(
            !next.campaigns.some((x) => x.id === c.id && x.status === "active"),
            "Pause this campaign before editing.",
          );
          upsert(next.campaigns, { ...c });
          break;
        }
        case "activateCampaign": {
          const c = lookup(next.campaigns, action.id),
            l = lookup(next.layouts, c.layoutId);
          assert(
            ["approved", "paused"].includes(c.status) &&
              l.status === "approved" &&
              l.slots.some(Boolean) &&
              l.slots
                .filter(Boolean)
                .every(
                  (r) => lookup(next.recommendations, r!).status === "approved",
                ),
            "Campaign and layout must be approved.",
          );
          c.status = "active";
          break;
        }
        case "pauseCampaign": {
          const c = lookup(next.campaigns, action.id);
          assert(c.status === "active", "Campaign is not active.");
          c.status = "paused";
          break;
        }
        case "runExperiment": {
          const l = lookup(next.layouts, action.layoutId);
          assert(l.status === "approved", "Approve the layout first.");
          assert(
            action.name.trim() &&
              Number.isInteger(action.visitors) &&
              action.visitors >= 10,
            "Provide a name and at least 10 visitors.",
          );
          next.experiments.unshift({
            id: id("e"),
            name: action.name,
            layoutId: l.id,
            visitors: action.visitors,
            aConversion: 0.124,
            bConversion: 0.168,
            aRevenue: Math.round(action.visitors * 124),
            bRevenue: Math.round(action.visitors * 168),
          });
          break;
        }
        case "addCart": {
          assert(action.productIds.length, "Select products first.");
          for (const pid of action.productIds) {
            const p = lookup(next.products, pid);
            assert(!p.archived, "Product is unavailable.");
            const qty = (next.cart[pid] ?? 0) + 1;
            assert(qty <= p.stock, "Insufficient stock.");
            next.cart[pid] = qty;
          }
          break;
        }
        case "setCartQuantity": {
          const p = lookup(next.products, action.productId);
          assert(
            Number.isInteger(action.quantity) && action.quantity >= 0,
            "Quantity must be a nonnegative integer.",
          );
          assert(action.quantity <= p.stock, "Insufficient stock.");
          if (action.quantity) next.cart[p.id] = action.quantity;
          else delete next.cart[p.id];
          break;
        }
        case "saveUser": {
          const u = action.user;
          assert(
            u.name.trim() &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email) &&
              u.role in allowed,
            "Valid name, email and role are required.",
          );
          assert(
            !next.users.some(
              (x) =>
                x.id !== u.id &&
                x.email.toLowerCase() === u.email.toLowerCase(),
            ),
            "Email already exists.",
          );
          assert(
            !(
              next.users.some(
                (x) => x.id === u.id && x.active && x.role === "system",
              ) &&
              (!u.active || u.role !== "system") &&
              !next.users.some(
                (x) => x.id !== u.id && x.active && x.role === "system",
              )
            ),
            "Keep at least one active system administrator.",
          );
          upsert(next.users, { ...u });
          break;
        }
        case "deleteUser": {
          const u = lookup(next.users, action.id);
          assert(
            u.role !== "system" ||
              !u.active ||
              next.users.some(
                (x) => x.id !== u.id && x.active && x.role === "system",
              ),
            "Keep at least one active system administrator.",
          );
          u.active = false;
          break;
        }
        case "saveConnection":
          assert(
            action.connection.name.trim() && action.connection.endpoint.trim(),
            "Connection name and endpoint are required.",
          );
          upsert(next.connections, { ...action.connection });
          break;
        case "syncConnection": {
          const c = lookup(next.connections, action.id);
          assert(c.status === "connected", "Connect this integration first.");
          c.lastSync = Date.now();
          break;
        }
        case "saveUtility":
          assert(
            Number.isFinite(action.utility.profit) &&
              Number.isFinite(action.utility.quantity) &&
              action.utility.profit >= 0 &&
              action.utility.quantity >= 0 &&
              action.utility.profit + action.utility.quantity === 100,
            "Weights must be nonnegative and total 100.",
          );
          next.utility = { ...action.utility };
          break;
      }
      try {
        storage?.setItem(KEY, JSON.stringify(next));
      } catch {
        /* In-memory demo still works when browser storage is unavailable. */
      }
      state = next;
      listeners.forEach((listener) => listener());
      return state;
    },
  };
}
function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
export const demoService = createDemoService(browserStorage());
