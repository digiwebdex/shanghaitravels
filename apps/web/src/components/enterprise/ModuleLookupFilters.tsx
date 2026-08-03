import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Check, ChevronDown, IdCard, Users, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { agentsApi, customersApi, type Agent, type IntelligenceHit } from "@/lib/services";
import { listOf } from "@/lib/api";
import { listSearchHistory, recordSearch, type SearchHistoryItem } from "@/lib/smartSearchHistory";
import { useAgentFilter } from "@/lib/useAgentFilter";

/**
 * TravelOS V4.5.2 — module-level lookup filters that sit in the module filter
 * area (below the global header search), NOT in the global header.
 *
 * Both controls are enterprise Comboboxes composed from the existing ui/popover
 * + ui/command (cmdk) primitives — cmdk provides arrow/Enter/Escape navigation.
 * They REUSE existing APIs only (agentsApi.list, customersApi.intelligenceSearch)
 * and the existing smart-search history; no new search logic, no API/schema change.
 *
 * - Agent lookup   → agentsApi.list(); selecting records the agent filter in the
 *   URL (?agent=<id>) and fires onAgentSelect. (Server-side list filtering by
 *   agent is a follow-up that needs a backend agentId filter — out of scope here.)
 * - Passport lookup → customersApi.intelligenceSearch() (passport-first ranking),
 *   recent lookups first; selecting opens Customer Intelligence (Customer 360).
 */

const triggerCls =
  "flex h-9 items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--input-background)] px-3 text-[12px] text-[var(--foreground)] outline-none transition-colors hover:border-slate-300 focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(249,115,22,0.15)]";
const popoverCls = "w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0";

/** 250ms debounce (spec) so the dropdown reacts without spamming the API. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function AgentLookup({ onAgentSelect }: { onAgentSelect?: (agent: Agent) => void }) {
  const { setAgent } = useAgentFilter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 250);
  const [rows, setRows] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);
  const cache = useRef<Map<string, Agent[]>>(new Map());

  // Open immediately loads recent/available agents; typing searches (debounced).
  useEffect(() => {
    if (!open) return;
    const key = debounced.trim().toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setRows(cached);
      return;
    }
    let alive = true;
    setLoading(true);
    agentsApi
      .list({ q: key || undefined, limit: 20 })
      .then((res) => {
        if (!alive) return;
        const list = listOf<Agent>(res);
        cache.current.set(key, list);
        setRows(list);
      })
      .catch(() => {
        if (alive) setRows([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, debounced]);

  function choose(agent: Agent) {
    setSelected(agent);
    setOpen(false);
    setAgent(agent.id);
    onAgentSelect?.(agent);
  }

  function clearSelection() {
    setSelected(null);
    setAgent(null);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`${triggerCls} w-[280px] max-w-full`} aria-label="Agent Name / Reference">
          <span className="flex min-w-0 items-center gap-2">
            <Users size={13} className="flex-shrink-0 text-[var(--muted-foreground)]" />
            <span className={`truncate ${selected ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}`}>
              {selected ? `${selected.name} · ${selected.code}` : "Search Agent Name / Agent Code / Reference No."}
            </span>
          </span>
          <ChevronDown size={13} className="flex-shrink-0 text-[var(--muted-foreground)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={popoverCls}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type agent name or code…" value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="px-3 py-3 text-[11px] text-[var(--muted-foreground)]">Searching…</div>}
            {!loading && rows.length === 0 && <CommandEmpty>No agents found.</CommandEmpty>}
            {selected && (
              <CommandItem value="__clear__" onSelect={clearSelection} className="text-[var(--muted-foreground)]">
                Clear agent filter
              </CommandItem>
            )}
            {rows.length > 0 && (
              <CommandGroup heading={query.trim() ? "Results" : "Agents"}>
                {rows.map((a) => (
                  <CommandItem key={a.id} value={a.id} onSelect={() => choose(a)} className="gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[12px] font-semibold text-[var(--foreground)]">{a.name}</span>
                      <span className="truncate text-[10.5px] text-[var(--muted-foreground)]">
                        {a.code}
                        {a.phone ? ` · ${a.phone}` : ""}
                      </span>
                    </div>
                    {selected?.id === a.id && <Check size={13} className="ml-auto text-[var(--accent)]" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PassportLookup() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 250);
  const [hits, setHits] = useState<IntelligenceHit[]>([]);
  const [loading, setLoading] = useState(false);
  // Recent lookups first (reuses the existing smart-search history — no new API).
  const recent = useMemo<SearchHistoryItem[]>(() => (open ? listSearchHistory().slice(0, 8) : []), [open]);

  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let alive = true;
    setLoading(true);
    customersApi
      .intelligenceSearch(q)
      .then((res) => {
        if (alive) setHits(res.hits ?? []);
      })
      .catch(() => {
        if (alive) setHits([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, debounced]);

  function openCustomer(customerId: string | undefined, value: string, label?: string) {
    if (!customerId) return;
    recordSearch(value, { customerId, label });
    setOpen(false);
    setQuery("");
    navigate(`/customers/${customerId}`);
  }

  const typing = debounced.trim().length >= 2;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`${triggerCls} w-[260px] max-w-full`} aria-label="Passport Number">
          <span className="flex min-w-0 items-center gap-2">
            <IdCard size={13} className="flex-shrink-0 text-[var(--muted-foreground)]" />
            <span className="truncate text-[var(--muted-foreground)]">Search Passport Number</span>
          </span>
          <ChevronDown size={13} className="flex-shrink-0 text-[var(--muted-foreground)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className={popoverCls}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type passport number…" value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="px-3 py-3 text-[11px] text-[var(--muted-foreground)]">Searching…</div>}
            {!typing && recent.length > 0 && (
              <CommandGroup heading="Recent">
                {recent.map((r) => (
                  <CommandItem
                    key={r.q}
                    value={`recent:${r.q}`}
                    onSelect={() => (r.lastCustomerId ? openCustomer(r.lastCustomerId, r.q, r.lastLabel) : setQuery(r.q))}
                    className="gap-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[12px] font-semibold text-[var(--foreground)]">{r.q}</span>
                      {r.lastLabel && <span className="truncate text-[10.5px] text-[var(--muted-foreground)]">{r.lastLabel}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!typing && recent.length === 0 && !loading && (
              <div className="px-3 py-6 text-center text-[11px] text-[var(--muted-foreground)]">
                Start typing a passport number to search.
              </div>
            )}
            {typing && !loading && hits.length === 0 && <CommandEmpty>No matches found.</CommandEmpty>}
            {typing && hits.length > 0 && (
              <CommandGroup heading="Results">
                {hits.map((h, i) => (
                  <CommandItem
                    key={`${h.kind}:${h.matchValue}:${i}`}
                    value={`hit:${i}`}
                    onSelect={() => openCustomer(h.customerId, h.matchValue, h.label)}
                    className="gap-2"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[12px] font-semibold text-[var(--foreground)]">{h.label}</span>
                      <span className="truncate text-[10.5px] text-[var(--muted-foreground)]">
                        {h.matchValue}
                        {h.subtitle ? ` · ${h.subtitle}` : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Always-visible active-agent chip (hydrated from the URL) + one-click clear. */
