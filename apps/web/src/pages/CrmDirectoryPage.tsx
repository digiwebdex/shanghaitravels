import { Link } from "react-router";
import { Building2, Contact } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { ModuleNavFromWorkspace } from "@/workspaces/ModuleNavFromWorkspace";

const ITEMS = [
  {
    label: "Contacts",
    to: "/crm/contacts",
    icon: Contact,
    hint: "People linked to leads, opportunities and organizations",
  },
  {
    label: "Organizations",
    to: "/crm/organizations",
    icon: Building2,
    hint: "Companies and accounts in the CRM directory",
  },
];

/** Master-data screens nested under CRM so the daily sales menu stays short. */
export default function CrmDirectoryPage() {
  return (
    <PageShell>
      <PageHeader
        title="Directory"
        subtitle="Contacts and organizations used across CRM and sales."
        breadcrumb={[{ label: "CRM & Sales", to: "/crm" }, { label: "Directory" }]}
      />
      <ModuleNavFromWorkspace workspaceId="crm" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-orange-300 hover:shadow-sm"
          >
            <item.icon size={18} className="text-orange-600" />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{item.label}</p>
            <p className="mt-1 text-[11.5px] text-slate-500">{item.hint}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
