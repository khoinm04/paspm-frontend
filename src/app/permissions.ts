import type { Role } from "../domain/models";
export const roleNames: Record<Role, string> = {
  system: "System Administrator",
  store: "Store Administrator",
  merchandiser: "Merchandiser",
  customer: "End-Customer",
};
export const landing: Record<Role, string> = {
  system: "/app/mining/setup",
  store: "/app/import",
  merchandiser: "/app/recommendations",
  customer: "/shop",
};
const access: Record<string, Role[]> = {
  overview: ["system", "store", "merchandiser"],
  products: ["store"],
  categories: ["store"],
  import: ["store"],
  transactions: ["store"],
  integrations: ["system", "store"],
  users: ["system"],
  mining: ["system", "merchandiser", "store"],
  benchmarks: ["system"],
  recommendations: ["system", "merchandiser", "store"],
  layouts: ["merchandiser"],
  campaigns: ["store", "merchandiser"],
  experiments: ["merchandiser"],
  utility: ["merchandiser", "system"],
  reports: ["store"],
};
export function canVisit(path: string, role: Role) {
  if (path === "/app") return role !== "customer";
  if (path.startsWith("/shop")) return role === "customer";
  return access[path.split("/")[2]]?.includes(role) ?? false;
}
