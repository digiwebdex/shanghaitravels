import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";

export default function CorporateRequestDetailPage() {
  const { id = "" } = useParams();
  const [req, setReq] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setReq(await corporatePortalApi.travelRequest(id));
  }

  useEffect(() => {
    void corporatePortalApi
      .travelRequest(id)
      .then(setReq)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Not found"));
  }, [id]);

  async function cancel() {
    try {
      await corporatePortalApi.cancelTravelRequest(id);
      setOk("Request cancelled");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel failed");
    }
  }

  const canCancel = req && ["draft", "submitted"].includes(String(req.status));

  return (
    <div className="p-5 max-w-3xl space-y-4">
      <Link className="text-[11px] text-teal-700 underline" to="/portal/corporate/requests">
        ← Requests
      </Link>
      {error && <p className="text-red-600 text-[12px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      {req && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[16px] font-bold">
                {req.referenceNo || req.reference} · {req.serviceType}
              </h1>
              <p className="text-[12px] text-slate-600">
                {req.employee?.fullName || req.employeeName} · {req.status}
              </p>
            </div>
            {canCancel && (
              <button type="button" onClick={() => void cancel()} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-[11px] font-semibold">
                Cancel request
              </button>
            )}
          </div>
          <section className="bg-white border rounded-xl p-4 text-[11px] space-y-1">
            <p>
              <span className="text-slate-500">Purpose:</span> {String(req.purpose || "—")}
            </p>
            {req.notes && (
              <p>
                <span className="text-slate-500">Notes:</span> {String(req.notes)}
              </p>
            )}
          </section>
          {(req.approvals || req.approvalHistory)?.length > 0 && (
            <section className="bg-white border rounded-xl p-4">
              <h2 className="text-[12px] font-bold mb-2">Approval history</h2>
              <ul className="text-[11px] space-y-1">
                {(req.approvals || req.approvalHistory).map((a: any, i: number) => (
                  <li key={a.id || i}>
                    {a.stepName || a.role} · {a.decision || a.status} · {a.comment || ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
