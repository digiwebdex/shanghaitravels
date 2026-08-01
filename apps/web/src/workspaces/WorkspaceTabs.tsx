import { NavLink } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { TAB_ORDER, type Workspace, type WorkspaceTabKind } from "./types";

const KIND_LABEL: Record<WorkspaceTabKind, string> = {
  overview: "Overview",
  work: "Work",
  reports: "Reports",
  calendar: "Calendar",
  settings: "Settings",
};

/**
 * Fixed five-group tab bar for every workspace.
 * Renders only tabs the user can reach; groups with zero tabs are hidden.
 */
export function WorkspaceTabs({ workspace }: { workspace: Workspace }) {
  const { can } = useAuth();
  const visible = workspace.tabs.filter((t) => !t.soon && (!t.perm || can(t.perm)));

  return (
    <nav className="space-y-2" aria-label={`${workspace.label} workspace`}>
      {TAB_ORDER.map((kind) => {
        const tabs = visible.filter((t) => t.kind === kind);
        if (tabs.length === 0) return null;
        return (
          <div key={kind}>
            <p className="mb-1 px-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              {KIND_LABEL[kind]}
            </p>
            <div className="flex flex-wrap gap-1">
              {tabs.map((t) => (
                <NavLink
                  key={`${t.kind}-${t.to}-${t.label}`}
                  to={t.to}
                  end={!!t.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                      isActive
                        ? "border-orange-300 bg-orange-50 text-orange-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`
                  }
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

/** Compact single-row variant used inside list pages. */
export function WorkspaceTabsCompact({ workspace }: { workspace: Workspace }) {
  const { can } = useAuth();
  const visible = workspace.tabs.filter((t) => !t.soon && (!t.perm || can(t.perm)));
  // Deduplicate by path so Overview/Work aliases don't double up
  const seen = new Set<string>();
  const unique = visible.filter((t) => {
    const key = `${t.to}:${t.end ? "end" : ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <nav className="flex flex-wrap gap-1" aria-label={`${workspace.label} workspace`}>
      {unique.map((t) => (
        <NavLink
          key={`${t.to}-${t.label}`}
          to={t.to}
          end={!!t.end}
          className={({ isActive }) =>
            `inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive
                ? "border-orange-300 bg-orange-50 text-orange-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
