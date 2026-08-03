import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { FileCheck, Plus, RefreshCw, Search } from "lucide-react";
import { applicationsApi, customersApi, destinationsApi } from "@/lib/services";
import { listOf, ApiError } from "@/lib/api";
import type { Application, Customer } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Column, DataTable, Pill, statusTone } from "@/components/enterprise/DataTable";
import {
  KpiCard,
  ListPageShell,
  ListToolbar,
  PageHeader,
  PageShell,
  StatStrip,
  Surface,
  btnGhost,
  btnPrimary,
  btnPrimaryStyle,
  inputCls,
  labelCls,
  searchInputClassName,
  selectClassName,
} from "@/components/enterprise/Page";
import { ErrorBanner } from "@/components/Feedback";
import {
  DEFAULT_VISA_DESTINATIONS,
  VISA_CATEGORY_OPTIONS,
  VISA_LETTER_BY_CATEGORY,
} from "@/config/checklist";
import { destinationCountry, type DestinationMaster } from "@/lib/destinations";
import { ScanDocumentPanel } from "@/components/ocr/ScanDocumentPanel";

export default function VisaListPage() {
  const [rows, setRows] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await applicationsApi.list({
        serviceType: "visa",
        limit: 100,
        q: q || undefined,
        status: status || undefined,
      });
      const data = listOf<Application>(r);
      setRows(data);
      setTotal(r && typeof r === "object" && "total" in r ? (r as { total: number }).total : data.length);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load visa cases");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const approved = rows.filter((r) => r.status === "approved" || r.status === "completed").length;
    const active = rows.filter((r) => r.status === "in_progress" || r.status === "submitted").length;
    const hold = rows.filter((r) => r.status === "on_hold" || r.status === "docs_required").length;
    return { approved, active, hold };
  }, [rows]);

  const columns: Column<Application>[] = [
    {
      key: "ref",
      header: "Reference",
      render: (a) => (
        <Link to={`/visa/${a.id}`} className="font-mono text-[11.5px] font-bold text-[var(--accent)] hover:underline">
          {a.referenceNo}
        </Link>
      ),
    },
    { key: "customer", header: "Customer", render: (a) => a.customer?.fullName || "—" },
    {
      key: "title",
      header: "Title",
      className: "max-w-[220px] truncate",
      render: (a) => <span className="text-[var(--muted-foreground)]">{a.title || "—"}</span>,
    },
    {
      key: "stage",
      header: "Stage",
      render: (a) => (
        <span className="tabular-nums">
          {a.currentStage}/{a.totalStages}
        </span>
      ),
    },
    { key: "priority", header: "Priority", render: (a) => a.priority },
    { key: "status", header: "Status", render: (a) => <Pill value={a.status} tone={statusTone(a.status)} /> },
  ];

  return (
    <ListPageShell
      lookupFilters
      wide
      icon={FileCheck}
      title="Visa Services"
      subtitle="China visa cases on the CVASC workflow."
      breadcrumb={[{ label: "Bookings", to: "/visa" }, { label: "Visa Services" }]}
      actions={
        <>
          <button type="button" className={btnGhost} onClick={() => void load()}>
            <RefreshCw size={12} /> Refresh
          </button>
          <Can perm="application:create">
            <Link to="/visa/new" className={btnPrimary} style={btnPrimaryStyle}>
              <Plus size={13} /> New Visa Case
            </Link>
          </Can>
        </>
      }
      stats={
        <StatStrip>
          <KpiCard label="Total cases" value={total} />
          <KpiCard label="In progress" value={stats.active} tone="accent" />
          <KpiCard label="Needs action" value={stats.hold} tone="warning" />
          <KpiCard label="Approved" value={stats.approved} tone="success" />
        </StatStrip>
      }
      toolbar={
        <ListToolbar>
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Search ref / customer…"
              className={searchInputClassName}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClassName}>
            <option value="">All statuses</option>
            {[
              "draft",
              "in_progress",
              "docs_required",
              "on_hold",
              "submitted",
              "approved",
              "rejected",
              "completed",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </ListToolbar>
      }
      error={error}
    >
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        emptyTitle="No visa cases yet"
        emptyHint="Create a China visa case to start the CVASC pipeline."
      />
    </ListPageShell>
  );
}

