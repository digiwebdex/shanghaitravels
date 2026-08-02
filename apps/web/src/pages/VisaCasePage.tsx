import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Circle, FileCheck } from "lucide-react";
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
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import {
  DEFAULT_CHINA_CHECKLIST,
  VISA_TYPE_OPTIONS,
  type ChinaChecklist,
} from "@/config/checklist";
import {
  PassportOcrReview,
  emptyPassportForm,
  formFromOcrScan,
  type OcrScanResult,
} from "@/components/ocr/PassportOcrReview";
import CaseTimeline from "@/admin/shared/CaseTimeline";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { CaseAssignCard } from "@/components/cases/CaseAssignCard";
import { CaseDocumentsCard } from "@/components/cases/CaseDocumentsCard";
import { CaseFinanceCard } from "@/components/cases/CaseFinanceCard";
import { inputCls, labelCls, STATUS_PILL } from "@/components/cases/formStyles";

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
    <PageShell>
      <PageHeader
        icon={FileCheck}
        title={`${app.customer?.fullName || "Customer"} · China visa`}
        subtitle={`${app.title || "—"} · priority ${app.priority} · stage ${app.currentStage}/${app.totalStages}`}
        breadcrumb={[{ label: "Visa Services", to: "/visa" }, { label: app.referenceNo }]}
        actions={
          <div className="flex flex-col items-end gap-1 text-[11px] text-[var(--muted-foreground)]">
            <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${STATUS_PILL[app.status] || "bg-slate-100"}`}>
              {app.status}
            </span>
            <p>
              Customer:{" "}
              <Link to="/customers" className="font-semibold text-[var(--accent)] hover:underline">
                {app.customer?.code}
              </Link>
            </p>
            <p>{app.customer?.phone}</p>
          </div>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

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
                  style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
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
          <CaseAssignCard
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

        <CaseDocumentsCard
          appId={app.id}
          customerId={app.customerId}
          docs={docs}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />

        <CaseFinanceCard
          app={app}
          invoices={invoices}
          accounts={accounts}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
          defaultDescription={`${app.title || "China visa"} — service fee`}
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
    </PageShell>
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
          <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
            Save visa details
          </button>
        </Can>
      </form>
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
  const [form, setForm] = useState(() => emptyPassportForm());
  const [scan, setScan] = useState<OcrScanResult | null>(null);
  const [primary, setPrimary] = useState(true);
  const [ocrMsg, setOcrMsg] = useState("");
  const [scanning, setScanning] = useState(false);

  async function saveManual(e: FormEvent) {
    e.preventDefault();
    if (!form.passportNo.trim()) {
      setError("Passport no is required");
      return;
    }
    try {
      // Memory-only OCR scans are not persisted — always save via /passports.
      await passportsApi.create({
        customerId: app.customerId,
        passportNo: form.passportNo.trim(),
        issuingCountry: form.issuingCountry || undefined,
        dateOfIssue: form.dateOfIssue || undefined,
        dateOfExpiry: form.dateOfExpiry || undefined,
        isPrimary: primary,
      });
      setOk("Passport saved");
      setForm(emptyPassportForm());
      setScan(null);
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Passport save failed");
    }
  }

  async function scanFile(file: File) {
    setOcrMsg("");
    setScanning(true);
    const bad = validateUploadFile(file);
    if (bad) {
      setOcrMsg(bad);
      setScanning(false);
      return;
    }
    try {
      const r = await ocrApi.scan(file, { customerId: app.customerId, applicationId: app.id });
      const result = r as OcrScanResult;
      setScan(result);
      setForm(formFromOcrScan(result));
      const f = (r.fields || {}) as Record<string, string>;
      setOcrMsg(
        f.passportNo
          ? `OCR read ${f.fullName || f.passportNo} — verify amber fields (<90%) then Save.`
          : "Couldn't read MRZ — enter details manually.",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setOcrMsg("Passport scanning is pending approval — enter details manually.");
      } else {
        setOcrMsg(err instanceof ApiError ? err.message : "Scan failed");
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-[12px] font-bold text-slate-800">Passport & OCR</h2>
      <Can perm="ocr:use">
        <div className="mb-3">
          <p className="mb-2 text-[10px] font-bold text-slate-500">Scan passport page</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            disabled={scanning}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void scanFile(f);
            }}
            className="text-[11px]"
          />
          {scanning && <p className="mt-2 text-[11px] text-slate-500">Scanning…</p>}
        </div>
      </Can>
      <form onSubmit={saveManual} className="space-y-3">
        <PassportOcrReview scan={scan} form={form} onChange={setForm} message={ocrMsg} />
        <label className="flex items-center gap-2 text-[11px] text-slate-600">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} /> Primary passport
        </label>
        <Can perm="ocr:apply">
          <button
            type="submit"
            className="w-fit rounded-lg px-3 py-1.5 text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
          >
            Save passport
          </button>
        </Can>
      </form>
    </section>
  );
}

