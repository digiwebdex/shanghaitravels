import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";

export default function PortalApplicationDetailPage() {
  const { id = "" } = useParams();
  const [app, setApp] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .application(id)
      .then(setApp)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Not found"));
  }, [id]);

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <Link className="text-[11px] text-[var(--accent)] underline" to="/portal/customer/applications">
        ← Applications
      </Link>
      {error && <p className="text-red-600 text-[12px]">{error}</p>}
      {app && (
        <>
          <h1 className="text-[16px] font-bold">
            {app.referenceNo} · {app.serviceType}
          </h1>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Status: <span className="font-semibold">{app.status}</span> · Stage {app.currentStage}/{app.totalStages}
          </p>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Stages</h2>
            <ul className="text-[11px] space-y-1">
              {(app.stages || []).map((s: any) => (
                <li key={s.stageNo}>
                  {s.stageNo}. {s.name} — {s.status}
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white border rounded-xl p-4">
            <h2 className="text-[12px] font-bold mb-2">Timeline</h2>
            <ul className="text-[11px] space-y-1">
              {(app.events || []).map((e: any, i: number) => (
                <li key={i}>
                  {new Date(e.createdAt).toLocaleString()} · {e.type}: {e.message}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
