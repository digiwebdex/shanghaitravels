import { Link } from "react-router";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
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
              <span className="mx-0.5 hidden text-[10px] text-[var(--navy-200)] sm:inline" aria-hidden>
                →
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors ${
                current
                  ? "border-[var(--accent)] bg-[var(--orange-50)] text-[var(--accent)] shadow-sm ring-2 ring-[rgba(249,115,22,0.15)]"
                  : done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
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

/**
 * Explicit Previous · Current · Next so users always know where they are
 * in the product journey — not which module to open.
 */
export function JourneyContinuity({
  active,
  previousHint,
  nextHint,
}: {
  active?: MasterJourneyId;
  previousHint?: string;
  nextHint?: string;
}) {
  const idx = active ? MASTER_JOURNEY.findIndex((s) => s.id === active) : -1;
  const prev = idx > 0 ? MASTER_JOURNEY[idx - 1] : null;
  const curr = idx >= 0 ? MASTER_JOURNEY[idx] : null;
  const next = idx >= 0 && idx < MASTER_JOURNEY.length - 1 ? MASTER_JOURNEY[idx + 1] : null;

  return (
    <div className="space-y-3">
      <MasterJourneyStrip active={active} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <ContinuityCard
          kind="previous"
          label={prev?.label || "Start"}
          hint={previousHint || (prev ? `Completed · ${prev.label}` : "Journey start")}
        />
        <ContinuityCard
          kind="current"
          label={curr?.label || "—"}
          hint="You are here"
        />
        <ContinuityCard
          kind="next"
          label={next?.label || "Done"}
          hint={nextHint || (next ? `Up next · ${next.label}` : "Journey complete")}
        />
      </div>
    </div>
  );
}

function ContinuityCard({
  kind,
  label,
  hint,
}: {
  kind: "previous" | "current" | "next";
  label: string;
  hint: string;
}) {
  const styles =
    kind === "current"
      ? "border-[var(--accent)] bg-[var(--orange-50)]"
      : kind === "previous"
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-[var(--border)] bg-[var(--card)]";
  const tag =
    kind === "current" ? "Current step" : kind === "previous" ? "Previous step" : "Next step";
  return (
    <div className={`rounded-2xl border px-3.5 py-3 ${styles}`}>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{tag}</p>
      <p className="mt-1 flex items-center gap-1 text-[13px] font-extrabold text-[var(--primary)]">
        {kind === "next" && <ChevronRight size={14} className="text-[var(--accent)]" />}
        {label}
      </p>
      <p className="mt-0.5 text-[10.5px] text-[var(--muted-foreground)]">{hint}</p>
    </div>
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
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--orange-50)] via-[var(--card)] to-[var(--navy-50)] p-5 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
        <ArrowRight size={11} /> Recommended next step
      </p>
      <h3 className="mt-1.5 text-[15px] font-extrabold tracking-[-0.02em] text-[var(--primary)]">{title}</h3>
      <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[var(--muted-foreground)]">{body}</p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.to + a.label}
            to={a.to}
            className={`inline-flex items-center rounded-xl px-3.5 py-2 text-[11.5px] font-bold transition-opacity hover:opacity-90 ${
              a.primary
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "border border-[var(--border)] bg-[var(--card)] text-[var(--primary)]"
            }`}
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
