import { Link } from "react-router";
import { Check } from "lucide-react";
import { MASTER_JOURNEY, type MasterJourneyId } from "@/lib/workflow";

/** Visual master pipeline — Lead → … → Repeat Customer */
export function MasterJourneyStrip({
  active,
  compact,
}: {
  active?: MasterJourneyId;
  compact?: boolean;
}) {
  const idx = active ? MASTER_JOURNEY.findIndex((s) => s.id === active) : -1;

  return (
    <ol
      className={`flex flex-wrap items-center gap-1 ${compact ? "" : "gap-1.5"}`}
      aria-label="Master booking journey"
    >
      {MASTER_JOURNEY.map((step, i) => {
        const done = idx >= 0 && i < idx;
        const current = idx >= 0 && i === idx;
        return (
          <li key={step.id} className="flex items-center gap-1">
            {i > 0 && (
              <span className="mx-0.5 hidden text-[10px] text-slate-300 sm:inline" aria-hidden>
                →
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                current
                  ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)]"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              {done && <Check size={10} />}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Next-step guidance so users never ask "which menu next?" */
export function NextStepBanner({
  title,
  body,
  actions,
}: {
  title: string;
  body: string;
  actions: { label: string; to: string; primary?: boolean }[];
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--orange-50)] via-white to-sky-50 p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">Recommended next step</p>
      <h3 className="mt-1 text-[15px] font-extrabold text-[var(--primary)]">{title}</h3>
      <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[var(--muted-foreground)]">{body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className={`inline-flex items-center rounded-xl px-3.5 py-2 text-[11.5px] font-bold ${
              a.primary
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "border border-[var(--border)] bg-white text-[var(--primary)]"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
