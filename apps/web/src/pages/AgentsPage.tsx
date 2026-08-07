import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, FileSpreadsheet, FileText, Handshake, Pencil, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { agentsApi, type Agent } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { useAuth } from "@/auth/AuthProvider";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AgentDetailPage from "@/pages/AgentDetailPage";
import { downloadBlob } from "@/lib/statements";
import { ERP } from "@/config/env";
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
import { fmtBDTPlain } from "@/lib/money";

const STATUS_FILTERS = ["", "pending", "active", "suspended", "rejected", "inactive"] as const;
const BUSINESS_TYPES = ["", "Individual", "Proprietorship", "Partnership", "Limited Company", "Corporate", "Freelance Agent"];
const GENDERS = ["", "male", "female", "other"];
const OPENING_TYPES = ["none", "debit", "credit"];
const DOCUMENT_SLOTS = [
  "Agent Photo", "Trade License", "NID Front", "NID Back", "Passport Copy",
  "TIN Certificate", "Office Photo", "Business Card", "Other Documents",
];

const EMPTY_FORM = {
  // Section 1 — basic
  name: "", ownerName: "", companyName: "", contactPerson: "", phone: "", email: "", address: "",
  // Section 2 — identity
  tradeLicenseNo: "", nationalId: "", passportNo: "", dob: "", gender: "", nationality: "",
  // Section 4 — business
  businessType: "", businessStartDate: "", yearsExperience: "", website: "", facebookPage: "", googleBusiness: "",
  // Section 5 — office
  officeAddress: "", city: "", district: "", country: "", postalCode: "", googleMapLocation: "",
  // Section 6 — bank & payment
  bankName: "", bankBranch: "", bankAccountName: "", bankAccountNumber: "", bankRoutingNumber: "",
  bkash: "", nagad: "", rocket: "", upay: "",
  // Section 7 — commission
  commissionRateBps: "250",
  // Section 8 — wallet
  openingBalanceType: "none", openingBalance: "", currency: "BDT",
  // Section 11 — emergency
  emergencyName: "", emergencyRelationship: "", emergencyPhone: "",
  // Section 12 — notes
  internalNotes: "",
  // control
  tierId: "", asApplicant: true,
};
type FormShape = typeof EMPTY_FORM;

type BadgeTone = "slate" | "green" | "amber" | "red" | "blue";

/** Up to two initials from the agent name — avatar fallback. */
function initialsOf(name?: string | null): string {
  const parts = (name || "").split(/\s+/).filter(Boolean);
  const ini = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  return ini || "?";
}

/** Circular avatar — uploaded photo (reused Document store) with initials fallback. */
function AgentAvatar({ a }: { a: Agent }) {
  const [failed, setFailed] = useState(false);
  if (a.hasPhoto && !failed) {
    return (
      <img
        src={`${ERP}/agents/${a.id}/documents/avatar`}
        alt=""
        onError={() => setFailed(true)}
        className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
      />
    );
  }
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--navy-50)] text-[10px] font-bold text-[var(--foreground)]"
      title={a.name}
    >
      {initialsOf(a.name)}
    </span>
  );
}

/** Quick descriptor badges under the agent name (derived, no new fields). */
function agentBadges(a: Agent): { label: string; tone: BadgeTone }[] {
  const out: { label: string; tone: BadgeTone }[] = [];
  if (a.businessType === "Corporate") out.push({ label: "Corporate", tone: "blue" });
  else if (a.businessType === "Individual") out.push({ label: "Individual", tone: "slate" });
  if (a.parentAgentId) out.push({ label: "Sub Agent", tone: "slate" });
  if (a.status === "inactive") out.push({ label: "Inactive", tone: "slate" });
  if (a.kycStatus === "verified") out.push({ label: "Verified", tone: "green" });
  else if (a.kycStatus === "pending") out.push({ label: "KYC Pending", tone: "amber" });
  return out;
}

