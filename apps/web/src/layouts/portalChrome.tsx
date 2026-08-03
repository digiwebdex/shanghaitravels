import { useCallback, useEffect, useState, type ReactNode } from "react";
import { NavLink } from "react-router";
import { LogOut, type LucideIcon } from "lucide-react";
import { gradient } from "@/styles/tokens";
import { SkeletonRows } from "@/components/enterprise/Page";
import {
  PortalSearchTrigger,
  PortalSmartSearch,
  type PortalSearchHit,
} from "@/components/search/PortalSmartSearch";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

/** Shared V4.2 portal shell — navy sidebar, orange active, white content. */
export function PortalShell({
  brandTitle,
  brandSubtitle,
  nav,
  userName,
  userMeta,
  journey,
  onLogout,
  children,
  searchHits,
  searchPlaceholder,
}: {
  brandTitle: string;
  brandSubtitle: string;
  nav: PortalNavItem[];
  userName: string;
  userMeta?: string;
  journey: string;
  onLogout: () => void;
  children: ReactNode;
  /** Portal-scoped smart search (own records only). */
  searchHits?: (q: string) => Promise<PortalSearchHit[]>;
  searchPlaceholder?: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const loadHits = useCallback(
    (q: string) => (searchHits ? searchHits(q) : Promise.resolve([])),
    [searchHits],
  );

  useEffect(() => {
    if (!searchHits) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchHits]);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="flex w-56 flex-col text-white" style={{ background: gradient.primary }}>
        <div className="border-b border-white/10 px-4 py-5">
          <div className="text-[14px] font-extrabold tracking-tight">{brandTitle}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--orange-300)]">
            {brandSubtitle}
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 text-[11px]">
          <div className="truncate font-semibold">{userName}</div>
          {userMeta && <div className="mb-2 truncate text-white/40">{userMeta}</div>}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 text-white/60 transition-colors hover:text-[var(--orange-300)]"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--orange-50)] px-5 py-2.5 text-[11px] text-[var(--primary)]">
          <div className="min-w-0 flex-1 truncate">
            <span className="font-bold text-[var(--accent)]">Your journey:</span> {journey}
          </div>
          {searchHits && <PortalSearchTrigger onClick={() => setSearchOpen(true)} />}
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
      {searchHits && (
        <PortalSmartSearch
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          loadHits={loadHits}
          placeholder={searchPlaceholder}
        />
      )}
    </div>
  );
}

/** Shared portal page chrome — same navy/orange language as ERP. */
export function PortalPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-extrabold tracking-tight text-[var(--primary)]">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[12px] text-[var(--muted-foreground)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function PortalStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
        {label}
      </div>
      <div className="mt-1.5 text-[18px] font-black tabular-nums text-[var(--primary)]">{value}</div>
    </div>
  );
}

export function PortalSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[12px] font-bold text-[var(--primary)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <SkeletonRows rows={6} />
    </div>
  );
}

export function PortalPasswordGate({
  title,
  current,
  next,
  error,
  onCurrent,
  onNext,
  onSave,
}: {
  title?: string;
  current: string;
  next: string;
  error: string;
  onCurrent: (v: string) => void;
  onNext: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-sm space-y-3 rounded-2xl bg-[var(--card)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)]">
        <h1 className="text-[16px] font-extrabold text-[var(--primary)]">
          {title || "Change temporary password"}
        </h1>
        <input
          type="password"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-[12px] outline-none focus:border-[var(--accent)]"
          placeholder="Current password"
          value={current}
          onChange={(e) => onCurrent(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-[12px] outline-none focus:border-[var(--accent)]"
          placeholder="New password (min 8)"
          value={next}
          onChange={(e) => onNext(e.target.value)}
        />
        {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
        <button
          type="button"
          onClick={onSave}
          className="w-full rounded-xl py-2.5 text-[12px] font-bold text-white"
          style={{ background: gradient.accent }}
        >
          Save password
        </button>
      </div>
    </div>
  );
}
