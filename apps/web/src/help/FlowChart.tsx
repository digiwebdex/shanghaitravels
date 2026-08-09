/**
 * V17 — renders a Flow as real, clickable HTML.
 *
 * Deliberately NOT an image: every node is a link into its guide, and (where
 * the signed-in user holds the permission) a second link straight into the live
 * module. Decision nodes fan their branches out below the node.
 */
import { Link } from "react-router";
import { ArrowRight, CornerDownRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import type { Flow, FlowNode } from "./types";

const TONE: Record<string, string> = {
  start: "border-emerald-500/40 bg-emerald-500/[0.07]",
  end: "border-[var(--primary)]/40 bg-[var(--primary)]/[0.07]",
  decision: "border-amber-500/45 bg-amber-500/[0.08]",
  step: "border-[var(--border)] bg-[var(--card)]",
};

function Node({ node, index }: { node: FlowNode; index: number }) {
  const { can } = useAuth();
  const kind = node.kind || "step";
  const canOpen = node.route ? (!node.perm || can(node.perm)) : false;

  const body = (
    <div
      className={`rounded-xl border px-3.5 py-2.5 shadow-sm transition-colors ${TONE[kind]} ${
        node.article ? "hover:border-[var(--primary)]/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] font-bold text-[var(--foreground)]">{node.label}</span>
            {node.bn && <span className="text-[11px] text-[var(--muted-foreground)]">{node.bn}</span>}
            {kind === "decision" && (
              <span className="rounded-full bg-amber-500/15 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Decision
              </span>
            )}
          </div>
          {node.note && <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">{node.note}</p>}
        </div>
        {canOpen && (
          <Link
            to={node.route!}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-1.5 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            title="Open this module"
          >
            <ExternalLink size={10} /> Open
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <li className="relative">
      {index > 0 && (
        <div className="flex justify-center py-1" aria-hidden="true">
          <ArrowRight size={13} className="rotate-90 text-[var(--muted-foreground)] opacity-60" />
        </div>
      )}
      {node.article ? (
        <Link to={`/help/a/${node.article}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-xl">
          {body}
        </Link>
      ) : (
        body
      )}

      {node.branches && node.branches.length > 0 && (
        <ul className="mt-1.5 space-y-1.5 pl-5">
          {node.branches.map((b) => {
            const inner = (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-3 py-1.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-[var(--foreground)]/[0.07] px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide">
                    {b.label}
                  </span>
                  <span className="text-[11.5px] text-[var(--muted-foreground)]">{b.outcome}</span>
                </div>
              </div>
            );
            return (
              <li key={b.label} className="flex items-start gap-1.5">
                <CornerDownRight size={12} className="mt-2 shrink-0 text-[var(--muted-foreground)] opacity-60" />
                <div className="min-w-0 flex-1">
                  {b.article ? (
                    <Link to={`/help/a/${b.article}`} className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]">
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function FlowChart({ flow }: { flow: Flow }) {
  return (
    <ol className="space-y-0" aria-label={`${flow.title} flowchart`}>
      {flow.nodes.map((n, i) => (
        <Node key={n.id} node={n} index={i} />
      ))}
    </ol>
  );
}
