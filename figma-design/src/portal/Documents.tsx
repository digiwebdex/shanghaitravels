import { useState, useRef } from "react";
import { CheckCircle2, XCircle, Clock, Upload, FileText, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { MOCK_APPLICATIONS, DocStatus } from "./data";

const STATUS_CFG: Record<DocStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:  { icon: Clock,         color: "text-muted-foreground", bg: "bg-muted",       label: "Pending Upload" },
  uploaded: { icon: Clock,         color: "text-[#0369A1]",        bg: "bg-[#E0F2FE]",   label: "Under Review" },
  verified: { icon: CheckCircle2,  color: "text-green-700",        bg: "bg-green-100",   label: "Verified" },
  rejected: { icon: XCircle,       color: "text-red-700",          bg: "bg-red-100",     label: "Rejected" },
};

export default function Documents() {
  const [selectedApp, setSelectedApp] = useState(MOCK_APPLICATIONS[0].id);
  const [localDocs, setLocalDocs] = useState<Record<string, DocStatus>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const app = MOCK_APPLICATIONS.find(a => a.id === selectedApp) ?? MOCK_APPLICATIONS[0];

  const getStatus = (doc: { name: string; status: DocStatus }) =>
    (localDocs[doc.name] as DocStatus) ?? doc.status;

  const handleUpload = (docName: string) => {
    setLocalDocs(d => ({ ...d, [docName]: "uploaded" }));
  };

  const counts = {
    verified: app.docs.filter(d => getStatus(d) === "verified").length,
    uploaded: app.docs.filter(d => getStatus(d) === "uploaded").length,
    pending:  app.docs.filter(d => getStatus(d) === "pending").length,
    rejected: app.docs.filter(d => getStatus(d) === "rejected").length,
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-foreground text-xl font-bold mb-1">Documents</h1>
          <p className="text-sm text-muted-foreground">Upload and manage documents for your applications.</p>
        </div>
        <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background appearance-none focus:outline-none max-w-[260px]">
          {MOCK_APPLICATIONS.map(a => <option key={a.id} value={a.id}>{a.ref} · {a.service}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Verified",       count: counts.verified, color: "text-green-700 bg-green-100" },
          { label: "Under Review",   count: counts.uploaded, color: "text-blue-700 bg-blue-100" },
          { label: "Pending Upload", count: counts.pending,  color: "text-muted-foreground bg-muted" },
          { label: "Rejected",       count: counts.rejected, color: "text-red-700 bg-red-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Action required banner */}
      {counts.rejected > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">{counts.rejected} document{counts.rejected > 1 ? "s" : ""} rejected — please re-upload with corrections.</p>
        </div>
      )}

      {/* Overall progress */}
      <div className="bg-card rounded-xl border border-border p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">Upload Progress</p>
          <p className="text-sm font-bold text-foreground">{counts.verified + counts.uploaded}/{app.docs.length} documents</p>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${((counts.verified + counts.uploaded) / app.docs.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{counts.verified} verified · {counts.uploaded} under review · {counts.pending} remaining</p>
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {app.docs.map((doc) => {
          const status = getStatus(doc);
          const cfg = STATUS_CFG[status];
          const Icon = cfg.icon;
          const isDraggingThis = dragging === doc.name;

          return (
            <div
              key={doc.name}
              onDragOver={e => { e.preventDefault(); setDragging(doc.name); }}
              onDragLeave={() => setDragging(null)}
              onDrop={e => { e.preventDefault(); setDragging(null); handleUpload(doc.name); }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${isDraggingThis ? "border-accent bg-orange-50" : status === "rejected" ? "border-red-200 bg-red-50" : status === "verified" ? "border-green-200 bg-green-50" : "border-border bg-card"}`}
            >
              <div className={`size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon size={17} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                  {doc.required && <span className="text-[9px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded font-bold uppercase">Required</span>}
                </div>
                {doc.note && status === "rejected" && (
                  <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={10} /> {doc.note}</p>
                )}
                {!doc.note && <p className="text-xs text-muted-foreground">PDF, JPG or PNG · Max 10MB</p>}
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
              <div className="flex gap-2">
                {status === "verified" && (
                  <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><Eye size={14} /></button>
                )}
                {(status === "pending" || status === "rejected") && (
                  <button onClick={() => fileRefs.current[doc.name]?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors">
                    <Upload size={12} /> {status === "rejected" ? "Re-upload" : "Upload"}
                  </button>
                )}
                {status === "uploaded" && (
                  <button onClick={() => handleUpload(doc.name)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-colors">
                    <RefreshCw size={12} /> Replace
                  </button>
                )}
                <input ref={el => { fileRefs.current[doc.name] = el; }} type="file" className="hidden" accept="image/*,.pdf" onChange={() => handleUpload(doc.name)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging("zone"); }}
        onDragLeave={() => setDragging(null)}
        onDrop={e => { e.preventDefault(); setDragging(null); }}
        className={`mt-5 border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragging === "zone" ? "border-accent bg-orange-50" : "border-border hover:border-primary/30 hover:bg-muted/20"}`}
      >
        <FileText size={28} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground mb-1">Drag & drop files here</p>
        <p className="text-xs text-muted-foreground">Or click Upload on a specific document above</p>
      </div>
    </div>
  );
}
