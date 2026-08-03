import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Bookmark,
  Building2,
  CornerDownLeft,
  Pin,
  Search,
  Sparkles,
  Star,
  UserRound,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { searchPlaceholderForPath } from "@/config/contextUi";
import { NAV_LEAVES } from "@/config/nav";
import { QUICK_ACTIONS } from "@/config/quickActions";
import {
  customersApi,
  type IntelligenceHit,
  type IntelligenceProfile,
} from "@/lib/services";
import {
  listSearchHistory,
  mostSearched,
  recordSearch,
  toggleFavorite,
  togglePinned,
  type SearchHistoryItem,
} from "@/lib/smartSearchHistory";
import { bookingWorkspaceHref, customerWorkspaceHref } from "@/lib/workflow";
import { CustomerIntelligencePanel } from "@/components/search/CustomerIntelligencePanel";

type NavEntry = {
  id: string;
  label: string;
  to: string;
  group: string;
  icon: LucideIcon;
  haystack: string;
};

const KIND_LABEL: Record<IntelligenceHit["kind"], string> = {
  passport: "Passport",
  nid: "NID",
  customer_id: "Customer ID",
  booking: "Booking",
  visa_file: "Visa file",
  mobile: "Mobile",
  email: "Email",
  customer_name: "Customer name",
  agent: "Agent",
  corporate: "Corporate",
};

const profileCache = new Map<string, { at: number; data: IntelligenceProfile }>();
const CACHE_TTL = 60_000;

function hitHref(h: IntelligenceHit): string | null {
  if (h.applicationId) return bookingWorkspaceHref(h.applicationId);
  if (h.customerId) return customerWorkspaceHref(h.customerId);
  if (h.agentId) return "/partners/agents";
  if (h.corporateId) return "/partners/corporate";
  return null;
}

/**
 * Enterprise global smart search — Cmd/Ctrl-K.
 * Priority-ranked intelligence hits + 360° customer dashboard.
 */
