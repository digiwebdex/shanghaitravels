import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Circle, Upload } from "lucide-react";
import {
  applicationsApi,
  financeApi,
  ocrApi,
  passportsApi,
  settingsApi,
  usersApi,
} from "@/lib/services";
import { ApiError, listOf, validateUploadFile } from "@/lib/api";
import type {
  Account,
  AppDocument,
  Application,
  ApplicationStage,
  Invoice,
  Journey,
  StaffUser,
} from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { DemoBadge } from "@/components/DemoBadge";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import {
  DEFAULT_CHINA_CHECKLIST,
  DOC_CATEGORIES,
  VISA_TYPE_OPTIONS,
  type ChinaChecklist,
} from "@/config/checklist";
import { fmtBDTPlain, toPoisha } from "@/lib/money";
import CaseTimeline from "@/admin/shared/CaseTimeline";

const inputCls =
  "w-full px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400";
const labelCls = "block text-[10px] font-bold text-slate-500 mb-1";

const STATUS_PILL: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-800",
  docs_required: "bg-orange-100 text-orange-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  submitted: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-50 text-emerald-700",
};

export default function VisaCasePage() {
  const { id = "" } = useParams();
  const { can } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [docs, setDocs] = useState<AppDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [checklist, setChecklist] = useState<ChinaChecklist>(DEFAULT_CHINA_CHECKLIST);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checklistMeta, setChecklistMeta] = useState<
    Record<string, { checkedByName?: string | null; checkedAt?: string | null }>
  >({});
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const applyChecklistRows = useCallback(
    (
      items: {
        itemKey: string;
        checked: boolean;
        checkedAt?: string | null;
        checkedByName?: string | null;
      }[],
    ) => {
      const next: Record<string, boolean> = {};
      const meta: Record<string, { checkedByName?: string | null; checkedAt?: string | null }> = {};
      for (const row of items) {
        next[row.itemKey] = row.checked;
        meta[row.itemKey] = { checkedByName: row.checkedByName, checkedAt: row.checkedAt };
      }
      setChecked(next);
      setChecklistMeta(meta);
    },
    [],
  );

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [a, j] = await Promise.all([
        applicationsApi.get(id),
        applicationsApi.journey(id),
      ]);
      setApp(a);
      setJourney(j);
      try {
        setDocs(await applicationsApi.documents(id));
      } catch {
        setDocs([]);
      }

      if (can("invoice:amount:read") && a.customerId) {
        try {
          const inv = await financeApi.listInvoices({ customerId: a.customerId, limit: 50 });
          const all = listOf<Invoice>(inv);
          setInvoices(all.filter((i) => i.applicationId === a.id));
        } catch {
          setInvoices([]);
        }
      }
      if (can("bank:read")) {
        try {
          setAccounts(await financeApi.accounts());
        } catch {
          setAccounts([]);
        }
      }
      if (can("application:assign")) {
        try {
          setStaff(await usersApi.assignable());
        } catch {
          setStaff([]);
        }
      }
      try {
        const cl = await applicationsApi.getChecklist(id);
        applyChecklistRows(cl.items || []);
      } catch {
        /* keep empty until save */
      }
      if (can("settings:manage")) {
        try {
          const settings = await settingsApi.list();
          const row = settings.find((s) => s.key === "china_visa_checklist");
          if (row?.value && typeof row.value === "object") {
            setChecklist(row.value as ChinaChecklist);
          }
        } catch {
          /* keep default */
        }
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id, can, applyChecklistRows]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stages = useMemo(() => {
    const s = (journey?.stages || app?.stages || []).slice().sort((a, b) => a.stageNo - b.stageNo);
    return s;
  }, [app, journey]);

  const timelineStages = useMemo(
    () => stages.map((s) => ({ id: String(s.stageNo), label: s.name, sublabel: s.status })),
    [stages],
  );

  const currentIdx = useMemo(() => {
    const active = stages.findIndex((s) => s.status === "active");
    if (active >= 0) return active;
    const done = stages.filter((s) => s.status === "done").length;
    return Math.min(done, Math.max(0, stages.length - 1));
  }, [stages]);

  const visaTypeKey = useMemo(() => {
    const vt = app?.visa?.visaType || "tourist";
    return VISA_TYPE_OPTIONS.find((v) => v.value === vt)?.checklistKey || "L (Tourist)";
  }, [app]);

  const checklistItems = useMemo(() => {
    const typeItems = checklist.types?.[visaTypeKey] || [];
    return [...(checklist.common || []), ...typeItems];
  }, [checklist, visaTypeKey]);

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await action();
      setOk(success);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !app) {
    return (
      <div className="flex justify-center py-20">
        <InlineSpinner />
      </div>
    );
  }
  if (!app) {
    return (
      <div className="p-5">
        <ErrorBanner message={error || "Case not found"} />
        <Link to="/visa" className="text-[11px] text-amber-600 font-semibold">
          ← Visa cases
        </Link>
      </div>
    );
  }

  const doneAll = stages.length > 0 && stages.every((s) => s.status === "done");
  const outcome =
    app.status === "approved" ? "approved" : app.status === "rejected" ? "refused" : undefined;

  return (
    <div>
      <DemoBadge moduleKey="visa" />
      <div className="p-5 max-w-[1100px] space-y-4">
        <Link to="/visa" className="text-[11px] font-semibold text-slate-500 hover:text-slate-800">
          ← Visa cases
        </Link>

        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        {/* Header */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-mono font-bold text-amber-600">{app.referenceNo}</p>
              <h1 className="text-[16px] font-bold text-slate-800">
                {app.customer?.fullName || "Customer"} · China visa
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {app.title || "—"} · priority {app.priority} · stage {app.currentStage}/{app.totalStages}
                <span className={`ml-2 text-[9.5px] font-bold px-2 py-0.5 rounded ${STATUS_PILL[app.status] || "bg-slate-100"}`}>
                  {app.status}
                </span>
              </p>
            </div>
            <div className="text-[11px] text-slate-500 text-right">
              <p>
                Customer:{" "}
                <Link to="/customers" className="text-amber-700 font-semibold hover:underline">
                  {app.customer?.code}
                </Link>
              </p>
              <p>{app.customer?.phone}</p>
            </div>
          </div>
        </section>

        {/* Processing / status tracking */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-[12px] font-bold text-slate-800 mb-3">Processing & status tracking</h2>
          {timelineStages.length > 0 ? (
            <CaseTimeline
              stages={timelineStages}
              currentStage={currentIdx}
              outcome={outcome}
              variant="staff"
              showSublabel
              compact
            />
          ) : (
            <EmptyState title="No stages yet" />
          )}

          <div className="mt-4 space-y-1.5">
            {stages.map((s: ApplicationStage) => (
              <div key={s.id} className="flex items-center gap-2 text-[11px]">
                {s.status === "done" ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : s.status === "active" ? (
                  <Circle size={14} className="text-amber-500 fill-amber-200" />
                ) : (
                  <Circle size={14} className="text-slate-300" />
                )}
                <span className="font-semibold text-slate-700">
                  {s.stageNo}. {s.name}
                </span>
                <span className="text-slate-400">· {s.status}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3">
            <label className={labelCls}>Note for current stage (optional)</label>
            <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. COVA ref · CVASC appointment…" />
            <div className="flex flex-wrap gap-2 mt-3">
              <Can perm="application:note">
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  onClick={() => run(() => applicationsApi.note(app.id, note.trim()), "Note saved")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
                >
                  Save note
                </button>
              </Can>
              <Can perm="application:advance-stage">
                <button
                  type="button"
                  disabled={busy || doneAll || app.status === "approved"}
                  onClick={() =>
                    run(
                      () => applicationsApi.advance(app.id, note.trim() || undefined),
                      "Stage advanced",
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
                >
                  Advance stage →
                </button>
              </Can>
              <Can perm="application:approve">
                <button
                  type="button"
                  disabled={busy || app.status === "approved"}
                  onClick={() => run(() => applicationsApi.approve(app.id), "Case approved")}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-[10.5px] font-bold disabled:opacity-50"
                >
                  Approve / archive
                </button>
              </Can>
              <Can perm="application:update">
                <button
                  type="button"
                  disabled={busy || app.status === "rejected" || app.status === "approved"}
                  onClick={() =>
                    run(
                      () => applicationsApi.update(app.id, { status: "rejected" }),
                      "Case rejected",
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-[10.5px] font-bold disabled:opacity-50"
                >
                  Reject
                </button>
              </Can>
              <Can perm="application:update">
                <button
                  type="button"
                  disabled={busy || app.status === "completed"}
                  onClick={() =>
                    run(
                      () => applicationsApi.update(app.id, { status: "completed" }),
                      "Case marked completed (delivery / archive)",
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
                >
                  Mark delivered / archive
                </button>
              </Can>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <VisaDetailCard app={app} onSaved={reload} setError={setError} setOk={setOk} />
          <AssignCard
            app={app}
            staff={staff}
            onSaved={reload}
            setError={setError}
            setOk={setOk}
          />
        </div>

        <PassportOcrCard
          app={app}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />

        {/* Checklist — server-persisted per case */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-[12px] font-bold text-slate-800 mb-1">Document checklist</h2>
          <p className="text-[10px] text-slate-400 mb-3">
            China visa · {visaTypeKey} · synced for all staff. Uploads remain the file record.
          </p>
          <ul className="space-y-1.5">
            {checklistItems.map((item) => {
              const meta = checklistMeta[item];
              return (
                <li key={item}>
                  <label className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={!!checked[item]}
                      disabled={!can("application:update") || busy}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setChecked((c) => ({ ...c, [item]: next }));
                        void (async () => {
                          try {
                            const res = await applicationsApi.putChecklist(app.id, [
                              { itemKey: item, checked: next },
                            ]);
                            applyChecklistRows(res.items || []);
                          } catch (err) {
                            setChecked((c) => ({ ...c, [item]: !next }));
                            setError(err instanceof ApiError ? err.message : "Checklist save failed");
                          }
                        })();
                      }}
                    />
                    <span className="flex-1">
                      <span>{item}</span>
                      {checked[item] && meta?.checkedByName && (
                        <span className="block text-[9px] text-slate-400 mt-0.5">
                          ✓ {meta.checkedByName}
                          {meta.checkedAt
                            ? ` · ${new Date(meta.checkedAt).toLocaleString("en-BD")}`
                            : ""}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <DocumentsCard
          appId={app.id}
          docs={docs}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />

        <FinanceCard
          app={app}
          invoices={invoices}
          accounts={accounts}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />

        {/* History */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-[12px] font-bold text-slate-800 mb-3">
            History ({(journey?.events || app.events || []).length})
          </h2>
          {(journey?.events || app.events || []).length === 0 ? (
            <p className="text-[11px] text-slate-400">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {(journey?.events || app.events || []).map((ev) => (
                <li key={ev.id} className="flex gap-3 text-[11px] border-b border-slate-50 pb-2">
                  <span className="text-slate-400 flex-shrink-0 w-[140px]">
                    {new Date(ev.createdAt).toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 h-fit">
                    {ev.type}
                  </span>
                  <span className="text-slate-700">{ev.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function VisaDetailCard({
  app,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const v = app.visa || {};
  const [form, setForm] = useState({
    visaType: v.visaType || "tourist",
    destination: v.destination || "China",
    embassy: v.embassy || "CVASC Dhaka",
    entryType: v.entryType || "single",
    applicationNo: v.applicationNo || "",
    notes: v.notes || "",
  });

  useEffect(() => {
    setForm({
      visaType: app.visa?.visaType || "tourist",
      destination: app.visa?.destination || "China",
      embassy: app.visa?.embassy || "CVASC Dhaka",
      entryType: app.visa?.entryType || "single",
      applicationNo: app.visa?.applicationNo || "",
      notes: app.visa?.notes || "",
    });
  }, [app]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!can("application:update")) return;
    try {
      await applicationsApi.putVisa(app.id, {
        visaType: form.visaType,
        destination: form.destination,
        embassy: form.embassy,
        entryType: form.entryType,
        applicationNo: form.applicationNo || undefined,
        notes: form.notes || undefined,
      });
      setOk("Visa details saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Visa details</h2>
      <form onSubmit={save} className="space-y-2">
        <div>
          <label className={labelCls}>Visa type</label>
          <select
            className={inputCls}
            value={form.visaType}
            onChange={(e) => setForm({ ...form, visaType: e.target.value })}
            disabled={!can("application:update")}
          >
            {VISA_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Destination</label>
            <input className={inputCls} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} disabled={!can("application:update")} />
          </div>
          <div>
            <label className={labelCls}>Entry</label>
            <select className={inputCls} value={form.entryType} onChange={(e) => setForm({ ...form, entryType: e.target.value })} disabled={!can("application:update")}>
              <option value="single">single</option>
              <option value="double">double</option>
              <option value="multiple">multiple</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Embassy</label>
          <input className={inputCls} value={form.embassy} onChange={(e) => setForm({ ...form, embassy: e.target.value })} disabled={!can("application:update")} />
        </div>
        <div>
          <label className={labelCls}>COVA / application no</label>
          <input className={inputCls} value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} disabled={!can("application:update")} />
        </div>
        <Can perm="application:update">
          <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
            Save visa details
          </button>
        </Can>
      </form>
    </section>
  );
}

function AssignCard({
  app,
  staff,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  staff: StaffUser[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can, user } = useAuth();
  const [assignedTo, setAssignedTo] = useState(app.assignedTo || "");

  useEffect(() => {
    setAssignedTo(app.assignedTo || "");
  }, [app.assignedTo]);

  const options = staff.filter((u) => u.status === "active");

  async function save() {
    try {
      await applicationsApi.assign(app.id, assignedTo || null);
      setOk("Case assigned");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Assign failed");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Staff assignment</h2>
      {!can("application:assign") ? (
        <p className="text-[11px] text-slate-400">You do not have assign permission.</p>
      ) : (
        <>
          <label className={labelCls}>Assigned officer</label>
          <select className={inputCls} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">— unassigned —</option>
            {user && (
              <option value={user.id}>{user.fullName || user.email} (me)</option>
            )}
            {options
              .filter((u) => u.id !== user?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
          </select>
          {options.length === 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              No other active staff returned — you can still assign to yourself.
            </p>
          )}
          <button
            type="button"
            onClick={() => void save()}
            className="mt-3 px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            Save assignment
          </button>
        </>
      )}
    </section>
  );
}

function PassportOcrCard({
  app,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [passportNo, setNo] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [issue, setIssue] = useState("");
  const [expiry, setExpiry] = useState("");
  const [primary, setPrimary] = useState(true);
  const [ocrMsg, setOcrMsg] = useState("");
  const [scanId, setScanId] = useState<string | null>(null);

  async function saveManual(e: FormEvent) {
    e.preventDefault();
    if (!passportNo.trim()) {
      setError("Passport no is required");
      return;
    }
    try {
      if (scanId && can("ocr:apply")) {
        await ocrApi.apply(scanId, {
          customerId: app.customerId,
          fields: {
            passportNo: passportNo.trim(),
            issuingCountry: country || undefined,
            dateOfIssue: issue || undefined,
            dateOfExpiry: expiry || undefined,
          },
          isPrimary: primary,
        });
      } else {
        await passportsApi.create({
          customerId: app.customerId,
          passportNo: passportNo.trim(),
          issuingCountry: country || undefined,
          dateOfIssue: issue || undefined,
          dateOfExpiry: expiry || undefined,
          isPrimary: primary,
        });
      }
      setOk("Passport saved");
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Passport save failed");
    }
  }

  async function scan(file: File) {
    setOcrMsg("");
    const bad = validateUploadFile(file);
    if (bad) {
      setOcrMsg(bad);
      return;
    }
    try {
      const r = await ocrApi.scan(file, { customerId: app.customerId, applicationId: app.id });
      setScanId(r.id);
      const f = (r.fields || {}) as Record<string, string>;
      if (f.passportNo) setNo(f.passportNo);
      if (f.issuingCountry) setCountry(f.issuingCountry);
      if (f.dateOfExpiry) setExpiry(f.dateOfExpiry);
      if (f.dateOfIssue) setIssue(f.dateOfIssue);
      setOcrMsg(
        f.passportNo
          ? `OCR read ${f.fullName || f.passportNo} — verify fields and Save.`
          : "Couldn't read MRZ — enter details manually.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setOcrMsg("Passport scanning is pending approval — enter details manually.");
      } else {
        setOcrMsg(err instanceof ApiError ? err.message : "Scan failed");
      }
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Passport & OCR</h2>
      <form onSubmit={saveManual} className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <label className={labelCls}>Passport no *</label>
          <input className={inputCls} value={passportNo} onChange={(e) => setNo(e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Issuing country</label>
          <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Date of issue</label>
          <input type="date" className={inputCls} value={issue} onChange={(e) => setIssue(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Date of expiry</label>
          <input type="date" className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-[11px] text-slate-600 sm:col-span-2">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} /> Primary passport
        </label>
        <Can perm="ocr:apply">
          <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white w-fit" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
            Save passport
          </button>
        </Can>
      </form>
      <Can perm="ocr:use">
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-bold text-slate-500 mb-2">Scan (OCR)</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void scan(f);
            }}
            className="text-[11px]"
          />
          {ocrMsg && <p className="text-[11px] text-slate-600 mt-2">{ocrMsg}</p>}
        </div>
      </Can>
    </section>
  );
}

function DocumentsCard({
  appId,
  docs,
  onSaved,
  setError,
  setOk,
}: {
  appId: string;
  docs: AppDocument[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [category, setCategory] = useState<string>("passport");
  const [file, setFile] = useState<File | null>(null);

  async function upload() {
    if (!file) {
      setError("Choose a file");
      return;
    }
    const bad = validateUploadFile(file);
    if (bad) {
      setError(bad);
      return;
    }
    try {
      await applicationsApi.uploadDocument(appId, file, category);
      setFile(null);
      setOk("Document uploaded");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Document collection</h2>
      <Can perm="document:upload">
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {DOC_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className={labelCls}>File (JPG/PNG/WEBP/PDF, ≤15MB)</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[11px]" />
          </div>
          <button
            type="button"
            onClick={() => void upload()}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            <Upload size={12} /> Upload
          </button>
        </div>
      </Can>
      {docs.length === 0 ? (
        <p className="text-[11px] text-slate-400">No documents uploaded yet.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left text-[9.5px] uppercase text-slate-400">
              <th className="py-1 font-bold">Type</th>
              <th className="py-1 font-bold">File</th>
              <th className="py-1 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="text-[11px] border-t border-slate-50">
                <td className="py-2">{(d.category || "").replace(/_/g, " ")}</td>
                <td className="py-2">{d.fileName || "—"}</td>
                <td className="py-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100">{d.status || "uploaded"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!can("document:upload") && !can("document:read") && (
        <p className="text-[11px] text-slate-400">No document permission.</p>
      )}
    </section>
  );
}

function FinanceCard({
  app,
  invoices,
  accounts,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  invoices: Invoice[];
  accounts: Account[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can } = useAuth();
  const [desc, setDesc] = useState(`${app.title || "China visa"} — service fee`);
  const [amount, setAmount] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [method, setMethod] = useState("cash");
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accounts, accountId]);

  useEffect(() => {
    setActiveInvoice(invoices[0] || null);
  }, [invoices]);

  async function createInvoice() {
    const unitPrice = toPoisha(amount);
    if (unitPrice <= 0) {
      setError("Enter an amount");
      return;
    }
    try {
      const inv = await financeApi.createInvoice({
        customerId: app.customerId,
        applicationId: app.id,
        items: [{ description: desc.trim(), quantity: 1, unitPrice }],
      });
      setActiveInvoice(inv);
      setOk(`Invoice ${inv.invoiceNo} created (draft)`);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Invoice failed");
    }
  }

  async function issue() {
    if (!activeInvoice) return;
    try {
      const inv = await financeApi.issueInvoice(activeInvoice.id);
      setActiveInvoice(inv);
      setOk(`Invoice ${inv.invoiceNo} issued`);
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Issue failed");
    }
  }

  async function pay() {
    if (!activeInvoice) return;
    const amt = toPoisha(payAmount);
    if (amt <= 0 || !accountId) {
      setError("Enter payment amount and account");
      return;
    }
    try {
      await financeApi.recordPayment({
        invoiceId: activeInvoice.id,
        customerId: app.customerId,
        accountId,
        amount: amt,
        method,
      });
      setOk("Payment recorded");
      setPayAmount("");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Payment failed");
    }
  }

  if (!can("invoice:amount:read") && !can("invoice:manage")) {
    return (
      <section className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-[12px] font-bold text-slate-800 mb-2">Invoice & payment</h2>
        <p className="text-[11px] text-slate-400">Finance module hidden for your role.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Invoice & payment</h2>

      {activeInvoice && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
          <p className="font-bold text-slate-800">
            {activeInvoice.invoiceNo} · {fmtBDTPlain(activeInvoice.total)} ·{" "}
            <span className="text-slate-500">{activeInvoice.status}</span>
          </p>
          {activeInvoice.paid != null && (
            <p className="text-slate-500 mt-0.5">
              Paid {fmtBDTPlain(activeInvoice.paid)} · Due {fmtBDTPlain(activeInvoice.due)}
            </p>
          )}
        </div>
      )}

      <Can perm="invoice:manage">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Line description</label>
            <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Amount (৳)</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000.00" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => void createInvoice()} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
            Create invoice
          </button>
          {activeInvoice && activeInvoice.status === "draft" && (
            <button type="button" onClick={() => void issue()} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold">
              Issue invoice
            </button>
          )}
        </div>
      </Can>

      <Can perm="payment:record">
        {activeInvoice && ["issued", "partially_paid"].includes(activeInvoice.status) && (
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Record payment</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Amount (৳)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Account</label>
                <select className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Method</label>
                <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
                  {["cash", "bank_transfer", "bkash", "nagad", "card", "cheque", "other"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="button" onClick={() => void pay()} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}>
              Record payment
            </button>
          </div>
        )}
      </Can>
    </section>
  );
}
