import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export type TrackStage = { stageNo: number; name: string; status: string; completedAt?: string | null };
export type TrackData = {
  referenceNo: string;
  serviceType?: string;
  status: string;
  currentStage?: number;
  totalStages?: number;
  title?: string | null;
  customerName?: string;
  updatedAt?: string;
  stages: TrackStage[];
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_progress: "In progress",
  docs_required: "Documents required",
  on_hold: "On hold",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Reusable booking progress tracker — used by the public /track page and the
 * customer/agent portals. Renders the stage stepper + current status. Falls back
 * to a status-only view when a case has no configured stages.
 */
export function BookingTracker({ data }: { data: TrackData }) {
  const pct = data.totalStages ? Math.round((Math.min(data.currentStage ?? 0, data.totalStages) / data.totalStages) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-mono text-[13px] font-bold text-[var(--primary)]">{data.referenceNo}</div>
          {data.serviceType && <div className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{data.serviceType.replace(/_/g, " ")}</div>}
        </div>
        <span className="rounded-full bg-[var(--orange-50,#fff4ec)] px-3 py-1 text-[11px] font-bold text-[var(--accent)]">
          {STATUS_LABEL[data.status] || data.status}
        </span>
      </div>

      {data.totalStages ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      ) : null}

      {data.stages.length > 0 ? (
        <ol className="space-y-2">
          {data.stages.map((s) => {
            const done = s.status === "completed" || s.status === "done";
            const active = s.status === "active" || s.status === "in_progress";
            return (
              <li key={s.stageNo} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                ) : active ? (
                  <Loader2 size={18} className="shrink-0 animate-spin text-[var(--accent)]" />
                ) : (
                  <Circle size={18} className="shrink-0 text-[var(--muted-foreground)]" />
                )}
                <span className={`text-[12.5px] ${done ? "text-[var(--muted-foreground)] line-through" : active ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground)]"}`}>
                  {s.name}
                </span>
                {done && s.completedAt && (
                  <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">{new Date(s.completedAt).toLocaleDateString("en-GB")}</span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-lg bg-[var(--muted,#f4f4f5)] px-3 py-2 text-[11.5px] text-[var(--muted-foreground)]">
          This booking is being processed. Detailed stage tracking will appear here as it progresses.
        </p>
      )}

      {data.updatedAt && (
        <p className="text-[10px] text-[var(--muted-foreground)]">Last updated {new Date(data.updatedAt).toLocaleString("en-GB")}</p>
      )}
    </div>
  );
}
