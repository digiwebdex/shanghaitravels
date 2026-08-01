import { Link } from "react-router";
import { FileSpreadsheet, FileText, ScrollText, ShieldCheck } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { ModuleNavFromWorkspace } from "@/workspaces/ModuleNavFromWorkspace";

const ITEMS = [
  {
    label: "Chart of Accounts",
    to: "/finance",
    icon: ScrollText,
    hint: "General ledger accounts and account groups",
  },
  {
    label: "Journals",
    to: "/finance/journals",
    icon: FileText,
    hint: "Manual and system journal entries",
  },
  {
    label: "Financial Statements",
    to: "/finance/statements",
    icon: FileSpreadsheet,
    hint: "Profit & loss, balance sheet and related reports",
  },
  {
    label: "Period Closing",
    to: "/finance/closing",
    icon: ShieldCheck,
    hint: "Close accounting periods and lock prior months",
  },
];

/** Infrequent GL / close screens — kept off the daily Finance sidebar. */
export default function FinanceAccountingPage() {
  return (
    <PageShell>
      <PageHeader
        title="Accounting"
        subtitle="Chart of accounts, journals, statements and period closing."
        breadcrumb={[{ label: "Finance", to: "/finance/dashboard" }, { label: "Accounting" }]}
      />
      <ModuleNavFromWorkspace workspaceId="finance" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
