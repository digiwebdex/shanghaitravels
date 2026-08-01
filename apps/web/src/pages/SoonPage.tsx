import { Construction } from "lucide-react";
import { useLocation } from "react-router";
import { PageHeader, PageShell, Surface } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceForPath } from "@/workspaces/registry";

const TITLES: Record<string, { title: string; why: string }> = {
  "/admin/roles": {
    title: "Roles",
    why: "Role management has no admin API yet. Permissions are seeded and enforced server-side; assignment happens outside this UI.",
  },
  "/admin/permissions": {
    title: "Permissions",
    why: "Permission catalog is seeded in the database. There is no list/update endpoint for a UI to call.",
  },
  "/admin/audit": {
    title: "Audit Logs",
    why: "audit:read is seeded but no /api/audit route exists yet.",
  },
  "/admin/api-keys": {
    title: "API Keys",
    why: "No API-key entity or endpoints exist in the backend.",
  },
  "/admin/integrations": {
    title: "Integrations",
    why: "No integrations registry exists in the backend.",
  },
  "/ai": {
    title: "AI Workspace",
    why: "Planned product area. No models or endpoints exist — will not be invented on the frontend.",
  },
};

/**
 * Roadmap placeholder for nav leaves whose backend is missing.
 * Keeps information architecture visible without dead 404s or invented APIs.
 */
export default function SoonPage() {
  const { pathname } = useLocation();
  const meta = TITLES[pathname] ?? TITLES[pathname.replace(/\/$/, "")] ?? {
    title: "Coming soon",
    why: "This screen is in the product map but has no backend endpoint yet.",
  };
  const workspace = workspaceForPath(pathname);

  return (
    <PageShell>
      <PageHeader
        icon={Construction}
        title={meta.title}
        subtitle="Backend not available — frontend only."
        breadcrumb={[{ label: workspace?.label || "ERP" }, { label: meta.title }]}
      />
      {workspace && <WorkspaceTabsCompact workspace={workspace} />}
      <Surface padded>
        <div className="flex flex-col items-start gap-3 py-6 sm:flex-row sm:items-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Construction size={22} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-800">Marked as Soon</p>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-slate-500">{meta.why}</p>
            <p className="mt-2 text-[11px] text-slate-400">
              Path: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10.5px]">{pathname}</code>
            </p>
          </div>
        </div>
      </Surface>
    </PageShell>
  );
}
