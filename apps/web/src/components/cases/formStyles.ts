/** Shared case-form chrome — V4.2 brand tokens (no slate admin leftovers). */
export const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-2.5 py-2 text-[11px] text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(249,115,22,0.15)]";
export const labelCls =
  "mb-1 block text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]";

export const STATUS_PILL: Record<string, string> = {
  draft: "bg-[var(--navy-50)] text-[var(--primary)]",
  in_progress: "bg-[var(--orange-100)] text-[var(--orange-700)]",
  docs_required: "bg-[var(--orange-50)] text-[var(--accent)]",
  on_hold: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  submitted: "bg-[var(--info-bg)] text-[var(--info-foreground)]",
  approved: "bg-[var(--success-bg)] text-[var(--success-foreground)]",
  rejected: "bg-[var(--error-bg)] text-[var(--error-foreground)]",
  completed: "bg-[var(--success-bg)] text-[var(--success-foreground)]",
  cancelled: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};
