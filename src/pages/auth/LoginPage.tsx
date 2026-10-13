import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Grid2X2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useDemo } from "../../state/DemoContext";
import { Button, Field, Modal } from "../../components/ui";
import type { Role } from "../../domain/models";
import { landing } from "../../app/permissions";

const roles: { value: Role; label: string }[] = [
  { value: "store", label: "Store Administrator" },
  { value: "system", label: "System Administrator" },
  { value: "merchandiser", label: "Merchandiser" },
  { value: "customer", label: "End-Customer" },
];

export function LoginPage() {
  const { role, setRole } = useDemo();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const [email, setEmail] = useState("kenji@demo.paspm.test");
  const [password, setPassword] = useState("demo1234");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [explanation, setExplanation] = useState<
    "recovery" | "sso" | "privacy" | null
  >(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors.email = "Enter a valid demo email address.";
    if (password.length < 6)
      nextErrors.password = "Use at least 6 characters for the demo password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setRole(selectedRole);
    navigate(landing[selectedRole]);
  }

  return (
    <main className="login-page">
      <header className="login-top">
        <div className="brand">
          <div className="brand-mark">
            <Grid2X2 size={23} />
          </div>
          <div>
            <strong>PlanogramIQ</strong>
            <small>RETAIL INTELLIGENCE</small>
          </div>
        </div>
        <span className="connection-badge">
          ● Central Supermarket #01 · Morning shift
        </span>
      </header>
      <section className="login-panel">
        <h1>
          Good morning, <em>Kenji</em>
        </h1>
        <p className="muted">
          Sign in to explore your floor plans and daily product discoveries.
        </p>
        <form className="stack-sm" onSubmit={submit} noValidate>
          <div className="login-role">
            <label htmlFor="login-role">Workspace</label>
            <select
              id="login-role"
              aria-label="Demo role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <Field label="Email" error={errors.email}>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              aria-invalid={!!errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <div className="row spread">
            <span className="eyebrow">Password</span>
            <Button variant="ghost" onClick={() => setExplanation("recovery")}>
              Forgot password?
            </Button>
          </div>
          <div className="password-wrap">
            <input
              className="input"
              aria-label="Password"
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              aria-invalid={!!errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              variant="ghost"
              aria-label={visible ? "Hide password" : "Show password"}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={19} /> : <Eye size={19} />}
            </Button>
          </div>
          {errors.password && (
            <p className="field-error" role="alert">
              {errors.password}
            </p>
          )}
          <label className="row small">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember this store terminal
          </label>
          <Button type="submit">
            {selectedRole === "customer"
              ? "Explore the market"
              : "Sign in to workspace"}{" "}
            <ArrowRight size={18} />
          </Button>
          <div className="login-or">
            <span className="muted small">OR</span>
          </div>
          <Button variant="secondary" onClick={() => setExplanation("sso")}>
            <KeyRound size={17} /> Continue with Store Passkey / SSO
          </Button>
          <div className="row spread divider small muted">
            <span className="row">
              <ShieldCheck size={16} /> Simulated POS workspace
            </span>
            <span>Demo terminal #01</span>
          </div>
        </form>
      </section>
      <footer className="login-bottom">
        <span>PlanogramIQ · Nordic Retail Intelligence Systems</span>
        <button className="text-link" onClick={() => setExplanation("privacy")}>
          Demo privacy & terms
        </button>
      </footer>
      {explanation && (
        <Modal
          title={
            explanation === "recovery"
              ? "Demo password recovery"
              : explanation === "sso"
                ? "Demo passkey & SSO"
                : "About this demo session"
          }
          onClose={() => setExplanation(null)}
        >
          <div className="stack-sm">
            <p>
              {explanation === "recovery"
                ? "No account recovery email is sent in this prototype. Use kenji@demo.paspm.test and demo1234, or any valid demo email and a password of at least 6 characters."
                : explanation === "sso"
                  ? "Passkeys and SSO are not connected to an identity provider. Select a demo role and use the sign-in form to explore its workspace."
                  : "This is a frontend demonstration. Email and password are not authenticated or sent to a server. The selected demo role is remembered in this browser tab; workspace data is saved locally."}
            </p>
            <Button
              onClick={() => {
                if (explanation === "recovery") {
                  setEmail("kenji@demo.paspm.test");
                  setPassword("demo1234");
                  setErrors({});
                }
                setExplanation(null);
              }}
            >
              {explanation === "recovery"
                ? "Use demo credentials"
                : "Return to sign in"}
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
