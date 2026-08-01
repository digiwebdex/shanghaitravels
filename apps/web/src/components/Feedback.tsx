export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="rounded-2xl bg-[var(--navy-50)] px-4 py-14 text-center ring-1 ring-[var(--ring-card)]"
      role="status"
    >
      <p className="text-[12px] font-bold text-[var(--navy-700)]">{title}</p>
      {hint && <p className="mt-1 text-[10.5px] text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-800"
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div
      className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] font-semibold text-emerald-800"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
