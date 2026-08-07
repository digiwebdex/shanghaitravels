import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";

export type Column<T> = {
  key: string;
  /** Column heading — plain text, or a node (e.g. a select-all checkbox). */
  header: ReactNode;
  /** Tailwind width/alignment classes applied to both header and cell. */
  className?: string;
  render: (row: T) => ReactNode;
};

const ROW_HEIGHT = 38;
/** Below this many rows plain rendering is cheaper than windowing. */
const VIRTUALIZE_FROM = 80;
const OVERSCAN = 8;

/**
 * Table with a sticky header that switches to windowed rendering once the
 * dataset gets large, so supplier/invoice/ledger lists stay responsive
 * without pulling in a virtualization dependency.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  emptyTitle = "No records",
  emptyHint,
  maxHeight = 520,
  onRowClick,
  onRowDoubleClick,
  rowClassName,
  selectedKey,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  maxHeight?: number;
  /** Optional row interactions / styling — all additive, safe for existing usages. */
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  selectedKey?: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(maxHeight);

  const virtualize = rows.length >= VIRTUALIZE_FROM;

  useEffect(() => {
    if (!virtualize) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollTop(el.scrollTop);
    setViewport(el.clientHeight || maxHeight);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [virtualize, maxHeight]);

  const window = useMemo(() => {
    if (!virtualize) return { start: 0, end: rows.length, padTop: 0, padBottom: 0 };
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visible = Math.ceil(viewport / ROW_HEIGHT) + OVERSCAN * 2;
    const end = Math.min(rows.length, start + visible);
    return {
      start,
      end,
      padTop: start * ROW_HEIGHT,
      padBottom: (rows.length - end) * ROW_HEIGHT,
    };
  }, [virtualize, rows.length, scrollTop, viewport]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <InlineSpinner />
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  const slice = rows.slice(window.start, window.end);

  return (
    <div
      ref={scrollRef}
      className="overflow-auto"
      style={virtualize ? { maxHeight } : undefined}
      role="region"
      aria-label="Results"
    >
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--navy-50)]/95 backdrop-blur">
          <tr className="border-b border-[var(--border)]">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)] ${
                  c.className ?? ""
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {window.padTop > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length} style={{ height: window.padTop, padding: 0, border: 0 }} />
            </tr>
          )}
          {slice.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row) : undefined}
              className={`border-b border-[var(--border)] transition-colors last:border-0 hover:bg-[var(--navy-50)]/60 ${
                onRowClick || onRowDoubleClick ? "cursor-pointer" : ""
              } ${selectedKey && selectedKey === rowKey(row) ? "bg-[var(--navy-50)]" : ""} ${rowClassName ? rowClassName(row) : ""}`}
              style={virtualize ? { height: ROW_HEIGHT } : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2.5 text-[12px] text-[var(--foreground)] ${c.className ?? ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {window.padBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length} style={{ height: window.padBottom, padding: 0, border: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pill({ value, tone = "slate" }: { value: string; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    amber: "bg-orange-50 text-orange-700 border border-orange-100",
    red: "bg-red-50 text-red-700 border border-red-100",
    blue: "bg-blue-50 text-blue-700 border border-blue-100",
  } as const;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {value}
    </span>
  );
}

/** Maps common backend status strings onto pill tones. */
export function statusTone(status?: string | null): "slate" | "green" | "amber" | "red" | "blue" {
  const s = (status || "").toLowerCase();
  if (["posted", "approved", "paid", "published", "active", "completed", "sent", "done"].includes(s)) return "green";
  if (["suspended"].includes(s)) return "amber"; // orange
  if (["draft", "pending", "submitted", "in_progress", "issued", "queued", "open"].includes(s)) return "amber";
  if (["void", "rejected", "failed", "cancelled", "overdue"].includes(s)) return "red";
  if (["partial", "allocated", "in_review", "under_review", "kyc_review"].includes(s)) return "blue";
  if (["inactive", "deactivated", "archived"].includes(s)) return "slate"; // gray
  return "slate";
}
