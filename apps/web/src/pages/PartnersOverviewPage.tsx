import { Link } from "react-router";
import { Building2, Handshake, Truck, UserRound } from "lucide-react";
import { PageHeader, PageShell, Surface } from "@/components/enterprise/Page";
import { PartnerModuleNav } from "@/components/partners/PartnerModuleNav";

const CARDS = [
  { label: "Customers", to: "/customers", icon: UserRound, perm: "customer:read", hint: "B2C travellers" },
  { label: "Agents", to: "/partners/agents", icon: Handshake, perm: "commission:read", hint: "B2B referrers" },
  { label: "Corporate Clients", to: "/partners/corporate", icon: Building2, perm: "customer:read", hint: "Company accounts" },
  { label: "Suppliers", to: "/partners/suppliers", icon: Truck, perm: "supplier:read", hint: "Airlines, hotels, vendors" },
];

export default function PartnersOverviewPage() {
  return (
    <PageShell>
      <PageHeader
        title="Business Partners"
        subtitle="Customers, agents, corporate clients and suppliers — the commercial parties behind every booking."
        breadcrumb={[{ label: "Business Partners" }]}
      />
      <PartnerModuleNav />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-amber-300 hover:shadow-sm"
          >
            <c.icon size={18} className="text-amber-600" />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{c.label}</p>
            <p className="mt-1 text-[11.5px] text-slate-500">{c.hint}</p>
          </Link>
        ))}
      </div>
      <Surface padded>
        <p className="text-[12px] font-bold text-slate-800">Supplier is a Business Partner</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
          Supplier records drive Accounts Payable, package costing and supplier ledgers. Bookings link to suppliers
          through AP bills and package master — not a direct Application.supplierId (no schema change).
        </p>
      </Surface>
    </PageShell>
  );
}
