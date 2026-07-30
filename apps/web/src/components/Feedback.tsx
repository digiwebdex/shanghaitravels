export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-14 px-4">
      <p className="text-[12px] font-bold text-slate-500">{title}</p>
      {hint && <p className="text-[10.5px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-3 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold" role="alert">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-3 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold" role="status">
      {message}
    </div>
  );
}
