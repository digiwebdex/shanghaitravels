import { NavLink, useLocation } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { TAB_ORDER, type Workspace, type WorkspaceTabKind } from "./types";

const KIND_LABEL: Record<WorkspaceTabKind, string> = {
  overview: "Overview",
  work: "Work",
  reports: "Reports",
  calendar: "Calendar",
  settings: "Settings",
};

function pathBase(to: string): string {
  return to.split("?")[0] || to;
}

function tabActive(pathname: string, search: string, to: string, end?: boolean): boolean {
  const [path, qs] = to.split("?");
  const pathOk = end ? pathname === path : pathname === path || pathname.startsWith(`${path}/`);
  if (!pathOk) return false;
  if (!qs) return true;
  const want = new URLSearchParams(qs);
  const have = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false;
  }
  return true;
}

/**
 * Fixed five-group tab bar for every workspace.
 * Renders only tabs the user can reach; groups with zero tabs are hidden.
 */
export function WorkspaceTabs({ workspace }: { workspace: Workspace }) {
  const { can } = useAuth();
  const { pathname, search } = useLocation();
  const visible = workspace.tabs.filter((t) => !t.soon && (!t.perm || can(t.perm)));

  return (
    <nav className="space-y-2" aria-label={`${workspace.label} workspace`}>
      {TAB_ORDER.map((kind) => {
        const tabs = visible.filter((t) => t.kind === kind);
        if (tabs.length === 0) return null;
        return (
          <div key={kind}>
            <p className="mb-1 px-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">
              {KIND_LABEL[kind]}
            </p>
            <div className="flex flex-wrap gap-1">
              {tabs.map((t) => (
                <NavLink
                  key={`${t.kind}-${t.to}-${t.label}`}
                  to={t.to}
                  end={!!t.end}
                  className={() => {
                    const on = tabActive(pathname, search, t.to, t.end);
                    return `inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      on
                        ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--navy-200)]"
                    }`;
                  }}
                >
                  {t.label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Compact bar — exactly Overview · Work · Reports · Calendar · Settings
 * (first reachable tab per kind).
 */
export function WorkspaceTabsCompact({ workspace }: { workspace: Workspace }) {
  const { can } = useAuth();
  const { pathname, search } = useLocation();
  const visible = workspace.tabs.filter((t) => !t.soon && (!t.perm || can(t.perm)));

  return (
    <nav className="flex flex-wrap gap-1" aria-label={`${workspace.label} workspace`}>
      {TAB_ORDER.map((kind) => {
        const first = visible.find((t) => t.kind === kind);
        if (!first) return null;
        const kindTabs = visible.filter((t) => t.kind === kind);
        const on = kindTabs.some((t) => tabActive(pathname, search, t.to, t.end));
        return (
          <NavLink
            key={kind}
            to={first.to}
            end={!!first.end}
            className={() =>
              `inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                on
                  ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--navy-200)]"
              }`
            }
          >
            {KIND_LABEL[kind]}
          </NavLink>
        );
      })}
    </nav>
  );
}

export { pathBase };
