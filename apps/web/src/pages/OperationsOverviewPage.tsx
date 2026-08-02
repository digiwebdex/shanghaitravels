import { Link } from "react-router";
import { Bell, BookOpen, Brain, CalendarDays, Files, Route, Workflow } from "lucide-react";
import { PageHeader, PageShell } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { OcrOpsWidget } from "@/components/ocr/OcrOpsWidget";

const CARDS = [
  { label: "Document Intelligence", to: "/operations/document-intelligence", icon: Brain },
  { label: "Passports", to: "/passports", icon: BookOpen },
  { label: "Documents", to: "/operations/documents", icon: Files },
  { label: "Case Journey", to: "/case-journey", icon: Route },
  { label: "Workflow", to: "/operations/workflow", icon: Workflow },
  { label: "Calendar", to: "/operations/calendar", icon: CalendarDays },
  { label: "Notifications", to: "/operations/notifications", icon: Bell },
];

export default function OperationsOverviewPage() {
  const workspace = workspaceById("operations")!;
  return (
    <PageShell>
      <PageHeader
        title="Operations"
        subtitle="Document Intelligence, passports, case journey, workflow and notifications."
        breadcrumb={[{ label: "Operations" }]}
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <div className="mb-4">
        <OcrOpsWidget />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-sm"
          >
            <c.icon size={18} className="text-amber-600" />
            <p className="mt-3 text-[14px] font-bold text-slate-900">{c.label}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