export function GlobalSmartSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [hits, setHits] = useState<IntelligenceHit[]>([]);
  const [tookMs, setTookMs] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<IntelligenceProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof customersApi.intelligenceReports>> | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const placeholder = searchPlaceholderForPath(pathname);
  const canIntel = can("customer:read");

  const navEntries = useMemo<NavEntry[]>(() => {
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

  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navEntries.slice(0, 10);
    const terms = q.split(/\s+/);
    return navEntries.filter((e) => terms.every((t) => e.haystack.includes(t))).slice(0, 8);
  }, [navEntries, query]);

  type Row =
    | { type: "hit"; hit: IntelligenceHit; id: string }
    | { type: "nav"; entry: NavEntry; id: string };

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = hits.map((h, i) => ({
      type: "hit",
      hit: h,
      id: `hit-${h.kind}-${h.customerId || h.applicationId || h.agentId || h.corporateId || i}-${h.matchValue}`,
    }));
    for (const e of navResults) r.push({ type: "nav", entry: e, id: e.id });
    return r;
  }, [hits, navResults]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    setHits([]);
    setTookMs(null);
    setSelectedCustomerId(null);
    setProfile(null);
    setHistory(listSearchHistory());
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query, hits]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    if (!open || !canIntel) return;
    void customersApi
      .intelligenceReports()
      .then(setReports)
      .catch(() => setReports(null));
  }, [open, canIntel]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2 || !canIntel) {
      setHits([]);
      setTookMs(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await customersApi.intelligenceSearch(q);
          if (cancelled) return;
          setHits(res.hits || []);
          setTookMs(res.tookMs ?? null);
          const top = res.hits?.[0];
          if (top?.customerId) {
            setSelectedCustomerId(top.customerId);
          }
        } catch {
          if (!cancelled) {
            setHits([]);
            setTookMs(null);
          }
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, canIntel]);

  useEffect(() => {
    if (!selectedCustomerId || !canIntel) {
      setProfile(null);
      return;
    }
    const cached = profileCache.get(selectedCustomerId);
    if (cached && Date.now() - cached.at < CACHE_TTL) {
      setProfile(cached.data);
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    void customersApi
      .intelligenceProfile(selectedCustomerId)
      .then((data) => {
        if (cancelled) return;
        profileCache.set(selectedCustomerId, { at: Date.now(), data });
        setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, canIntel]);

  if (!open) return null;

  const activateHit = (h: IntelligenceHit) => {
    recordSearch(query.trim() || h.matchValue, {
      customerId: h.customerId,
      label: h.label,
    });
    setHistory(listSearchHistory());
    if (h.customerId) {
      setSelectedCustomerId(h.customerId);
      return;
    }
    const href = hitHref(h);
    if (href) {
      onClose();
      navigate(href);
    }
  };

  const activateNav = (to: string) => {
    onClose();
    navigate(to);
  };

  const onEnter = () => {
    const row = rows[cursor];
    if (!row) return;
    if (row.type === "hit") activateHit(row.hit);
    else activateNav(row.entry.to);
  };

  const topSearched = mostSearched(5);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-2 pt-[6vh] sm:p-4 sm:pt-[8vh]">
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
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
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
                setCursor((c) => Math.min(c + 1, Math.max(0, rows.length - 1)));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
            placeholder="Passport, NID, booking ID, mobile, email, customer / agent / corporate…"
            className="w-full bg-transparent text-[13px] text-[var(--primary)] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          {tookMs != null && (
            <span className="hidden whitespace-nowrap text-[9px] font-bold text-[var(--muted-foreground)] sm:inline">
              {tookMs}ms
            </span>
          )}
          <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--muted-foreground)]">
            ESC
          </kbd>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr]">
          <div className="flex min-h-0 flex-col border-b border-[var(--border)] md:border-b-0 md:border-r">
            <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
              {!canIntel && (
                <p className="px-3 py-4 text-[11px] text-[var(--muted-foreground)]">
                  Customer intelligence requires <code>customer:read</code>. Module navigation still works below.
                </p>
              )}

              {query.trim().length < 2 && (
                <div className="space-y-3 px-1 pb-2">
                  {history.filter((h) => h.pinned || h.favorite).length > 0 && (
                    <div>
                      <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Pinned / favorites
                      </p>
                      {history
                        .filter((h) => h.pinned || h.favorite)
                        .slice(0, 8)
                        .map((h) => (
                          <button
                            key={`fav-${h.q}`}
                            type="button"
                            onClick={() => {
                              setQuery(h.q);
                              if (h.lastCustomerId) setSelectedCustomerId(h.lastCustomerId);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-[var(--muted)]"
                          >
                            {h.pinned ? (
                              <Pin size={12} className="text-[var(--accent)]" />
                            ) : (
                              <Star size={12} className="text-[var(--accent)]" />
                            )}
                            <span className="truncate text-[12px] font-semibold text-[var(--primary)]">{h.q}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {history.length > 0 && (
                    <div>
                      <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Recent
                      </p>
                      {history.slice(0, 8).map((h) => (
                        <div key={`recent-${h.q}`} className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(h.q);
                              if (h.lastCustomerId) setSelectedCustomerId(h.lastCustomerId);
                            }}
                            className="min-w-0 flex-1 truncate rounded-xl px-2.5 py-2 text-left text-[12px] font-medium text-[var(--primary)] hover:bg-[var(--muted)]"
                          >
                            {h.q}
                            {h.lastLabel ? (
                              <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">· {h.lastLabel}</span>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            title="Pin"
                            onClick={() => {
                              togglePinned(h.q);
                              setHistory(listSearchHistory());
                            }}
                            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                          >
                            <Pin size={11} />
                          </button>
                          <button
                            type="button"
                            title="Favorite"
                            onClick={() => {
                              toggleFavorite(h.q);
                              setHistory(listSearchHistory());
                            }}
                            className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                          >
                            <Star size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(topSearched.length > 0 || reports) && (
                    <div>
                      <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                        Search insights
                      </p>
                      {topSearched.map((h) => (
                        <button
                          key={`top-${h.q}`}
                          type="button"
                          onClick={() => setQuery(h.q)}
                          className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left hover:bg-[var(--muted)]"
                        >
                          <span className="truncate text-[11px] text-[var(--primary)]">{h.q}</span>
                          <span className="text-[9px] font-bold text-[var(--muted-foreground)]">{h.count}×</span>
                        </button>
                      ))}
                      {reports && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5 px-1">
                          <Insight label="Duplicate passports" value={reports.totals.duplicateGroups} />
                          <Insight label="Expired" value={reports.totals.expired} />
                          <Insight label="Expiring soon" value={reports.totals.expiringSoon} />
                          <Insight label="Pending passports" value={reports.pendingPassports} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {query.trim().length >= 2 && (
                <>
                  {searching && !hits.length && (
                    <p className="px-3 py-4 text-[11px] text-[var(--muted-foreground)]">Searching…</p>
                  )}
                  {!searching && !hits.length && canIntel && (
                    <p className="px-3 py-3 text-[11px] text-[var(--muted-foreground)]">No intelligence matches</p>
                  )}
                  {rows.map((row, i) =>
                    row.type === "hit" ? (
                      <button
                        key={row.id}
                        type="button"
                        data-active={i === cursor ? "true" : "false"}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => activateHit(row.hit)}
                        className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left ${
                          i === cursor || selectedCustomerId === row.hit.customerId
                            ? "bg-[var(--orange-50)]"
                            : "hover:bg-[var(--muted)]"
                        }`}
                      >
                        {row.hit.kind === "booking" ? (
                          <Briefcase size={14} className="mt-0.5 text-[var(--muted-foreground)]" />
                        ) : row.hit.kind === "agent" || row.hit.kind === "corporate" ? (
                          <Building2 size={14} className="mt-0.5 text-[var(--muted-foreground)]" />
                        ) : (
                          <UserRound size={14} className="mt-0.5 text-[var(--muted-foreground)]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-[var(--primary)]">{row.hit.label}</p>
                          <p className="truncate text-[10px] text-[var(--muted-foreground)]">
                            {KIND_LABEL[row.hit.kind]} · {row.hit.subtitle}
                            {row.hit.duplicateHint ? " · existing customer" : ""}
                          </p>
                        </div>
                        {i === cursor && <CornerDownLeft size={12} className="mt-0.5 text-[var(--accent)]" />}
                      </button>
                    ) : (
                      <button
                        key={row.id}
                        type="button"
                        data-active={i === cursor ? "true" : "false"}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => activateNav(row.entry.to)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left ${
                          i === cursor ? "bg-[var(--orange-50)]" : "hover:bg-[var(--muted)]"
                        }`}
                      >
                        <row.entry.icon size={14} className="text-[var(--muted-foreground)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-[var(--primary)]">{row.entry.label}</p>
                          <p className="text-[10px] text-[var(--muted-foreground)]">{row.entry.group}</p>
                        </div>
                      </button>
                    ),
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 text-[9px] text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1">
                <Sparkles size={10} /> Intelligence · priority passport → corporate
              </span>
              <span className="inline-flex items-center gap-1">
                <Bookmark size={10} /> Recent / pinned
              </span>
            </div>
          </div>

          <div className="min-h-[40vh] overflow-hidden md:min-h-0">
            <CustomerIntelligencePanel profile={profile} loading={profileLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[var(--muted)] px-2 py-1.5">
      <div className="text-[8px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
      <div className="text-[13px] font-black tabular-nums text-[var(--primary)]">{value}</div>
    </div>
  );
}

/** Back-compat export used by AdminLayout. */
export { GlobalSmartSearch as CommandPalette };
