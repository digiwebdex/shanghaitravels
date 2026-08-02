import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Briefcase,
  CornerDownLeft,
  FileText,
  Package,
  Quote,
  Search,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { searchPlaceholderForPath } from "@/config/contextUi";
import { NAV_LEAVES } from "@/config/nav";
import { QUICK_ACTIONS } from "@/config/quickActions";
import { applicationsApi, crmApi, customersApi, packagesApi, suppliersApi } from "@/lib/services";
import { listOf } from "@/lib/api";
import type { Application, Customer, Supplier } from "@/lib/types";
import { bookingWorkspaceHref, customerWorkspaceHref, serviceLabel } from "@/lib/workflow";

type Entry = {
  id: string;
  label: string;
  to: string;
  group: string;
  icon: LucideIcon;
  haystack: string;
};

/**
 * Cmd/Ctrl-K — navigates modules + live entity search (customers, bookings, etc.).
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [entityHits, setEntityHits] = useState<Entry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const placeholder = searchPlaceholderForPath(pathname);

  const entries = useMemo<Entry[]>(() => {
    const nav = NAV_LEAVES.filter((l) => !l.perm || can(l.perm)).map((l) => ({
      id: `nav-${l.id}`,
      label: l.label,
      to: l.to,
      group: l.section || "Navigate",
      icon: l.icon,
      haystack: `${l.label} ${l.section} ${l.keywords ?? ""}`.toLowerCase(),
    }));
    const actions = QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm)).map((a) => ({
      id: `act-${a.id}`,
      label: a.label,
      to: a.to,
      group: "Actions",
      icon: a.icon,
      haystack: `${a.label} create new`.toLowerCase(),
    }));
    return [...actions, ...nav];
  }, [can]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    setEntityHits([]);
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query, entityHits]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setEntityHits([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        const hits: Entry[] = [];
        try {
          if (can("customer:read")) {
            const custs = listOf<Customer>(await customersApi.list({ q, limit: 8 }));
            for (const c of custs) {
              hits.push({
                id: `cust-${c.id}`,
                label: `${c.fullName} (${c.code})`,
                to: customerWorkspaceHref(c.id),
                group: "Customers",
                icon: UserRound,
                haystack: `${c.fullName} ${c.code} ${c.phone} ${c.email || ""}`.toLowerCase(),
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          if (can("application:read")) {
            const apps = listOf<Application>(await applicationsApi.list({ q, limit: 8 }));
            for (const a of apps) {
              hits.push({
                id: `app-${a.id}`,
                label: `${a.referenceNo} · ${serviceLabel(a.serviceType)}`,
                to: bookingWorkspaceHref(a.id),
                group: "Bookings",
                icon: Briefcase,
                haystack: `${a.referenceNo} ${a.title || ""} ${a.serviceType}`.toLowerCase(),
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          if (can("supplier:read")) {
            const sup = listOf<Supplier>(await suppliersApi.list({ q, limit: 6 }));
            for (const s of sup) {
              hits.push({
                id: `sup-${s.id}`,
                label: s.name,
                to: `/partners/suppliers`,
                group: "Suppliers",
                icon: Package,
                haystack: `${s.name} ${s.type || ""}`.toLowerCase(),
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          if (can("crm:read")) {
            const leads = await crmApi.listLeads({ q, limit: 6 });
            for (const l of leads.data || []) {
              hits.push({
                id: `lead-${l.id}`,
                label: l.name || "Lead",
                to: "/crm",
                group: "Leads",
                icon: Sparkles,
                haystack: `${l.name || ""} ${l.phone || ""}`.toLowerCase(),
              });
            }
          }
        } catch {
          /* ignore */
        }
        try {
          const pkgs = listOf<{ id: string; name: string }>(await packagesApi.list({ q, limit: 6 } as never));
          for (const p of pkgs) {
            hits.push({
              id: `pkg-${p.id}`,
              label: p.name,
              to: `/products/packages`,
              group: "Packages",
              icon: FileText,
              haystack: p.name.toLowerCase(),
            });
          }
        } catch {
          /* ignore */
        }
        if (!cancelled) setEntityHits(hits);
      })();
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, can]);

  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 24);
    const terms = q.split(/\s+/);
    return entries.filter((e) => terms.every((t) => e.haystack.includes(t))).slice(0, 24);
  }, [entries, query]);

  const results = useMemo(() => [...entityHits, ...navResults], [entityHits, navResults]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--navy-900)]/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={placeholder}
        className="relative flex max-h-[62vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
      >
        <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
          <Search size={15} className="flex-shrink-0 text-[var(--muted-foreground)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, Math.max(0, results.length - 1)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              }
              if (e.key === "Enter" && results[cursor]) go(results[cursor].to);
            }}
            placeholder="Search customers, bookings, passport refs, suppliers, leads…"
            className="w-full bg-transparent text-[13px] text-[var(--primary)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted-foreground)]">
            ESC
          </kbd>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {!results.length ? (
            <p className="px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)]">No matches</p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                data-active={i === cursor ? "true" : "false"}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(r.to)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${
                  i === cursor ? "bg-[var(--orange-50)]" : "hover:bg-[var(--muted)]"
                }`}
              >
                <r.icon size={15} className="text-[var(--muted-foreground)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-[var(--primary)]">{r.label}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{r.group}</p>
                </div>
                {i === cursor && <CornerDownLeft size={12} className="text-[var(--accent)]" />}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--muted-foreground)]">
          <span>Global search · modules + live entities</span>
          <span className="inline-flex items-center gap-1">
            <Quote size={10} /> invoices via Finance desk
          </span>
        </div>
      </div>
    </div>
  );
}
