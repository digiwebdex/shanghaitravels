import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { CornerDownLeft, Search, type LucideIcon } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { NAV_LEAVES } from "@/config/nav";
import { QUICK_ACTIONS } from "@/config/quickActions";

type Entry = {
  id: string;
  label: string;
  to: string;
  group: string;
  icon: LucideIcon;
  haystack: string;
};

/**
 * Cmd/Ctrl-K navigator over every module the signed-in user can reach.
 * Replaces the previously decorative header search box.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 40);
    const terms = q.split(/\s+/);
    return entries.filter((e) => terms.every((t) => e.haystack.includes(t))).slice(0, 40);
  }, [entries, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search modules and actions"
        className="relative flex max-h-[62vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <Search size={15} className="flex-shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              }
              if (e.key === "Enter" && results[cursor]) {
                e.preventDefault();
                go(results[cursor].to);
              }
            }}
            placeholder="Search modules and actions…"
            className="flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <kbd className="flex-shrink-0 rounded border border-slate-200 px-1.5 py-[1px] font-mono text-[9px] font-semibold text-slate-400">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-[11.5px] text-slate-400">No matches for “{query}”</p>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.id}
                type="button"
                data-active={i === cursor}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(entry.to)}
                className={`flex w-full items-center gap-2.5 px-4 py-2 text-left transition-colors ${
                  i === cursor ? "bg-orange-50" : ""
                }`}
              >
                <entry.icon size={14} className={i === cursor ? "text-orange-600" : "text-slate-400"} />
                <span className="flex-1 truncate text-[12px] font-medium text-slate-700">{entry.label}</span>
                <span className="flex-shrink-0 text-[9.5px] uppercase tracking-wide text-slate-400">
                  {entry.group}
                </span>
                {i === cursor && <CornerDownLeft size={11} className="flex-shrink-0 text-orange-500" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
