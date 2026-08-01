import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Circle, Building2 } from "lucide-react";
import { applicationsApi, financeApi, usersApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type {
  Account,
  AppDocument,
  Application,
  Invoice,
  Journey,
  StaffUser,
} from "@/lib/types";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { STATUS_PILL, inputCls } from "@/components/cases/formStyles";
import { CaseAssignCard } from "@/components/cases/CaseAssignCard";
import { CaseDocumentsCard } from "@/components/cases/CaseDocumentsCard";
import { CaseFinanceCard } from "@/components/cases/CaseFinanceCard";
import { HotelDetailCard } from "@/components/cases/HotelDetailCard";
import { HotelOpsCard } from "@/components/cases/HotelOpsCard";
import CaseTimeline from "@/admin/shared/CaseTimeline";
import { PageHeader, PageShell } from "@/components/enterprise/Page";

export default function HotelsCasePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [docs, setDocs] = useState<AppDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [a, j] = await Promise.all([applicationsApi.get(id), applicationsApi.journey(id)]);
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
          setInvoices(listOf<Invoice>(inv).filter((i) => i.applicationId === a.id));
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [id, can]);

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

  async function run(action: () => Promise<unknown>, success: string, clearNote = false) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await action();
      setOk(success);
      if (clearNote) setNote("");
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
        <Link to="/hotels" className="text-[11px] text-amber-600 font-semibold">
          ← Hotels
        </Link>
      </div>
    );
  }

  if (app.serviceType !== "hotel") {
    return (
      <div className="p-5">
        <ErrorBanner message={`This case is serviceType=${app.serviceType}, not hotel.`} />
        <Link to="/hotels" className="text-[11px] text-amber-600 font-semibold">
          ← Hotels
        </Link>
      </div>
    );
  }

  const doneAll = stages.length > 0 && stages.every((s) => s.status === "done");

  return (
    <PageShell>
      <PageHeader
        icon={Building2}
        title={app.referenceNo}
        subtitle={`${app.customer?.fullName || "Customer"} · ${app.title || "Hotel"} · stage ${app.currentStage}/${app.totalStages}`}
        breadcrumb={[{ label: "Hotels", to: "/hotels" }, { label: app.referenceNo }]}
        actions={
          <span className={`text-[10px] font-bold px-2 py-1 rounded ${STATUS_PILL[app.status] || STATUS_PILL.draft}`}>
            {app.status}
          </span>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-[12px] font-bold text-slate-800 mb-3">Workflow stages</h2>
          <CaseTimeline stages={timelineStages} currentStage={currentIdx} variant="staff" />
          <ul className="mt-4 space-y-1.5">
            {stages.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-[11px] text-slate-600">
                {s.status === "done" ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : s.status === "active" ? (
                  <Circle size={14} className="text-amber-500" />
                ) : (
                  <Circle size={14} className="text-slate-300" />
                )}
                <span className="font-semibold">
                  {s.stageNo}. {s.name}
                </span>
                <span className="text-slate-400">{s.status}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <input
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note / supplier ref…"
                aria-label="Case note"
              />
            </div>
            <Can perm="application:note">
              <button
                type="button"
                disabled={busy || !note.trim()}
                onClick={() =>
                  run(() => applicationsApi.note(app.id, note.trim()), "Note saved", true)
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              >
                Add note
              </button>
            </Can>
            <Can perm="application:advance-stage">
              <button
                type="button"
                disabled={busy || doneAll}
                onClick={() =>
                  run(
                    () => applicationsApi.advance(app.id, note.trim() || undefined),
                    "Stage advanced",
                    true,
                  )
                }
                className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}
              >
                Advance stage
              </button>
            </Can>
            <Can perm="application:approve">
              <button
                type="button"
                disabled={busy || !doneAll || app.status === "approved"}
                onClick={() => run(() => applicationsApi.approve(app.id), "Case approved")}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 text-[10.5px] font-semibold text-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
            </Can>
            <Can perm="application:update">
              <button
                type="button"
                disabled={busy || app.status === "completed"}
                onClick={() =>
                  run(
                    () => applicationsApi.update(app.id, { status: "completed" }),
                    "Case marked completed",
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10.5px] font-semibold disabled:opacity-50"
              >
                Mark delivered / archive
              </button>
            </Can>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HotelDetailCard
            appId={app.id}
            detail={app.hotel}
            onSaved={reload}
            setError={setError}
            setOk={setOk}
          />
          <CaseAssignCard app={app} staff={staff} onSaved={reload} setError={setError} setOk={setOk} />
        </div>

        <HotelOpsCard
          app={app}
          stages={stages}
          detail={app.hotel}
          onSaved={reload}
          setError={setError}
          setOk={setOk}
        />

        <CaseDocumentsCard
          appId={app.id}
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
          defaultDescription={`${app.title || "Hotel"} — hotel fee`}
        />

        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-[12px] font-bold text-slate-800 mb-3">History</h2>
          {(journey?.events || app.events || []).length === 0 ? (
            <p className="text-[11px] text-slate-400">No events yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {(journey?.events || app.events || []).map((ev) => (
                <li key={ev.id} className="text-[11px] border-b border-slate-50 pb-2">
                  <span className="font-bold text-slate-700">{ev.type}</span>
                  <span className="text-slate-400 ml-2">{new Date(ev.createdAt).toLocaleString("en-BD")}</span>
                  <p className="text-slate-600 mt-0.5">{ev.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
    </PageShell>
  );
}
