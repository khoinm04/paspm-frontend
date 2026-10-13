import { useLayoutEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  Grid2X2,
  HelpCircle,
  LayoutGrid,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Upload,
  Users,
  X,
} from "lucide-react";
import { DemoProvider, useDemo } from "../state/DemoContext";
import { Button, Card, Empty, Modal, Progress } from "../components/ui";
import { canVisit, landing, roleNames } from "./permissions";
import type { Role } from "../domain/models";
import { LoginPage } from "../pages/auth/LoginPage";
import {
  ProductsPage,
  CategoriesPage,
  TransactionsPage,
} from "../pages/store/CatalogPages";
import { ImportPage } from "../pages/store/ImportPage";
import {
  UsersPage,
  IntegrationsPage,
  BenchmarkPage,
  OverviewPage,
  ReportsPage,
} from "../pages/system/AdminPages";
import {
  LayoutsPage,
  LayoutEditorPage,
  CampaignsPage,
  ExperimentsPage,
  UtilityPage,
} from "../pages/merchandising/PlanningPages";
import {
  ShopPage,
  ProductPage,
  BundlesPage,
  CartPage,
} from "../pages/shop/ShopPages";
import {
  MiningSetupPage,
  MiningRunningPage,
  MiningResultsPage,
} from "../pages/mining/MiningPages";
import {
  RecommendationsPage,
  RecommendationDetailPage,
} from "../pages/recommendations/RecommendationPages";
const links = [
  ["/app/overview", "Overview & Health Score", Activity],
  ["/app/layouts", "Shelf & Planogram Map", LayoutGrid],
  ["/app/import", "Import POS Data", Upload],
  ["/app/mining/setup", "Basket Analytics", BarChart3],
  ["/app/recommendations", "Product Recommendations", ShoppingBag],
  ["/app/products", "Products", Package],
  ["/app/categories", "Categories", Grid2X2],
  ["/app/transactions", "Transactions", Activity],
  ["/app/campaigns", "Campaigns", Store],
  ["/app/experiments", "A/B Experiments", BarChart3],
  ["/app/reports", "Performance Reports", BarChart3],
  ["/app/utility", "Utility Configuration", Settings],
  ["/app/benchmarks", "Mining Benchmarks", Activity],
  ["/app/users", "User Management", Users],
  ["/app/integrations", "Settings & Integration", Settings],
] as const;
function RoleSelect() {
  const { role, setRole } = useDemo();
  const navigate = useNavigate();
  return (
    <select
      className="select"
      aria-label="Demo role"
      value={role}
      onChange={(e) => {
        const next = e.target.value as Role;
        setRole(next);
        navigate(landing[next]);
      }}
    >
      {Object.entries(roleNames).map(([value, name]) => (
        <option key={value} value={value}>
          {name}
        </option>
      ))}
    </select>
  );
}
function Guard() {
  const { role } = useDemo();
  const { pathname } = useLocation();
  return canVisit(pathname, role) ? (
    <Outlet />
  ) : (
    <div className="page">
      <Card>
        <Empty
          title="This workspace belongs to another role"
          description="Choose the appropriate demo role in the header to explore this screen."
        >
          <NavLink className="button primary" to={landing[role]}>
            Return to your workspace
          </NavLink>
        </Empty>
      </Card>
    </div>
  );
}
function Shell() {
  const { role, state, run } = useDemo();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<
    "reset" | "search" | "help" | "notifications" | null
  >(null);
  const [search, setSearch] = useState("");
  const available = links.filter(([path]) => canVisit(path, role));
  const posConnected = state.connections.some(
    (connection) => connection.status === "connected",
  );
  const current =
    links.find(([path]) =>
      location.pathname.startsWith(path.replace("/setup", "")),
    )?.[1] || "Workspace";
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          className="drawer-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <NavLink to={landing[role]} className="brand">
          <div className="brand-mark">
            <Grid2X2 size={23} />
          </div>
          <div>
            <strong>PlanogramIQ</strong>
            <small>RETAIL INTELLIGENCE</small>
          </div>
        </NavLink>
        <div className="store-switch">
          <Store size={23} />
          <div>
            <small>CURRENT WORKSPACE</small>
            <strong>Central Supermarket</strong>
            <small>Store #01 · Downtown</small>
          </div>
        </div>
        <nav className="nav-group" aria-label="Main navigation">
          <p className="eyebrow nav-caption">Workspace</p>
          {available.map(([path, title, Icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive || (path.includes("mining") && location.pathname.includes("mining")) ? "active" : ""}`
              }
            >
              <Icon size={19} />
              {title}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="health">
            <div className="row spread">
              <strong>Store Health Score</strong>
              <strong>
                86<span className="muted"> / 100</span>
              </strong>
            </div>
            <Progress value={86} />
            <small className="muted">
              Your store is performing well. Keep it up!
            </small>
          </div>
          <Button
            className="reset-button"
            variant="ghost"
            onClick={() => setModal("reset")}
          >
            Reset Demo Data
          </Button>
          <Button
            variant="ghost"
            className="reset-button"
            onClick={() => setModal("help")}
          >
            <HelpCircle size={16} /> Help & documentation
          </Button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Button
            className="mobile-menu"
            variant="ghost"
            aria-label="Open navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </Button>
          <button
            className="global-search"
            aria-label="Search workspace"
            onClick={() => setModal("search")}
          >
            <Search size={16} />
            <span>Search products, pairings, or reports...</span>
            <kbd>Search</kbd>
          </button>
          <div className="header-right">
            <span className="connection-badge">
              <span
                className="dot"
                style={{
                  background: posConnected ? undefined : "var(--muted)",
                }}
              />
              {posConnected ? "Demo POS Connected" : "Demo POS Disconnected"}
            </span>
            <Button
              variant="ghost"
              aria-label="Notifications"
              onClick={() => setModal("notifications")}
            >
              <Bell size={18} />
            </Button>
            <div className="profile">
              <div>
                <strong>Kenji T.</strong>
                <RoleSelect />
              </div>
              <NavLink to="/login" className="avatar" aria-label="Open sign in">
                KT
              </NavLink>
            </div>
          </div>
        </header>
        <main id="main-content">
          {!location.pathname.startsWith("/app/recommendations") &&
            !location.pathname.startsWith("/app/import") && (
              <>
                <div className="breadcrumbs" style={{ padding: "22px 32px 0" }}>
                  WORKSPACE <ChevronRight size={12} />
                  <span>{current}</span>
                  <span className="demo-label" style={{ marginLeft: "auto" }}>
                    LOCAL DEMO
                  </span>
                </div>
              </>
            )}
          <Outlet />
        </main>
      </div>
      {modal && (
        <Modal
          title={
            modal === "reset"
              ? "Reset demo data?"
              : modal === "search"
                ? "Search your workspace"
                : modal === "notifications"
                  ? "Notifications"
                  : "Welcome to PlanogramIQ"
          }
          onClose={() => setModal(null)}
        >
          {modal === "reset" ? (
            <div className="stack-sm">
              <p>
                This restores the sample catalog, imports, pairings, layouts,
                campaigns and basket in this browser.
              </p>
              <div className="actions">
                <Button variant="secondary" onClick={() => setModal(null)}>
                  Keep my changes
                </Button>
                <Button
                  onClick={async () => {
                    if (await run({ type: "reset" }, "Demo data restored."))
                      setModal(null);
                  }}
                >
                  Reset all demo data
                </Button>
              </div>
            </div>
          ) : modal === "search" ? (
            <div className="stack-sm">
              <input
                autoFocus
                className="input"
                aria-label="Search workspace pages"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a page..."
              />
              {available
                .filter(([, title]) =>
                  title.toLowerCase().includes(search.toLowerCase()),
                )
                .map(([path, title]) => (
                  <NavLink
                    key={path}
                    className="nav-link"
                    to={path}
                    onClick={() => setModal(null)}
                  >
                    {title}
                    <ChevronRight size={16} />
                  </NavLink>
                ))}
            </div>
          ) : modal === "notifications" ? (
            <div className="stack-sm">
              <p>
                {state.jobs.some((j) => j.status === "running")
                  ? "A pairing discovery is running. You can keep working while it finishes."
                  : "Your demo workspace is ready."}
              </p>
              <p className="muted">
                {
                  state.recommendations.filter((r) => r.status === "pending")
                    .length
                }{" "}
                product pairings await review.
              </p>
            </div>
          ) : (
            <div className="stack-sm">
              <p>
                Import transactions, discover product pairings, review a
                recommendation, and arrange it on a shelf. Activate an approved
                campaign to see it in the customer market.
              </p>
              <p className="muted">
                Use the role selector to explore all four experiences. Changes
                are saved locally; mining, POS connections and A/B results are
                simulated.
              </p>
              <NavLink
                className="button secondary"
                to="/login"
                onClick={() => setModal(null)}
              >
                Open sign in
              </NavLink>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
function ShopShell() {
  return (
    <>
      <div className="shop-demo-bar">
        <NavLink to="/shop" className="row">
          <Grid2X2 size={18} />
          <strong>PlanogramIQ Market</strong>
          <span className="market-demo-label">· Demo</span>
        </NavLink>
        <div className="row">
          <NavLink
            to="/shop/cart"
            className="market-cart"
            aria-label="Your basket"
          >
            <ShoppingBag size={18} />
          </NavLink>
          <RoleSelect />
        </div>
      </div>
      <Outlet />
    </>
  );
}
function Home() {
  const { role } = useDemo();
  return <Navigate to={landing[role]} replace />;
}
function RouteViewport() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }, [pathname, hash]);
  return null;
}

export function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <RouteViewport />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/app" element={<Shell />}>
            <Route element={<Guard />}>
              <Route index element={<Home />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="benchmarks" element={<BenchmarkPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="mining/setup" element={<MiningSetupPage />} />
              <Route path="mining/running" element={<MiningRunningPage />} />
              <Route path="mining/results" element={<MiningResultsPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route
                path="recommendations/:id"
                element={<RecommendationDetailPage />}
              />
              <Route path="layouts" element={<LayoutsPage />} />
              <Route path="layouts/new" element={<LayoutEditorPage />} />
              <Route path="layouts/:id" element={<LayoutEditorPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="experiments" element={<ExperimentsPage />} />
              <Route path="utility" element={<UtilityPage />} />
            </Route>
          </Route>
          <Route path="/shop" element={<ShopShell />}>
            <Route element={<Guard />}>
              <Route index element={<ShopPage />} />
              <Route path="products/:id" element={<ProductPage />} />
              <Route path="bundles" element={<BundlesPage />} />
              <Route path="cart" element={<CartPage />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <div className="page">
                <Empty
                  title="Page not found"
                  description="This page isn't part of the demo workspace."
                >
                  <NavLink to="/" className="button primary">
                    Go to workspace
                  </NavLink>
                </Empty>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
}