function AgentFilterChip() {
  const { agentId, clearAgent } = useAgentFilter();
  const [agent, setAgentState] = useState<Agent | null>(null);
  useEffect(() => {
    if (!agentId) {
      setAgentState(null);
      return;
    }
    let alive = true;
    agentsApi
      .get(agentId)
      .then((a) => {
        if (alive) setAgentState(a);
      })
      .catch(() => {
        if (alive) setAgentState(null);
      });
    return () => {
      alive = false;
    };
  }, [agentId]);
  if (!agentId) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--orange-50)] px-3 py-1 text-[11.5px] font-semibold text-[var(--accent)]">
      <Users size={12} className="flex-shrink-0" />
      <span className="max-w-[220px] truncate">Agent: {agent ? `${agent.name} · ${agent.code}` : "…"}</span>
      <button
        type="button"
        onClick={clearAgent}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-[var(--orange-100)]"
        aria-label="Clear agent filter"
      >
        <X size={12} />
      </button>
    </span>
  );
}

/**
 * The two module lookup controls as one enterprise filter row (16px gap, tokenized).
 * Drop inside a Surface (list card) — it renders its own bordered toolbar row.
 * The active-agent chip appears here whenever ?agent= is set, on every page that
 * mounts this component, so the filter state is always visible and clearable.
 */
export function ModuleLookupFilters({
  className = "",
  onAgentSelect,
}: {
  className?: string;
  onAgentSelect?: (agent: Agent) => void;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 border-b border-[var(--border)] px-5 py-3.5 sm:px-6 ${className}`}>
      <AgentLookup onAgentSelect={onAgentSelect} />
      <PassportLookup />
      <AgentFilterChip />
    </div>
  );
}