export function NewVisaCasePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetCustomer = params.get("customerId") || "";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [destinations, setDestinations] = useState<string[]>([...DEFAULT_VISA_DESTINATIONS]);
  const [customerId, setCustomerId] = useState(presetCustomer);
  const [destination, setDestination] = useState("China");
  const [visaCategory, setVisaCategory] = useState("tourist");
  const [visaLetter, setVisaLetter] = useState("L");
  const [priceBdt, setPriceBdt] = useState("");
  const [discountBdt, setDiscountBdt] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const letterOptions = VISA_LETTER_BY_CATEGORY[visaCategory] || VISA_LETTER_BY_CATEGORY.tourist;

  useEffect(() => {
    void customersApi
      .list({ limit: 200 })
      .then((r) => setCustomers(listOf<Customer>(r)))
      .catch(() => setCustomers([]));
    void destinationsApi
      .list({ limit: 200, status: "published" })
      .then((r) => {
        const rows = listOf<DestinationMaster>(r);
        const names = rows
          .map((d) => destinationCountry(d) || d.name)
          .map((n) => n.trim())
          .filter(Boolean);
        if (names.length) {
          const merged = Array.from(new Set([...DEFAULT_VISA_DESTINATIONS, ...names]));
          setDestinations(merged);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    const opts = VISA_LETTER_BY_CATEGORY[visaCategory] || VISA_LETTER_BY_CATEGORY.tourist;
    if (!opts.some((o) => o.value === visaLetter)) {
      setVisaLetter(opts[0]?.value || "L");
    }
  }, [visaCategory, visaLetter]);

  const selected = useMemo(() => customers.find((c) => c.id === customerId), [customers, customerId]);
  const categoryLabel =
    VISA_CATEGORY_OPTIONS.find((c) => c.value === visaCategory)?.label || visaCategory;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Pick a customer");
      return;
    }
    if (!destination.trim()) {
      setError("Pick a destination");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const caseTitle =
        `${destination.trim()} ${categoryLabel} ${visaLetter} — ${selected?.fullName || ""}`.trim();
      const noteLines = [
        `Visa type: ${visaLetter}`,
        priceBdt.trim() ? `Price: ৳${priceBdt.trim()}` : "",
        discountBdt.trim() ? `Discount: ৳${discountBdt.trim()}` : "",
        referredBy.trim() ? `Referred by: ${referredBy.trim()}` : "",
      ].filter(Boolean);

      const app = await applicationsApi.create({
        serviceType: "visa",
        customerId,
        title: caseTitle,
        priority,
        direction: "outbound",
        source: referredBy.trim() ? "referral" : "walkin",
      });
      await applicationsApi.putVisa(app.id, {
        visaType: visaCategory,
        destination: destination.trim(),
        entryType: "single",
        embassy: destination.trim().toLowerCase() === "china" ? "CVASC Dhaka" : undefined,
        notes: noteLines.join("\n") || undefined,
      });
      if (noteLines.length > 1) {
        void applicationsApi.note(app.id, noteLines.join(" · ")).catch(() => undefined);
      }
      navigate(`/visa/${app.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create case");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        icon={FileCheck}
        title="New Visa Case"
        subtitle="Creates an application and applies the active CVASC workflow template."
        breadcrumb={[
          { label: "Bookings", to: "/visa" },
          { label: "Visa Services", to: "/visa" },
          { label: "New" },
        ]}
      />
      <ErrorBanner message={error} />
      <Surface padded className="max-w-xl space-y-3">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Customer *</label>
            <select className={inputCls} required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">— select —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.code})
                </option>
              ))}
            </select>
            <Link to="/customers" className="mt-1 inline-block text-[11px] font-semibold text-[var(--accent)]">
              Create customer first →
            </Link>
            <div className="mt-2">
              <ScanDocumentPanel
                customerId={customerId || undefined}
                defaultDocType="passport"
                title="Scan passport for applicant"
                savePassportOnConfirm={!!customerId}
                onAutofill={() => {
                  /* Passport saved via panel when customer selected; case form has no traveler fields. */
                }}
              />
              {!customerId && (
                <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                  Select a customer first to save the scanned passport.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Destination *</label>
            <select
              className={inputCls}
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Visa category *</label>
            <select
              className={inputCls}
              required
              value={visaCategory}
              onChange={(e) => setVisaCategory(e.target.value)}
            >
              {VISA_CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Visa type *</label>
            <select
              className={inputCls}
              required
              value={visaLetter}
              onChange={(e) => setVisaLetter(e.target.value)}
            >
              {letterOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Price (BDT)</label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0"
                value={priceBdt}
                onChange={(e) => setPriceBdt(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>Discount (BDT)</label>
              <input
                className={inputCls}
                inputMode="decimal"
                placeholder="0"
                value={discountBdt}
                onChange={(e) => setDiscountBdt(e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Referred by</label>
            <input
              className={inputCls}
              placeholder="Agent / staff / partner name"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {["low", "medium", "high", "urgent"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className={btnPrimary} style={btnPrimaryStyle}>
              {loading ? "Creating…" : "Create case"}
            </button>
            <button type="button" onClick={() => navigate("/visa")} className={btnGhost}>
              Cancel
            </button>
          </div>
        </form>
      </Surface>
    </PageShell>
  );
}
