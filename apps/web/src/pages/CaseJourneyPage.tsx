import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Route } from "lucide-react";
import { applicationsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application, Journey } from "@/lib/types";
import {
  PageHeader,
  PageShell,
  Surface,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import CaseTimeline, { CANONICAL_STAGES } from "@/admin/shared/CaseTimeline";

/**
 * Case Journey Map — Figma shared CaseTimeline wired to live journey API.
 * Without ?id=, shows the canonical product journey definition (Lead→Archive).
 */
export default function CaseJourneyPage() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const [cases, setCases] = useState<Application[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void applicationsApi
      .list({ serviceType: "visa", limit: 50 })
      .then((r) => setCases(listOf<Application>(r)))
      .catch(() => setCases([]));
  }, []);

  useEffect(() => {
    if (!id) {
      setJourney(null);
      setApp(null);
      return;
    }
    setLoading(true);
    setError("");
    Promise.all([applicationsApi.get(id), applicationsApi.journey(id)])
      .then(([a, j]) => {
        setApp(a);
        setJourney(j);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load journey"))
      .finally(() => setLoading(false));
  }, [id]);

  const stages = useMemo(() => {
    if (!journey?.stages?.length) return CANONICAL_STAGES;
    return journey.stages
      .slice()
      .sort((a, b) => a.stageNo - b.stageNo)
      .map((s) => ({ id: String(s.stageNo), label: s.name, sublabel: s.status }));
  }, [journey]);

  const current = useMemo(() => {
    if (!journey?.stages?.length) return 0;
    const sorted = journey.stages.slice().sort((a, b) => a.stageNo - b.stageNo);
    const active = sorted.findIndex((s) => s.status === "active");
    if (active >= 0) return active;
    return sorted.filter((s) => s.status === "done").length;
  }, [journey]);

  const outcome =
    app?.status === "approved" ? "approved" : app?.status === "rejected" ? "refused" : undefined;

  return (
    <PageShell>
      <PageHeader
        icon={Route}
        title="Case Journey Map"
        subtitle="Lead → Customer → Passport → OCR → Visa → Documents → Checklist → Invoice → Payment → Assignment → Processing → Delivery → Archive"
        breadcrumb={[{ label: "Bookings", to: "/visa" }, { label: "Case Journey" }]}
      />

      <Surface padded className="mb-4">
        <label className={labelCls}>Visa case</label>
        <select
          className={`${inputCls} max-w-md`}
          value={id}
          onChange={(e) => {
            const next = e.target.value;
            const url = next ? `/case-journey?id=${next}` : "/case-journey";
            window.location.hash = `#${url}`;
          }}
        >
          <option value="">— product journey definition —</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.referenceNo} · {c.customer?.fullName || "—"} · {c.status}
            </option>
          ))}
        </select>
        {id && (
          <Link
            to={`/visa/${id}`}
            className="mt-2 inline-block text-[11px] font-semibold text-[var(--accent)] hover:underline"
          >
            Open case workspace →
          </Link>
        )}
      </Surface>

      <ErrorBanner message={error} />

      {loading ? (
        <div className="flex justify-center py-16">
          <InlineSpinner />
        </div>
      ) : (
        <Surface padded>
          <CaseTimeline
            stages={stages}
            currentStage={current}
            outcome={outcome}
            variant="portal"
            showSublabel
          />
        </Surface>
      )}
    </PageShell>
  );
}
