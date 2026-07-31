import { useEffect, useState } from "react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { ApiError } from "@/lib/api";

export default function CorporateApprovalsPage() {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [comment, setComment] = useState<Record<string, string>>({});

  async function load() {
    setRows(await corporatePortalApi.approvals());
  }

  useEffect(() => {
    void load().catch((e) => setError(e instanceof ApiError ? e.message : "Failed"));
  }, []);

  async function decide(id: string, decision: "approve" | "reject") {
    try {
      await corporatePortalApi.decide(id, { decision, comment: comment[id] || undefined });
      setOk(`Request ${decision === "approve" ? "approved" : "rejected"}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Decision failed");
    }
  }

  return (
    <div className="p-5 max-w-5xl space-y-4">
      <h1 className="text-[16px] font-bold">Pending approvals</h1>
      <p className="text-[11px] text-slate-500">Review and decide on travel requests awaiting your approval.</p>
      {error && <p className="text-red-600 text-[11px]">{error}</p>}
      {ok && <p className="text-emerald-700 text-[11px]">{ok}</p>}
      <ul className="bg-white border rounded-xl divide-y text-[11px]">
        {rows.map((r) => (
          <li key={String(r.id)} className="p-4 space-y-2">
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {String(r.referenceNo || r.travelRequest?.referenceNo || r.id)} · {String(r.serviceType || r.travelRequest?.serviceType)}
                </div>
                <div className="text-slate-500">
                  {String(r.employee?.fullName || r.travelRequest?.employee?.fullName || "—")} · {String(r.purpose || r.travelRequest?.purpose || "")}
                </div>
              </div>
              <span className="text-slate-400 shrink-0">{String(r.stepName || r.status || "pending")}</span>
            </div>
            <input
              className="w-full border rounded-lg px-3 py-1.5 text-[11px]"
              placeholder="Comment (optional)"
              value={comment[String(r.id)] || ""}
              onChange={(e) => setComment((prev) => ({ ...prev, [String(r.id)]: e.target.value }))}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => void decide(String(r.id), "approve")} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold">
                Approve
              </button>
              <button type="button" onClick={() => void decide(String(r.id), "reject")} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-[11px] font-bold">
                Reject
              </button>
            </div>
          </li>
        ))}
        {!rows.length && <li className="p-4 text-slate-400">No pending approvals</li>}
      </ul>
    </div>
  );
}
