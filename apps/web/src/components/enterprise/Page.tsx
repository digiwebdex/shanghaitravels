import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * Shared page furniture for the enterprise shell: a consistent header,
 * surface card and section heading so every module reads the same way.
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
          <nav aria-label="Breadcrumb" className="mb-1.5 flex items-center gap-1 text-[10.5px] text-slate-400">
            {breadcrumb.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="text-slate-300" />}
                {c.to ? (
                  <Link to={c.to} className="font-medium transition-colors hover:text-slate-600">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="flex items-center gap-2 text-[19px] font-bold tracking-[-0.01em] text-slate-900">
          {Icon && <Icon size={18} className="text-amber-600" />}
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">{subtitle}</p>}
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
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
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
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="truncate text-[12.5px] font-bold text-slate-800">{title}</h2>
        {hint && <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{hint}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50";

export const btnPrimaryStyle = { background: "linear-gradient(135deg,#F59E0B,#B45309)" } as const;

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50";
