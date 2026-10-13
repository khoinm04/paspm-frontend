export type Role = "system" | "store" | "merchandiser" | "customer";
export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  image: string;
  description: string;
  archived?: boolean;
};
export type Recommendation = {
  id: string;
  productIds: string[];
  title: string;
  department: string;
  location: string;
  lift: number;
  affinity: number;
  utility: number;
  minutes: number;
  advice: string;
  status: "pending" | "approved" | "rejected";
};
export type MiningConfig = {
  algorithm: "HUI-Miner" | "EFIM";
  minUtility: number;
  profitTarget: number;
  frequency: number;
  confidence: number;
  lift: number;
  size: number;
  crossDepartment: boolean;
  excluded: string[];
  schedule: string;
};
export type MiningJob = {
  id: string;
  config: MiningConfig;
  startedAt: number;
  status: "running" | "completed" | "cancelled" | "failed";
  count: number;
  duration: number;
  memory: number;
};
export type Transaction = {
  receiptId: string;
  sku: string;
  quantity: number;
  price: number;
  timestamp: string;
};
export type ImportBatch = {
  id: string;
  name: string;
  status: "accepted" | "warning" | "rejected";
  rows: Transaction[];
  issues: string[];
  createdAt: number;
};
export type Layout = {
  id: string;
  name: string;
  slots: (string | null)[];
  status: "draft" | "approved";
};
export type Campaign = {
  id: string;
  name: string;
  layoutId: string;
  status: "draft" | "approved" | "active" | "paused";
  startsAt: string;
};
export type Experiment = {
  id: string;
  name: string;
  layoutId: string;
  visitors: number;
  aConversion: number;
  bConversion: number;
  aRevenue: number;
  bRevenue: number;
};
export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
};
export type Connection = {
  id: string;
  name: string;
  provider: string;
  status: "connected" | "disconnected";
  lastSync: number | null;
  endpoint: string;
};
export type DemoState = {
  version: 1;
  products: Product[];
  categories: string[];
  recommendations: Recommendation[];
  config: MiningConfig;
  jobs: MiningJob[];
  imports: ImportBatch[];
  layouts: Layout[];
  campaigns: Campaign[];
  experiments: Experiment[];
  users: DemoUser[];
  connections: Connection[];
  cart: Record<string, number>;
  utility: { profit: number; quantity: number; priority: string };
};
export type DemoAction =
  | { type: "reset" }
  | { type: "saveProduct"; product: Product }
  | { type: "deleteProduct"; id: string }
  | { type: "saveCategory"; name: string; previous?: string }
  | { type: "deleteCategory"; name: string }
  | { type: "importCsv"; name: string; text: string }
  | { type: "saveConfig"; config: MiningConfig }
  | { type: "startMining" }
  | { type: "cancelMining"; id: string }
  | { type: "completeMining"; id: string }
  | { type: "failMining"; id: string }
  | {
      type: "reviewRecommendation";
      id: string;
      status: "approved" | "rejected";
    }
  | { type: "saveLayout"; layout: Layout }
  | { type: "saveCampaign"; campaign: Campaign }
  | { type: "activateCampaign"; id: string }
  | { type: "pauseCampaign"; id: string }
  | { type: "runExperiment"; layoutId: string; name: string; visitors: number }
  | { type: "addCart"; productIds: string[] }
  | { type: "setCartQuantity"; productId: string; quantity: number }
  | { type: "saveUser"; user: DemoUser }
  | { type: "deleteUser"; id: string }
  | { type: "saveConnection"; connection: Connection }
  | { type: "syncConnection"; id: string }
  | { type: "saveUtility"; utility: DemoState["utility"] };
