import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Search, UserRound, X } from "lucide-react";
import { recordSearch, listSearchHistory } from "@/lib/smartSearchHistory";

export type PortalSearchHit = {
  id: string;
  label: string;
  subtitle?: string;
  to: string;
  kind: "booking" | "document" | "passport" | "customer" | "employee" | "case";
};

/**
 * Scoped portal search — own data only (customer / agent / corporate).
 * Shares UX patterns with ERP GlobalSmartSearch without staff intelligence APIs.
 */
export function PortalSmartSearch({
  open,
  onClose,
  placeholder = "Search your bookings, documents, passport…",
  loadHits,
}: {
  open: boolean;
  onClose: () => void;
  placeholder?: string;
  loadHits: (q: string) => Promise<PortalSearchHit[]>;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PortalSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState(() => listSearchHistory().slice(0, 6));

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHits([]);
    setRecent(listSearchHistory().slice(0, 6));
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      void loadHits(q)
        .then((h) => {
          if (!cancelled) setHits(h);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, open, loadHits]);

  if (!open) return null;

  const go = (hit: PortalSearchHit) => {
    recordSearch(query.trim() || hit.label, { label: hit.label });
    onClose();
    navigate(hit.to);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 pt-[12vh]">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[var(--navy-900)]/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[70vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
          <Search size={14} className="text-[var(--muted-foreground)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && hits[0]) go(hits[0]);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {query.trim().length < 2 &&
            recent.map((r) => (
              <button
                key={r.q}
                type="button"
                onClick={() => setQuery(r.q)}
                className="block w-full truncate rounded-xl px-3 py-2 text-left text-[12px] hover:bg-[var(--muted)]"
              >
                {r.q}
              </button>
            ))}
          {loading && <p className="px-3 py-4 text-[11px] text-[var(--muted-foreground)]">Searching…</p>}
          {!loading &&
            hits.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => go(h)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-[var(--orange-50)]"
              >
                {h.kind === "document" || h.kind === "passport" ? (
                  <FileText size={14} className="text-[var(--muted-foreground)]" />
                ) : (
                  <UserRound size={14} className="text-[var(--muted-foreground)]" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--primary)]">{h.label}</p>
                  {h.subtitle && <p className="truncate text-[10px] text-[var(--muted-foreground)]">{h.subtitle}</p>}
                </div>
              </button>
            ))}
          {!loading && query.trim().length >= 2 && !hits.length && (
            <p className="px-3 py-6 text-center text-[11px] text-[var(--muted-foreground)]">No matches in your portal</p>
          )}
        </div>
        <div className="border-t border-[var(--border)] px-3 py-1.5 text-[9px] text-[var(--muted-foreground)]">
          Portal-scoped search · your records only
        </div>
      </div>
    </div>
  );
}

export function PortalSearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted-foreground)] shadow-sm hover:border-[var(--accent)] hover:text-[var(--primary)]"
    >
      <Search size={13} />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden rounded border border-[var(--border)] px-1 text-[9px] sm:inline">⌘K</kbd>
    </button>
  );
}
