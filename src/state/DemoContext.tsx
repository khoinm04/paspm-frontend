import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { demoService } from "../services/demo";
import type { DemoAction, DemoState, Role } from "../domain/models";
type ContextValue = {
  state: DemoState;
  role: Role;
  setRole: (role: Role) => void;
  run: (action: DemoAction, success?: string) => Promise<boolean>;
  busy: boolean;
  notify: (message: string, kind?: "success" | "error") => void;
};
const Context = createContext<ContextValue | null>(null);
function initialRole(): Role {
  try {
    const role = sessionStorage.getItem("paspm-role");
    if (["system", "store", "merchandiser", "customer"].includes(role || ""))
      return role as Role;
  } catch {
    /* In-memory demo session still works. */
  }
  return "store";
}
export function DemoProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    demoService.subscribe,
    demoService.getSnapshot,
  );
  const [role, setRoleValue] = useState<Role>(initialRole);
  const [pending, setPending] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    kind: "success" | "error";
  } | null>(null);
  const notify = useCallback(
    (message: string, kind: "success" | "error" = "success") =>
      setToast({ message, kind }),
    [],
  );
  const setRole = useCallback((value: Role) => {
    setRoleValue(value);
    try {
      sessionStorage.setItem("paspm-role", value);
    } catch {
      /* Optional persistence. */
    }
  }, []);
  const run = useCallback(
    async (action: DemoAction, success?: string) => {
      setPending((v) => v + 1);
      try {
        await demoService.dispatch(action, role);
        if (success) notify(success);
        return true;
      } catch (error) {
        notify(
          error instanceof Error
            ? error.message
            : "The demo action could not finish. Please try again.",
          "error",
        );
        return false;
      } finally {
        setPending((v) => v - 1);
      }
    },
    [role, notify],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  // A simulated job continues while navigating; completion is guarded by the service.
  useEffect(() => {
    const running = state.jobs.filter((j) => j.status === "running");
    if (!running.length) return;
    const timer = setInterval(() => {
      for (const job of running)
        if (Date.now() - job.startedAt >= 6000)
          void demoService
            .dispatch({ type: "completeMining", id: job.id }, "system")
            .catch(() => {});
    }, 400);
    return () => clearInterval(timer);
  }, [state.jobs]);
  return (
    <Context.Provider
      value={{ state, role, setRole, run, busy: pending > 0, notify }}
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.kind}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          {toast.kind === "error" ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("DemoProvider missing");
  return ctx;
}
