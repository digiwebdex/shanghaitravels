import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, BadgeCheck, Ban, CheckCircle2, Handshake, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { agentsApi, agentTiersApi, type Agent, type AgentAuditRow, type AgentTier } from "@/lib/services";
import { ApiError } from "@/lib/api";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { AgentWalletCard } from "@/components/agents/AgentWalletCard";
import { AgentDocumentsCard } from "@/components/agents/AgentDocumentsCard";
import { AgentContextCards } from "@/components/agents/AgentContextCards";
import {
  PageHeader,
  PageShell,
  Surface,
  SurfaceHeader,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  selectClassName,
} from "@/components/enterprise/Page";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className={labelCls}>{label}</div>
      <div className="text-[12.5px] font-medium text-[var(--foreground)]">{value || "—"}</div>
    </div>
  );
}

export default function AgentDetailPage({ agentId, embedded }: { agentId?: string; embedded?: boolean } = {}) {
  const params = useParams();
  const id = agentId ?? params.id ?? "";
  const { can } = useAuth();
  const canManage = can("agent:manage");
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tiers, setTiers] = useState<AgentTier[]>([]);
  const [trail, setTrail] = useState<AgentAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [kyc, setKyc] = useState({ kycStatus: "pending", kycNotes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, t, tl] = await Promise.all([agentsApi.get(id), agentTiersApi.list().catch(() => []), agentsApi.timeline(id).catch(() => [])]);
      setAgent(a);
      setTiers(t);
      setTrail(tl);
      setKyc({ kycStatus: a.kycStatus || "pending", kycNotes: a.kycNotes || "" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load agent");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(fn: () => Promise<unknown>, msg: string) {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await fn();
      setOk(msg);
      setRejecting(false);
      setRejectReason("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading && !agent) {
    return (
      <PageShell>
        <div className="p-10 text-center text-[12px] text-[var(--muted-foreground)]">Loading…</div>
      </PageShell>
    );
  }
  if (!agent) {
    return (
      <PageShell>
        <ErrorBanner message={error || "Agent not found"} />
        {!embedded && (
          <Link to="/partners/agents" className={btnGhost}>
            <ArrowLeft size={12} /> Back to agents
          </Link>
        )}
      </PageShell>
    );
  }

  const status = agent.status || "active";

  return (
    <PageShell wide>
      <PageHeader
        icon={Handshake}
        title={agent.name}
        subtitle={`${agent.code}${agent.companyName ? ` · ${agent.companyName}` : ""}`}
        breadcrumb={[{ label: "Business Partners", to: "/partners/suppliers" }, { label: "Agents", to: "/partners/agents" }, { label: agent.name }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Pill value={status} tone={statusTone(status)} />
            {!embedded && (
              <Link to="/partners/agents" className={btnGhost}>
                <ArrowLeft size={12} /> Back
              </Link>
            )}
            <Can perm="agent:manage">
              <>
                {status === "pending" && (
                  <>
                    <button type="button" disabled={busy} className={btnPrimary} style={btnPrimaryStyle} onClick={() => void act(() => agentsApi.approve(agent.id), "Agent approved")}>
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button type="button" disabled={busy} className={btnGhost} onClick={() => setRejecting((s) => !s)}>
                      <XCircle size={12} /> Reject
                    </button>
                  </>
                )}
                {status === "active" && (
                  <button type="button" disabled={busy} className={btnGhost} onClick={() => void act(() => agentsApi.suspend(agent.id), "Agent suspended")}>
                    <Ban size={12} /> Suspend
                  </button>
                )}
                {status === "suspended" && (
                  <button type="button" disabled={busy} className={btnPrimary} style={btnPrimaryStyle} onClick={() => void act(() => agentsApi.reinstate(agent.id), "Agent reinstated")}>
                    <RotateCcw size={13} /> Reinstate
                  </button>
                )}
              </>
            </Can>
          </div>
        }
      />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {rejecting && status === "pending" && (
        <Can perm="agent:manage">
          <Surface>
            <SurfaceHeader title="Reject application" hint="A reason is required and is recorded in the audit trail." />
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-end sm:p-5">
              <div className="flex-1">
                <label className={labelCls} htmlFor="rej">Reason *</label>
                <input id="rej" className={inputCls} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. KYC documents could not be verified" />
              </div>
              <button
                type="button"
                disabled={busy || !rejectReason.trim()}
                className={btnPrimary}
                style={btnPrimaryStyle}
                onClick={() => void act(() => agentsApi.reject(agent.id, { reason: rejectReason.trim() }), "Application rejected")}
              >
                <XCircle size={13} /> Confirm reject
              </button>
            </div>
          </Surface>
        </Can>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Profile" />
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
            <Field label="Code" value={agent.code} />
            <Field label="Status" value={status} />
            <Field label="Phone" value={agent.phone} />
            <Field label="Email" value={agent.email} />
            <Field label="Owner / Proprietor" value={agent.ownerName} />
            <Field label="Company" value={agent.companyName} />
            <Field label="Contact person" value={agent.contactPerson} />
            <Field label="Trade license" value={agent.tradeLicenseNo} />
            <Field label="National ID" value={agent.nationalId} />
            <Field label="Address" value={agent.address} />
            <div>
              <div className={labelCls}>Tier</div>
              {canManage ? (
                <select
                  className={selectClassName}
                  value={agent.tierId || ""}
                  disabled={busy}
                  onChange={(e) => void act(() => agentsApi.update(agent.id, { tierId: e.target.value || null }), "Tier updated")}
                >
                  <option value="">— unassigned —</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <div className="text-[12.5px] font-medium text-[var(--foreground)]">{agent.tier?.name || "—"}</div>
              )}
            </div>
          </div>
        </Surface>

        <Surface>
          <SurfaceHeader title="KYC & Onboarding" hint="Verification does not itself activate the agent — approval is a separate step." />
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className={labelCls}>KYC status</div>
                <Pill value={agent.kycStatus || "pending"} tone={statusTone(agent.kycStatus || "pending")} />
              </div>
              <Field label="Applied" value={agent.appliedAt ? new Date(agent.appliedAt).toLocaleString() : "—"} />
              <Field label="Approved" value={agent.approvedAt ? new Date(agent.approvedAt).toLocaleString() : "—"} />
            </div>
            {agent.rejectedReason && <Field label="Rejection reason" value={agent.rejectedReason} />}
            <Can perm="agent:manage">
              <div className="grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls} htmlFor="kyc-status">Review KYC</label>
                  <select id="kyc-status" className={selectClassName} value={kyc.kycStatus} onChange={(e) => setKyc({ ...kyc, kycStatus: e.target.value })}>
                    <option value="pending">pending</option>
                    <option value="verified">verified</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="kyc-notes">Notes</label>
                  <input id="kyc-notes" className={inputCls} value={kyc.kycNotes} onChange={(e) => setKyc({ ...kyc, kycNotes: e.target.value })} />
                </div>
                <div>
                  <button type="button" disabled={busy} className={btnPrimary} style={btnPrimaryStyle} onClick={() => void act(() => agentsApi.reviewKyc(agent.id, kyc), "KYC updated")}>
                    <ShieldCheck size={13} /> Save KYC
                  </button>
                </div>
              </div>
            </Can>
          </div>
        </Surface>
      </div>

      <AgentDocumentsCard agentId={agent.id} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Identity & Business" />
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
            <Field label="Passport No" value={agent.passportNo} />
            <Field label="Date of Birth" value={agent.dob ? new Date(agent.dob).toLocaleDateString() : "—"} />
            <Field label="Gender" value={agent.gender} />
            <Field label="Nationality" value={agent.nationality} />
            <Field label="Business Type" value={agent.businessType} />
            <Field label="Business Start" value={agent.businessStartDate ? new Date(agent.businessStartDate).toLocaleDateString() : "—"} />
            <Field label="Years Experience" value={agent.yearsExperience != null ? String(agent.yearsExperience) : "—"} />
            <Field label="Website" value={agent.website} />
            <Field label="Facebook" value={agent.facebookPage} />
            <Field label="Google Business" value={agent.googleBusiness} />
          </div>
        </Surface>
        <Surface>
          <SurfaceHeader title="Office & Bank" />
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
            <Field label="Office Address" value={agent.officeAddress} />
            <Field label="City" value={agent.city} />
            <Field label="District" value={agent.district} />
            <Field label="Country" value={agent.country} />
            <Field label="Postal Code" value={agent.postalCode} />
            <Field label="Map" value={agent.googleMapLocation} />
            <Field label="Bank" value={agent.bankName} />
            <Field label="Branch" value={agent.bankBranch} />
            <Field label="Account Name" value={agent.bankAccountName} />
            <Field label="Account No" value={agent.bankAccountNumber} />
            <Field label="Routing" value={agent.bankRoutingNumber} />
            <Field label="bKash" value={agent.bkash} />
            <Field label="Nagad" value={agent.nagad} />
            <Field label="Rocket" value={agent.rocket} />
            <Field label="Upay" value={agent.upay} />
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Surface>
          <SurfaceHeader title="Emergency & Wallet" />
          <div className="grid grid-cols-2 gap-4 p-4 sm:p-5">
            <Field label="Emergency Name" value={agent.emergencyName} />
            <Field label="Relationship" value={agent.emergencyRelationship} />
            <Field label="Emergency Phone" value={agent.emergencyPhone} />
            <Field
              label="Opening Balance"
              value={agent.openingBalanceType && agent.openingBalanceType !== "none"
                ? `${agent.openingBalanceType} ${((agent.openingBalance || 0) / 100).toLocaleString()} ${agent.currency || "BDT"}`
                : "—"}
            />
            <Field label="Commission" value={`${((agent.commissionRateBps ?? 0) / 100).toFixed(2)}%`} />
            <Field label="Reviewed" value={agent.reviewedAt ? new Date(agent.reviewedAt).toLocaleString() : "—"} />
          </div>
        </Surface>
        {agent.internalNotes && (
          <Surface>
            <SurfaceHeader title="Internal Notes" hint="Staff only." />
            <div className="whitespace-pre-wrap p-4 text-[12px] text-[var(--foreground)] sm:p-5">{agent.internalNotes}</div>
          </Surface>
        )}
      </div>

      <AgentContextCards agentId={agent.id} />

      {status === "active" && <AgentWalletCard agentId={agent.id} />}

      <Surface>
        <SurfaceHeader title="Onboarding timeline" hint="Audit trail (reused AuditLog)." />
        <ul className="divide-y divide-[var(--border)]">
          {trail.length === 0 ? (
            <li className="p-4 text-[12px] text-[var(--muted-foreground)]">No recorded events yet.</li>
          ) : (
            trail.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[11.5px]">
                <span className="flex items-center gap-2">
                  <BadgeCheck size={13} className="text-[var(--accent)]" />
                  <span className="font-semibold text-[var(--foreground)]">{e.action}</span>
                </span>
                <span className="text-[10.5px] text-[var(--muted-foreground)]">{new Date(e.createdAt).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </Surface>
    </PageShell>
  );
}
