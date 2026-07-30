import { useParams, Link } from "react-router";
import { AlertCircle, CreditCard, Download, MessageSquare } from "lucide-react";
import { MOCK_APPLICATIONS, WORKFLOW_STAGES, STATUS_CONFIG } from "./data";
import { CaseTimeline } from "../admin/shared/CaseTimeline";

export default function Track() {
  const { id } = useParams();
  const app = MOCK_APPLICATIONS.find(a => a.id === id) ?? MOCK_APPLICATIONS[0];
  const cfg = STATUS_CONFIG[app.status];

  // Map portal WORKFLOW_STAGES → shared CaseTimeline format
  const tlStages  = WORKFLOW_STAGES.map(s => ({ id: s.key, label: s.label }));
  const tlEntries = app.timeline.map((t: { stage: number; date: string; note: string }) => ({
    stageIndex: t.stage,
    date:       t.date,
    note:       t.note,
  }));
  const tlOutcome =
    app.status === "approved" || app.status === "delivered" ? "approved" as const :
    app.status === "rejected" ? "refused" as const : undefined;

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">{app.ref}</p>
          <h1 className="text-foreground text-xl font-bold mb-1">{app.service}</h1>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs text-muted-foreground">{app.destination}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{app.travellers} traveller{app.travellers > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/portal/invoice/${app.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
            <Download size={13} /> Invoice
          </Link>
          <Link to="/portal/support" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
            <MessageSquare size={13} /> Support
          </Link>
          {!app.feePaid && (
            <Link to={`/portal/payment/${app.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-orange-600 transition-colors">
              <CreditCard size={13} /> Pay Now
            </Link>
          )}
        </div>
      </div>

      {/* Action required alert */}
      {app.status === "action_required" && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
          <AlertCircle size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-700">Action Required</p>
            <p className="text-xs text-orange-600 mt-0.5">
              {app.docs.filter(d => d.status === "rejected").map(d => d.name).join(", ")} — please re-upload with corrections.{" "}
              <Link to="/portal/documents" className="font-bold underline">Go to Documents →</Link>
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-7">
          <h2 className="text-foreground font-bold mb-6">Application Timeline</h2>
          <CaseTimeline
            stages={tlStages}
            currentStage={app.stage}
            entries={tlEntries}
            outcome={tlOutcome}
            variant="portal"
          />
        </div>

        {/* Sidebar details */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Application Details</p>
            <div className="space-y-3">
              {[
                { label: "Reference",      val: app.ref },
                { label: "Service",        val: app.service },
                { label: "Destination",    val: app.destination },
                { label: "Travel Date",    val: app.travelDate },
                { label: "Submitted",      val: app.submittedDate || "Pending" },
                { label: "Expected",       val: app.expectedDate },
                { label: "Total Fee",      val: app.totalFee },
                { label: "Payment",        val: app.feePaid ? "Paid" : "Pending" },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-semibold text-right ${r.label === "Payment" ? (app.feePaid ? "text-green-600" : "text-orange-500") : "text-foreground"}`}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</p>
            <div className="space-y-2">
              {app.docs.map(d => (
                <div key={d.name} className="flex items-center justify-between gap-2">
                  <p className="text-xs text-foreground truncate">{d.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${d.status === "verified" ? "bg-green-100 text-green-700" : d.status === "rejected" ? "bg-red-100 text-red-700" : d.status === "uploaded" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                    {d.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/portal/documents" className="mt-3 block text-xs text-accent hover:underline font-semibold">Manage Documents →</Link>
          </div>

          <div className="bg-primary rounded-xl p-5">
            <p className="text-white font-bold text-sm mb-1">Need Help?</p>
            <p className="text-white/60 text-xs mb-3">Our team typically responds within 2 hours during business hours.</p>
            <Link to="/portal/support" className="block w-full text-center py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-orange-500 transition-colors">Open Support Ticket</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
