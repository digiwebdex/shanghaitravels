/**
 * V17 — the clickable workflow map page.
 *
 * Defaults to the master journey, which is the answer to "how do I take a
 * customer from a lead all the way to completion?".
 */
import { Link, useParams } from "react-router";
import { Workflow } from "lucide-react";
import { PageShell, PageHeader, Surface, SurfaceHeader, EmptyPanel } from "@/components/enterprise/Page";
import { FLOWS, FLOW_BY_SLUG, MASTER_FLOW } from "@/help";
import { FlowChart } from "@/help/FlowChart";

export default function HelpFlowPage() {
  const { slug } = useParams();
  const flow = slug ? FLOW_BY_SLUG[slug] : MASTER_FLOW;

  if (!flow) {
    return (
      <PageShell>
        <PageHeader title="Workflow not found" icon={Workflow} breadcrumb={[{ label: "Help", to: "/help" }]} />
        <Surface><EmptyPanel title="Unknown workflow" hint="Open the Help Center to browse the workflow maps." /></Surface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={flow.title}
        subtitle={flow.subtitle}
        icon={Workflow}
        breadcrumb={[{ label: "Help", to: "/help" }, { label: flow.title }]}
      />

      <div className="flex flex-wrap gap-1.5">
        {FLOWS.map((f) => (
          <Link
            key={f.slug}
            to={`/help/flow/${f.slug}`}
            className={`rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
              f.slug === flow.slug
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
            }`}
          >
            {f.title}
          </Link>
        ))}
      </div>

      <Surface>
        <SurfaceHeader
          title={`${flow.nodes.length} steps`}
          hint="Click a step for its guide; use Open to jump into the live module."
        />
        <div className="px-5 pb-6">
          <FlowChart flow={flow} />
        </div>
      </Surface>
    </PageShell>
  );
}
