export function FullPageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F0F2F5]">
      <div
        className="size-8 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin"
        role="status"
        aria-label={label}
      />
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

export function InlineSpinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
