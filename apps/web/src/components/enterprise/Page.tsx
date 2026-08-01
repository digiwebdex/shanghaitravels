import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { gradient } from "@/styles/tokens";
import { ErrorBanner } from "@/components/Feedback";

/**
 * TravelOS V4 enterprise furniture — shared with the public homepage brand:
 * Plus Jakarta Sans, navy/orange, navy-tint card rings, accent CTAs.
 */

export function PageShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto w-full space-y-5 p-4 sm:p-6 ${wide ? "max-w-[1600px]" : "max-w-[1400px]"}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-[10.5px] text-[var(--muted-foreground)]">
            {breadcrumb.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="opacity-50" />}
                {c.to ? (
                  <Link to={c.to} className="font-medium transition-colors hover:text-[var(--primary)]">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-[var(--foreground)]">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="flex items-center gap-2.5 text-[20px] font-extrabold tracking-[-0.02em] text-[var(--primary)]">
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--orange-50)] text-[var(--accent)] ring-1 ring-[var(--ring-card)]">
              <Icon size={18} />
            </span>
          )}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-[var(--muted-foreground)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Surface({
  children,
  className = "",
  padded,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl bg-[var(--card)] shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)] ${
        padded ? "p-4 sm:p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function SurfaceHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-bold text-[var(--primary)]">{title}</h2>
        {hint && <p className="mt-0.5 truncate text-[10.5px] text-[var(--muted-foreground)]">{hint}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/** KPI / statistics strip used on list and dashboard pages. */
export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}) {
  const valueTone =
    tone === "accent"
      ? "text-[var(--accent)]"
      : tone === "success"
        ? "text-[var(--success)]"
        : tone === "warning"
          ? "text-[var(--warning)]"
          : tone === "danger"
            ? "text-[var(--error)]"
            : "text-[var(--primary)]";
  return (
    <Surface padded className="!p-3.5 sm:!p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">{label}</p>
      <p className={`mt-1.5 text-[22px] font-extrabold tabular-nums tracking-tight ${valueTone}`}>{value}</p>
      {hint && <p className="mt-1 text-[10.5px] text-[var(--muted-foreground)]">{hint}</p>}
    </Surface>
  );
}

export function ListToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-4 py-3 sm:px-5">
      {children}
    </div>
  );
}

export const searchInputClassName =
  "w-full min-w-[160px] max-w-sm rounded-lg border border-[var(--border)] bg-[var(--input-background)] py-2 pl-8 pr-3 text-[12px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(249,115,22,0.15)]";

export const selectClassName =
  "rounded-lg border border-[var(--border)] bg-white px-2.5 py-2 text-[12px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

/** Full list page composition — one pattern for every ERP module. */
export function ListPageShell({
  title,
  subtitle,
  icon,
  breadcrumb,
  actions,
  moduleNav,
  stats,
  toolbar,
  error,
  wide,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumb?: { label: string; to?: string }[];
  actions?: ReactNode;
  moduleNav?: ReactNode;
  stats?: ReactNode;
  toolbar?: ReactNode;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <PageShell wide={wide}>
      <PageHeader title={title} subtitle={subtitle} icon={icon} breadcrumb={breadcrumb} actions={actions} />
      {moduleNav}
      {stats}
      <ErrorBanner message={error || ""} />
      <Surface>
        {toolbar}
        {children}
      </Surface>
    </PageShell>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-4 py-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-lg bg-[var(--navy-50)]"
          style={{ opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50";

export const btnPrimaryStyle = { background: gradient.accent } as const;

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2 text-[12px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--navy-50)] disabled:opacity-50";

export const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-[12px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(249,115,22,0.15)]";

export const labelCls = "mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]";