/** Coarse "time ago" for the Last Activity column (reused AuditLog timestamp). */
function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo === 1 ? "" : "s"} ago`;
  return `${Math.floor(d / 365)} year${Math.floor(d / 365) === 1 ? "" : "s"} ago`;
}

export default function AgentsPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [rows, setRows] = useState<Agent[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Agent | null>(null);
  // Polish: row selection (keyboard target), and the right-side View drawer.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const scrollPosRef = useRef(0);
  // Final polish: multi-select for bulk actions.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState<null | "deactivate" | "restore">(null);

  const selectedAgent = rows.find((r) => r.id === selectedKey) || null;
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && rows.some((r) => selectedIds.has(r.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  async function runBulk(action: "deactivate" | "restore") {
    const targets = rows.filter((r) => selectedIds.has(r.id));
    setBusy(true); setError(""); setOk("");
    let done = 0, skipped = 0;
    try {
      for (const a of targets) {
        if (action === "deactivate") {
          if (a.status === "inactive" || a.canDeactivate === false) { skipped++; continue; }
          try { await agentsApi.remove(a.id); done++; } catch { skipped++; }
        } else {
          if (a.status !== "inactive") { skipped++; continue; }
          try { await agentsApi.restore(a.id); done++; } catch { skipped++; }
        }
      }
      setOk(`${action === "deactivate" ? "Deactivated" : "Restored"} ${done} agent${done === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`);
      setSelectedIds(new Set());
      setBulkConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Bulk action failed");
    } finally {
      setBusy(false);
    }
  }

  function openView(a: Agent) {
    setSelectedKey(a.id);
    setViewId(a.id);
  }

  /** Human reason a soft-delete is blocked (mirrors the backend guard). */
  function deactivateReason(r: Agent): string {
    const b = r.blockers || {};
    const parts = [
      b.outstandingCommission && "outstanding commission",
      b.pendingWithdrawal && "a pending wallet withdrawal",
      b.pendingBookings && "pending bookings",
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(", ") : "unresolved obligations";
  }

  function exportPdf(a: Agent | null) {
    if (!a) return;
    window.open(`${ERP}/agents/${a.id}/pdf`, "_blank", "noopener");
  }

  function exportExcel(a: Agent | null) {
    if (!a) return;
    const pairs: [string, string][] = [
      ["Code", a.code], ["Name", a.name], ["Owner / Proprietor", a.ownerName || ""],
      ["Company", a.companyName || ""], ["Contact Person", a.contactPerson || ""],
      ["Phone", a.phone || ""], ["Email", a.email || ""],
      ["Status", a.status || ""], ["Tier", a.tier?.name || ""],
      ["Trade License", a.tradeLicenseNo || ""], ["National ID", a.nationalId || ""], ["Passport", a.passportNo || ""],
      ["Business Type", a.businessType || ""],
      ["Commission %", ((a.commissionRateBps ?? 0) / 100).toFixed(2)],
      ["Wallet (BDT)", ((a.walletBalance ?? 0) / 100).toFixed(2)],
      ["City", a.city || ""], ["District", a.district || ""], ["Country", a.country || ""],
      ["Bank", a.bankName || ""], ["Bank Branch", a.bankBranch || ""], ["Account No", a.bankAccountNumber || ""],
      ["bKash", a.bkash || ""], ["Nagad", a.nagad || ""],
      ["KYC", a.kycStatus || ""],
      ["Emergency", [a.emergencyName, a.emergencyPhone].filter(Boolean).join(" — ")],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = "\uFEFF" + [["Field", "Value"] as [string, string], ...pairs].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(`${a.code}.csv`, csv, "text/csv;charset=utf-8");
  }

  /** Bulk export \u2014 one columnar row per selected agent (reuses downloadBlob). */
  function exportBulkExcel(agents: Agent[]) {
    if (!agents.length) return;
    const cols: [string, (a: Agent) => string][] = [
      ["Code", (a) => a.code], ["Name", (a) => a.name], ["Owner", (a) => a.ownerName || ""],
      ["Company", (a) => a.companyName || ""], ["Phone", (a) => a.phone || ""], ["Email", (a) => a.email || ""],
      ["Status", (a) => a.status || ""], ["Tier", (a) => a.tier?.name || ""],
      ["Business Type", (a) => a.businessType || ""],
      ["Commission %", (a) => ((a.commissionRateBps ?? 0) / 100).toFixed(2)],
      ["Wallet (BDT)", (a) => ((a.walletBalance ?? 0) / 100).toFixed(2)],
      ["KYC", (a) => a.kycStatus || ""], ["City", (a) => a.city || ""], ["Country", (a) => a.country || ""],
    ];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const header = cols.map((c) => c[0]);
    const body = agents.map((a) => cols.map((c) => c[1](a)));
    const csv = "\uFEFF" + [header, ...body].map((r) => r.map(esc).join(",")).join("\r\n");
    downloadBlob(`agents-${agents.length}.csv`, csv, "text/csv;charset=utf-8");
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await agentsApi.list({ q: q.trim() || undefined, status: status || undefined, limit: 100 });
      setRows(listOf<Agent>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  // Keyboard shortcuts on the selected row: Enter → View, Ctrl/⌘+E → Edit, Delete → Deactivate.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedKey || showForm || viewId || confirm) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const r = rows.find((x) => x.id === selectedKey);
      if (!r) return;
      const inactive = r.status === "inactive";
      if (e.key === "Enter") {
        e.preventDefault();
        openView(r);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "e" || e.key === "E")) {
        if (!inactive && can("agent:manage")) {
          e.preventDefault();
          void startEdit(r);
        }
      } else if (e.key === "Delete") {
        if (!inactive && can("agent:manage") && r.canDeactivate !== false) {
          e.preventDefault();
          setConfirm(r);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, rows, showForm, viewId, confirm, can]);

  // Render helpers (functions, not components, to keep input focus stable).
  const setK = (k: keyof FormShape) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const val = (k: keyof FormShape) => String(form[k] ?? "");
  function txt(k: keyof FormShape, label: string, opts: { type?: string; req?: boolean; full?: boolean; ph?: string } = {}): ReactNode {
    return (
      <div className={opts.full ? "sm:col-span-2" : ""}>
        <label className={labelCls}>{label}{opts.req ? " *" : ""}</label>
        <input className={inputCls} type={opts.type || "text"} value={val(k)} onChange={setK(k)} placeholder={opts.ph} required={opts.req} />
      </div>
    );
  }
  function sel(k: keyof FormShape, label: string, options: string[], labels?: Record<string, string>): ReactNode {
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <select className={selectClassName} value={val(k)} onChange={setK(k)}>
          {options.map((o) => (
            <option key={o || "any"} value={o}>{labels?.[o] ?? (o || "— select —")}</option>
          ))}
        </select>
      </div>
    );
  }

  // Map an existing agent → editable form values (dates → yyyy-mm-dd, poisha → ৳).
  function agentToForm(a: Agent): FormShape {
    const d = (v?: string | null) => (v ? String(v).slice(0, 10) : "");
    const g = (v?: string | null) => v || "";
    return {
      name: g(a.name), ownerName: g(a.ownerName), companyName: g(a.companyName), contactPerson: g(a.contactPerson),
      phone: g(a.phone), email: g(a.email), address: g(a.address),
      tradeLicenseNo: g(a.tradeLicenseNo), nationalId: g(a.nationalId), passportNo: g(a.passportNo),
      dob: d(a.dob), gender: g(a.gender), nationality: g(a.nationality),
      businessType: g(a.businessType), businessStartDate: d(a.businessStartDate),
      yearsExperience: a.yearsExperience != null ? String(a.yearsExperience) : "",
      website: g(a.website), facebookPage: g(a.facebookPage), googleBusiness: g(a.googleBusiness),
      officeAddress: g(a.officeAddress), city: g(a.city), district: g(a.district), country: g(a.country),
      postalCode: g(a.postalCode), googleMapLocation: g(a.googleMapLocation),
      bankName: g(a.bankName), bankBranch: g(a.bankBranch), bankAccountName: g(a.bankAccountName),
      bankAccountNumber: g(a.bankAccountNumber), bankRoutingNumber: g(a.bankRoutingNumber),
      bkash: g(a.bkash), nagad: g(a.nagad), rocket: g(a.rocket), upay: g(a.upay),
      commissionRateBps: String(a.commissionRateBps ?? 250),
      openingBalanceType: g(a.openingBalanceType) || "none",
      openingBalance: a.openingBalance != null ? String((a.openingBalance || 0) / 100) : "",
      currency: g(a.currency) || "BDT",
      emergencyName: g(a.emergencyName), emergencyRelationship: g(a.emergencyRelationship), emergencyPhone: g(a.emergencyPhone),
      internalNotes: g(a.internalNotes),
      tierId: a.tierId || "", asApplicant: false,
    };
  }
  function openCreate() {
    setError(""); setOk(""); setEditingId(null); setForm(EMPTY_FORM); setShowForm(true);
  }
  async function startEdit(a: Agent) {
    setError(""); setOk("");
    scrollPosRef.current = window.scrollY; // preserve position for after the edit
    try {
      const full = await agentsApi.get(a.id); // reuse existing detail API for pre-fill
      setForm(agentToForm(full));
      setEditingId(a.id);
      setShowForm(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load agent");
    }
  }
  async function doRemove(a: Agent) {
    setBusy(true); setError("");
    try { await agentsApi.remove(a.id); setOk(`${a.name} deactivated`); setConfirm(null); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Deactivate failed"); }
    finally { setBusy(false); }
  }
  async function doRestore(a: Agent) {
    setBusy(true); setError("");
    try { await agentsApi.restore(a.id); setOk(`${a.name} restored`); await load(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Restore failed"); }
    finally { setBusy(false); }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(""); setOk("");
    // Required (mirrors the backend guard): Owner, Name, Phone, Email, Address, Commission, TradeLicense OR NID.
    const required: [keyof FormShape, string][] = [
      ["name", "Agent name"], ["ownerName", "Owner / proprietor name"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"],
    ];
    for (const [k, label] of required) if (!val(k).trim()) return setError(`${label} is required`);
    if (!val("tradeLicenseNo").trim() && !val("nationalId").trim()) return setError("Trade License Number or National ID is required");
    if (!(Number(form.commissionRateBps) >= 0)) return setError("Commission (bps) must be a number");

    setBusy(true);
    try {
      const s = (k: keyof FormShape) => val(k).trim() || undefined;
      const payload = {
        name: val("name").trim(), ownerName: val("ownerName").trim(),
        companyName: s("companyName"), contactPerson: s("contactPerson"),
        phone: s("phone"), email: s("email"), address: s("address"),
        tradeLicenseNo: s("tradeLicenseNo"), nationalId: s("nationalId"), passportNo: s("passportNo"),
        dob: s("dob"), gender: s("gender"), nationality: s("nationality"),
        businessType: s("businessType"), businessStartDate: s("businessStartDate"),
        yearsExperience: val("yearsExperience") ? Math.round(Number(form.yearsExperience)) : undefined,
        website: s("website"), facebookPage: s("facebookPage"), googleBusiness: s("googleBusiness"),
        officeAddress: s("officeAddress"), city: s("city"), district: s("district"), country: s("country"),
        postalCode: s("postalCode"), googleMapLocation: s("googleMapLocation"),
        bankName: s("bankName"), bankBranch: s("bankBranch"), bankAccountName: s("bankAccountName"),
        bankAccountNumber: s("bankAccountNumber"), bankRoutingNumber: s("bankRoutingNumber"),
        bkash: s("bkash"), nagad: s("nagad"), rocket: s("rocket"), upay: s("upay"),
        commissionRateBps: Math.round(Number(form.commissionRateBps) || 0),
        openingBalanceType: s("openingBalanceType"),
        openingBalance: val("openingBalance") ? Math.round(Number(form.openingBalance) * 100) : undefined,
        currency: s("currency"),
        emergencyName: s("emergencyName"), emergencyRelationship: s("emergencyRelationship"), emergencyPhone: s("emergencyPhone"),
        internalNotes: s("internalNotes"),
        tierId: form.tierId || undefined,
      };
      if (editingId) {
        await agentsApi.update(editingId, payload); // reuse existing update API; immutable fields untouched
        setForm(EMPTY_FORM); setShowForm(false); setEditingId(null);
        setOk("Agent updated");
        await load(); // search / status filter stay in state — nothing is reset
        requestAnimationFrame(() => window.scrollTo(0, scrollPosRef.current)); // restore scroll position
      } else {
        const created = await agentsApi.create({ ...payload, onboarding: form.asApplicant });
        setForm(EMPTY_FORM); setShowForm(false);
        navigate(`/partners/agents/${created.id}`); // continue onboarding (documents, KYC, approval)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : editingId ? "Update failed" : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Agent>[] = [
    {
      key: "select",
      className: "w-8",
      header: (
        <input
          type="checkbox"
          aria-label="Select all agents"
          className="cursor-pointer"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected; }}
          onChange={toggleAll}
        />
      ),
      render: (r) => (
        <input
          type="checkbox"
          aria-label={`Select ${r.name}`}
          className="cursor-pointer"
          checked={selectedIds.has(r.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleOne(r.id)}
        />
      ),
    },
    { key: "avatar", header: "", className: "w-10", render: (r) => <AgentAvatar a={r} /> },
    { key: "code", header: "Code", className: "font-mono font-semibold", render: (r) => r.code },
    {
      key: "name",
      header: "Name",
      render: (r) => {
        const badges = agentBadges(r);
        return (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => openView(r)}
              className="text-left font-semibold text-[var(--accent)] hover:underline"
            >
              {r.name}
            </button>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {badges.map((b) => <Pill key={b.label} value={b.label} tone={b.tone} />)}
              </div>
            )}
          </div>
        );
      },
    },
    { key: "company", header: "Company", render: (r) => r.companyName || "—" },
    { key: "tier", header: "Tier", render: (r) => r.tier?.name || "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "rate", header: "Commission", className: "tabular-nums", render: (r) => `${((r.commissionRateBps ?? 0) / 100).toFixed(2)}%` },
    {
      key: "wallet",
      header: "Wallet",
      className: "text-right tabular-nums",
      render: (r) => {
        const w = r.walletBalance ?? 0;
        const tone = w > 0 ? "text-emerald-600" : w < 0 ? "text-red-600" : "text-[var(--muted-foreground)]";
        return <span className={`font-semibold ${tone}`}>{fmtBDTPlain(w)}</span>;
      },
    },
    {
      key: "activity",
      header: "Last Activity",
      render: (r) => (
        <span className="text-[11px] text-[var(--muted-foreground)]" title={r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleString() : "No recorded activity"}>
          {relativeTime(r.lastActivityAt)}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status || "active"} tone={statusTone(r.status || "active")} /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => {
        const inactive = r.status === "inactive";
        const blocked = r.canDeactivate === false;
        return (
          <div className="flex items-center justify-end gap-1">
            <Can perm="commission:read">
              <button type="button" className={`${btnGhost} px-2 py-1`} title="View" aria-label="View" onClick={() => openView(r)}>
                <Eye size={13} />
              </button>
            </Can>
            {!inactive && (
              <Can perm="agent:manage">
                <button type="button" className={`${btnGhost} px-2 py-1`} title="Edit" aria-label="Edit" onClick={() => void startEdit(r)}>
                  <Pencil size={13} />
                </button>
              </Can>
            )}
            <Can perm="agent:manage">
              {inactive ? (
                <button type="button" className={`${btnGhost} px-2 py-1`} title="Restore" aria-label="Restore" disabled={busy} onClick={() => void doRestore(r)}>
                  <RotateCcw size={13} />
                </button>
              ) : blocked ? (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
                  title={`Cannot deactivate — ${deactivateReason(r)}. Resolve these first.`}
                  aria-label={`Cannot deactivate: ${deactivateReason(r)}`}
                >
                  <Trash2 size={12} className="opacity-40" /> Cannot deactivate
                </span>
              ) : (
                <button type="button" className={`${btnGhost} px-2 py-1 text-red-600`} title="Deactivate" aria-label="Deactivate" disabled={busy} onClick={() => setConfirm(r)}>
                  <Trash2 size={13} />
                </button>
              )}
            </Can>
          </div>
        );
      },
    },
  ];

  const section = (title: string, hint: string, children: ReactNode) => (
    <Surface>
      <SurfaceHeader title={title} hint={hint} />
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">{children}</div>
    </Surface>
  );

  return (
    <PageShell wide>
      <PageHeader
        icon={Handshake}
        title="Agents"
        subtitle="B2B agents & onboarding. Viewing requires commission:read; onboarding & approval require agent:manage."
        breadcrumb={[{ label: "Business Partners", to: "/partners/suppliers" }, { label: "Agents" }]}
        actions={
          <>
            <button type="button" className={btnGhost} onClick={() => void load()}>
              <RefreshCw size={12} /> Refresh
            </button>
            <Can perm="agent:manage">
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={openCreate}>
                <Plus size={13} /> Onboard agent
              </button>
            </Can>
          </>
        }
      />
      <PartnerModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {bulkConfirm && (
        <Can perm="agent:manage">
          <Surface>
            <div className="p-4 sm:p-5">
              <p className="text-[13px] font-bold text-[var(--primary)]">
                {bulkConfirm === "deactivate" ? "Deactivate" : "Restore"} {selectedIds.size} agent{selectedIds.size === 1 ? "" : "s"}?
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                {bulkConfirm === "deactivate"
                  ? "Agents that are already inactive or have unresolved obligations (outstanding commission, pending withdrawal or bookings) are skipped."
                  : "Only inactive agents are restored; others are skipped."}
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setBulkConfirm(null)}>Cancel</button>
                <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void runBulk(bulkConfirm)}>
                  {bulkConfirm === "deactivate" ? "Deactivate selected" : "Restore selected"}
                </button>
              </div>
            </div>
          </Surface>
        </Can>
      )}

      {selectedIds.size > 0 && (
        <Surface>
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
            <span className="text-[12px] font-bold text-[var(--foreground)]">{selectedIds.size} selected</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">Bulk actions:</span>
            <button type="button" className={btnGhost} onClick={() => exportBulkExcel(rows.filter((r) => selectedIds.has(r.id)))}>
              <FileSpreadsheet size={12} /> Export
            </button>
            <Can perm="agent:manage">
              <button type="button" className={btnGhost} disabled={busy} onClick={() => setBulkConfirm("deactivate")}>
                <Trash2 size={12} /> Deactivate
              </button>
              <button type="button" className={btnGhost} disabled={busy} onClick={() => setBulkConfirm("restore")}>
                <RotateCcw size={12} /> Restore
              </button>
            </Can>
            <button type="button" className={`${btnGhost} ml-auto`} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </Surface>
      )}

      {confirm && (
        <Can perm="agent:manage">
          <Surface>
            <div className="p-4 sm:p-5">
              <p className="text-[13px] font-bold text-[var(--primary)]">Delete Agent?</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                This action will deactivate <span className="font-semibold">{confirm.name}</span>. Existing bookings, customers, commission and wallet history will remain.
              </p>
              <div className="mt-3 flex gap-2">
                <button type="button" className={btnGhost} onClick={() => setConfirm(null)}>Cancel</button>
                <button type="button" className={btnPrimary} style={btnPrimaryStyle} disabled={busy} onClick={() => void doRemove(confirm)}>Deactivate</button>
              </div>
            </div>
          </Surface>
        </Can>
      )}

      {showForm && (
        <Can perm="agent:manage">
          <form onSubmit={(e) => void save(e)} className="space-y-4">
            <Surface>
              <SurfaceHeader
                title={editingId ? "Edit agent" : "Onboard agent"}
                hint={editingId ? "Editing an existing agent. Agent code, created date/by, ledgers and audit history are immutable." : "New commercial agent onboarding. Owner name required."}
              />
            </Surface>
            {section("1 · Basic Information", "Owner name is required. Applicants start pending and require approval.", (
              <>
                {txt("name", "Agent Name", { req: true })}
                {txt("ownerName", "Owner / Proprietor Name", { req: true })}
                {txt("companyName", "Company / Agency Name")}
                {txt("contactPerson", "Contact Person (if different from owner)")}
                {txt("phone", "Phone", { req: true })}
                {txt("email", "Email", { req: true, type: "email" })}
                {txt("address", "Address", { req: true, full: true })}
              </>
            ))}

            {section("2 · Identity", "Provide Trade License Number OR National ID (at least one required).", (
              <>
                {txt("tradeLicenseNo", "Trade License Number")}
                {txt("nationalId", "National ID Number")}
                {txt("passportNo", "Passport Number (optional)")}
                {txt("dob", "Date of Birth", { type: "date" })}
                {sel("gender", "Gender", GENDERS)}
                {txt("nationality", "Nationality")}
              </>
            ))}

            {section("3 · Images & Documents", "Uploaded on the agent's profile after saving — every upload appears in Document Intelligence.", (
              <div className="sm:col-span-2 space-y-2">
                <p className="text-[11.5px] text-[var(--muted-foreground)]">
                  After you save, the agent profile shows upload cards for each document (reusing the existing scan/upload system):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DOCUMENT_SLOTS.map((d) => (
                    <span key={d} className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--muted-foreground)]">{d}</span>
                  ))}
                </div>
              </div>
            ))}

            {section("4 · Business Information", "", (
              <>
                {sel("businessType", "Business Type", BUSINESS_TYPES)}
                {txt("businessStartDate", "Business Start Date", { type: "date" })}
                {txt("yearsExperience", "Years of Experience", { type: "number" })}
                {txt("website", "Website")}
                {txt("facebookPage", "Facebook Page")}
                {txt("googleBusiness", "Google Business")}
              </>
            ))}

            {section("5 · Office Information", "", (
              <>
                {txt("officeAddress", "Office Address", { full: true })}
                {txt("city", "City")}
                {txt("district", "District")}
                {txt("country", "Country")}
                {txt("postalCode", "Postal Code")}
                {txt("googleMapLocation", "Google Map Location")}
              </>
            ))}

            {section("6 · Bank & Payment", "", (
              <>
                {txt("bankName", "Bank Name")}
                {txt("bankBranch", "Branch")}
                {txt("bankAccountName", "Account Name")}
                {txt("bankAccountNumber", "Account Number")}
                {txt("bankRoutingNumber", "Routing Number")}
                {txt("bkash", "bKash")}
                {txt("nagad", "Nagad")}
                {txt("rocket", "Rocket")}
                {txt("upay", "Upay")}
              </>
            ))}

            {section("7 · Commission", "Commission rate in basis points.", (
              <>
                {txt("commissionRateBps", "Commission (BPS)", { type: "number" })}
                <div>
                  <div className={labelCls}>Reference</div>
                  <div className="rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] tabular-nums text-[var(--muted-foreground)]">
                    250 = 2.5% · 500 = 5% · 750 = 7.5% · 1000 = 10%
                  </div>
                </div>
              </>
            ))}

            {section("8 · Wallet", "Optional opening balance (in ৳).", (
              <>
                {sel("openingBalanceType", "Opening Balance Type", OPENING_TYPES)}
                {txt("openingBalance", "Opening Balance (৳)", { type: "number" })}
                {txt("currency", "Currency")}
              </>
            ))}

            {section("9 · Status", "Status follows the onboarding workflow: Save → KYC Pending → Approval → Active.", (
              editingId ? (
                <div className="sm:col-span-2 text-[11.5px] text-[var(--muted-foreground)]">
                  Status is managed via the profile lifecycle actions (Approve / Suspend / Reinstate) — not editable here.
                </div>
              ) : (
                <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--foreground)] sm:col-span-2">
                  <input type="checkbox" checked={form.asApplicant} onChange={(e) => setForm({ ...form, asApplicant: e.target.checked })} />
                  Register as onboarding applicant (pending approval)
                </label>
              )
            ))}

            {section("10 · KYC", "KYC is reviewed on the agent's profile after saving (verify → approve).", (
              <div className="sm:col-span-2 text-[11.5px] text-[var(--muted-foreground)]">
                Reviewer, review date and notes are captured during KYC review on the profile page.
              </div>
            ))}

            {section("11 · Emergency Contact", "", (
              <>
                {txt("emergencyName", "Emergency Contact Name")}
                {txt("emergencyRelationship", "Relationship")}
                {txt("emergencyPhone", "Phone")}
              </>
            ))}

            {section("12 · Notes", "Visible only to staff.", (
              <div className="sm:col-span-2">
                <label className={labelCls}>Internal Notes</label>
                <textarea className={inputCls} rows={3} value={val("internalNotes")} onChange={setK("internalNotes")} />
              </div>
            ))}

            <div className="flex gap-2">
              <Can perm="agent:manage">
                <button type="submit" disabled={busy} className={btnPrimary} style={btnPrimaryStyle}>
                  {editingId ? "Save changes" : form.asApplicant ? "Submit application" : "Create active agent"}
                </button>
              </Can>
              <button type="button" className={btnGhost} onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </Can>
      )}

      <Surface>
        <SurfaceHeader
          title={`${rows.length} agent${rows.length === 1 ? "" : "s"}`}
          hint={selectedAgent ? `Selected: ${selectedAgent.name} — Enter to view, Ctrl+E to edit, Del to deactivate.` : "Click a row to select it, then use the export or keyboard shortcuts."}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={btnGhost}
                disabled={!selectedAgent}
                title={selectedAgent ? `Export ${selectedAgent.name} as PDF` : "Select an agent row first"}
                onClick={() => exportPdf(selectedAgent)}
              >
                <FileText size={12} /> PDF
              </button>
              <button
                type="button"
                className={btnGhost}
                disabled={!selectedAgent}
                title={selectedAgent ? `Export ${selectedAgent.name} as Excel` : "Select an agent row first"}
                onClick={() => exportExcel(selectedAgent)}
              >
                <FileSpreadsheet size={12} /> Excel
              </button>
              <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                {STATUS_FILTERS.map((s) => (
                  <option key={s || "all"} value={s}>{s ? s : "All statuses"}</option>
                ))}
              </select>
              <input
                className="w-44 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11.5px] sm:w-60"
                placeholder="Search agents…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void load()}
                aria-label="Search agents"
              />
            </div>
          }
        />
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          emptyTitle="No agents"
          emptyHint="Onboard an agent or check commission:read permission."
          selectedKey={selectedKey}
          onRowClick={(r) => setSelectedKey(r.id)}
          onRowDoubleClick={(r) => openView(r)}
          rowClassName={(r) => (r.status === "inactive" ? "opacity-60" : "")}
        />
      </Surface>

      {/* View drawer — reuses the enterprise Sheet + full AgentDetailPage, no navigation away. */}
      <Sheet open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Agent profile</SheetTitle>
          </SheetHeader>
          {viewId && <AgentDetailPage agentId={viewId} embedded />}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
