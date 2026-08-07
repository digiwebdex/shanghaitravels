import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Handshake, Plus, RefreshCw } from "lucide-react";
import { agentsApi, type Agent } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import { Can } from "@/auth/Can";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
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

const STATUS_FILTERS = ["", "pending", "active", "suspended", "rejected"] as const;
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

export default function AgentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Agent[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormShape>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

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

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
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
      const created = await agentsApi.create({
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
        onboarding: form.asApplicant,
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      // Continue onboarding on the profile (documents, KYC, approval).
      navigate(`/partners/agents/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<Agent>[] = [
    { key: "code", header: "Code", className: "font-mono font-semibold", render: (r) => r.code },
    {
      key: "name",
      header: "Name",
      render: (r) => (
        <Link to={`/partners/agents/${r.id}`} className="font-semibold text-[var(--accent)] hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "company", header: "Company", render: (r) => r.companyName || "—" },
    { key: "tier", header: "Tier", render: (r) => r.tier?.name || "—" },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "rate", header: "Commission", className: "tabular-nums", render: (r) => `${((r.commissionRateBps ?? 0) / 100).toFixed(2)}%` },
    { key: "wallet", header: "Wallet", className: "text-right tabular-nums", render: (r) => fmtBDTPlain(r.walletBalance ?? 0) },
    { key: "status", header: "Status", render: (r) => <Pill value={r.status || "active"} tone={statusTone(r.status || "active")} /> },
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
              <button type="button" className={btnPrimary} style={btnPrimaryStyle} onClick={() => setShowForm((s) => !s)}>
                <Plus size={13} /> Onboard agent
              </button>
            </Can>
          </>
        }
      />
      <PartnerModuleNav />
      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      {showForm && (
        <Can perm="agent:manage">
          <form onSubmit={(e) => void create(e)} className="space-y-4">
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
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--foreground)] sm:col-span-2">
                <input type="checkbox" checked={form.asApplicant} onChange={(e) => setForm({ ...form, asApplicant: e.target.checked })} />
                Register as onboarding applicant (pending approval)
              </label>
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
                  {form.asApplicant ? "Submit application" : "Create active agent"}
                </button>
              </Can>
              <button type="button" className={btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </Can>
      )}

      <Surface>
        <SurfaceHeader
          title={`${rows.length} agent${rows.length === 1 ? "" : "s"}`}
          action={
            <div className="flex items-center gap-2">
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
        />
      </Surface>
    </PageShell>
  );
}
