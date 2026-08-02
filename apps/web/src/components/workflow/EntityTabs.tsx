import type { ReactNode } from "react";

export type EntityTab = {
  id: string;
  label: string;
  /** Hide when false */
  show?: boolean;
};

/**
 * Horizontal workspace tabs for Customer 360 / Booking 360.
 * Large spacing, V4 enterprise chrome — not the module WorkspaceTabs.
 */
export function EntityTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: EntityTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  const visible = tabs.filter((t) => t.show !== false);
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Workspace sections"
    >
      {visible.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`shrink-0 rounded-2xl border px-3.5 py-2 text-[11.5px] font-bold transition-colors ${
              on
                ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]"
                : "border-[var(--border)] bg-white text-[var(--primary)] hover:border-slate-300"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export function EntityTabPanel({
  when,
  active,
  children,
}: {
  when: string;
  active: string;
  children: ReactNode;
}) {
  if (when !== active) return null;
  return <div className="space-y-4 pt-1">{children}</div>;
}
