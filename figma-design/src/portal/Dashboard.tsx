import { Link } from "react-router";
import { FilePlus, Upload, CreditCard, MessageSquare, ArrowRight, Clock, AlertCircle, CheckCircle2, Loader2, FileText } from "lucide-react";
import { MOCK_APPLICATIONS, STATUS_CONFIG, WORKFLOW_STAGES } from "./data";

const QUICK_ACTIONS = [
  { to: "/portal/apply",        icon: FilePlus,      label: "New Application",  desc: "Start a visa, flight, or hotel application",   color: "bg-accent" },
  { to: "/portal/documents",    icon: Upload,        label: "Upload Documents",  desc: "Add or update documents for an application",    color: "bg-[#0891B2]" },
  { to: "/portal/payment/app-001", icon: CreditCard, label: "Make Payment",     desc: "Pay outstanding application fees",              color: "bg-[#16A34A]" },
  { to: "/portal/support",      icon: MessageSquare, label: "Contact Support",   desc: "Message our team for help or updates",          color: "bg-[#7C3AED]" },
];

const STATUS_ICON: Record<string, React.ElementType> = {
  draft: FileText, submitted: Loader2, processing: Loader2,
  action_required: AlertCircle, interview: Clock,
  approved: CheckCircle2, rejected: AlertCircle, delivered: CheckCircle2,
};

export default function Dashboard() {
  const pendingAction = MOCK_APPLICATIONS.filter(a => a.status === "action_required").length;

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-muted-foreground text-sm mb-0.5">Good morning,</p>
          <h1 className="text-foreground text-2xl font-bold">Ahmad Al-Rashidi</h1>
        </div>
        {pendingAction > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle size={15} className="text-orange-600" />
            <p className="text-sm font-semibold text-orange-700">{pendingAction} application{pendingAction > 1 ? "s" : ""} require action</p>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Applications", value: MOCK_APPLICATIONS.length.toString(), sub: "All time" },
          { label: "In Progress",        value: MOCK_APPLICATIONS.filter(a => ["submitted","processing","interview"].includes(a.status)).length.toString(), sub: "Active now" },
          { label: "Approved",           value: MOCK_APPLICATIONS.filter(a => a.status === "approved").length.toString(), sub: "This year" },
          { label: "Action Required",    value: pendingAction.toString(), sub: "Needs your input", alert: pendingAction > 0 },
        ].map(k => (
          <div key={k.label} className={`bg-card rounded-xl border p-5 ${k.alert ? "border-orange-200 bg-orange-50" : "border-border"}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{k.label}</p>
            <p className={`text-3xl font-bold mb-0.5 ${k.alert ? "text-orange-600" : "text-foreground"}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Applications list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-bold">My Applications</h2>
            <Link to="/portal/apply" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">New <ArrowRight size={11} /></Link>
          </div>

          {MOCK_APPLICATIONS.map(app => {
            const cfg = STATUS_CONFIG[app.status];
            const StatusIcon = STATUS_ICON[app.status] || FileText;
            const stageLabel = WORKFLOW_STAGES[app.stage]?.label ?? "Unknown";
            return (
              <Link key={app.id} to={`/portal/track/${app.id}`} className="block bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all group">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{app.service}</p>
                      <p className="text-xs text-muted-foreground">{app.ref} · {app.destination}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>

                {/* Mini workflow strip */}
                <div className="flex items-center gap-0.5 mb-3">
                  {WORKFLOW_STAGES.map((s, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < app.stage ? "bg-green-400" : i === app.stage ? "bg-accent" : "bg-border"}`} />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <StatusIcon size={11} className={app.status === "action_required" ? "text-orange-500" : ""} />
                    Stage {app.stage + 1}/10 · {stageLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    {app.status === "action_required" ? (
                      <span className="text-orange-600 font-semibold flex items-center gap-1"><AlertCircle size={11} /> Action Required</span>
                    ) : (
                      <>Expected: {app.expectedDate}</>
                    )}
                    <ArrowRight size={11} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div>
            <h2 className="text-foreground font-bold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 p-3.5 bg-card rounded-xl border border-border hover:shadow-sm hover:border-primary/20 transition-all group">
                  <div className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
                    <a.icon size={15} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-foreground font-bold mb-3">Recent Activity</h2>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {[
                { text: "Document rejected: Salary Certificate", time: "2h ago",  type: "alert" },
                { text: "UK Visa application submitted",          time: "5d ago",  type: "success" },
                { text: "Payment confirmed — AED 1,020",         time: "6d ago",  type: "success" },
                { text: "Passport OCR completed",                time: "8d ago",  type: "info" },
                { text: "New inquiry created: UK Visa",          time: "10d ago", type: "info" },
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5">
                  <div className={`size-1.5 rounded-full mt-1.5 flex-shrink-0 ${act.type === "alert" ? "bg-orange-400" : act.type === "success" ? "bg-green-400" : "bg-blue-400"}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-foreground">{act.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
