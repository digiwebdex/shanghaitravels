/**
 * V17 — Help Center.
 *
 * Search, categories, quick actions and the workflow maps. Quick actions and
 * search results are filtered through `useAuth().can()` so nobody is offered a
 * shortcut the server would refuse.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight, Bell, BookOpen, Briefcase, Car, ClipboardList, Compass, CreditCard,
  FileCheck, Handshake, Hotel, Landmark, LifeBuoy, Map, Moon, PieChart, Plane,
  Receipt, Search, Sparkles, Truck, Users, Workflow, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { PageShell, PageHeader, Surface, SurfaceHeader, searchInputClassName } from "@/components/enterprise/Page";
import {
  ARTICLES, CATEGORIES, FLOWS, QUICK_ACTIONS, ROLE_LABELS, articlesInCategory, searchHelp,
} from "@/help";

const ICONS: Record<string, LucideIcon> = {
  Compass, Sparkles, Users, Handshake, FileCheck, ClipboardList, Plane, Hotel, Car, Map,
  Moon, BookOpen, Briefcase, Truck, Landmark, Receipt, CreditCard, Workflow, PieChart, Bell, LifeBuoy,
};

export default function HelpCenterPage() {
  const { user, can } = useAuth();
  const [q, setQ] = useState("");

  const hits = useMemo(() => (q.trim() ? searchHelp(q, 24) : []), [q]);
  const actions = QUICK_ACTIONS.filter((a) => !a.perm || can(a.perm));
  const roleLabel = user?.role ? ROLE_LABELS[user.role] || user.role : "";

  return (
    <PageShell>
      <PageHeader
        title="ERP Assistant"
        subtitle={`Guides, workflows and step-by-step instructions${roleLabel ? ` — shown for your role: ${roleLabel}` : ""}.`}
        icon={LifeBuoy}
        breadcrumb={[{ label: "Help" }]}
        actions={
          <Link
            to="/help/flow/master-journey"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-[12px] font-bold text-white"
          >
            <Workflow size={14} /> Master Workflow
          </Link>
        }
      />

      <Surface>
        <div className="px-5 py-5">
          <label htmlFor="help-search" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            What do you want to do?
          </label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              id="help-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="passport · payment · agent ownership · supplier due · at risk"
              className={`${searchInputClassName} pl-9`}
              autoComplete="off"
            />
          </div>

          {q.trim() && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold text-[var(--muted-foreground)]">
                {hits.length} result{hits.length === 1 ? "" : "s"} for “{q}”
              </p>
              <ul className="space-y-1.5">
                {hits.map((h) => (
                  <li key={`${h.kind}-${h.slug}-${h.title}`}>
                    <Link
                      to={h.kind === "flow" ? `/help/flow/${h.slug}` : `/help/a/${h.slug}`}
                      className="block rounded-lg border border-[var(--border)] px-3.5 py-2.5 transition-colors hover:border-[var(--primary)]/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--muted)] px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                          {h.kind}
                        </span>
                        <span className="text-[12.5px] font-bold">{h.title}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[var(--muted-foreground)]">{h.subtitle}</p>
                    </Link>
                  </li>
                ))}
                {hits.length === 0 && (
                  <li className="rounded-lg border border-dashed border-[var(--border)] px-3.5 py-4 text-[12px] text-[var(--muted-foreground)]">
                    Nothing matched. Try “passport”, “invoice”, “supplier due”, “commission” or “booking”.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </Surface>

      {!q.trim() && (
        <>
          {actions.length > 0 && (
            <Surface>
              <SurfaceHeader title="Quick actions" hint="Only the actions your role can perform." />
              <div className="flex flex-wrap gap-2 px-5 pb-5">
                {actions.map((a) => {
                  const Icon = ICONS[a.icon] || Sparkles;
                  return (
                    <Link
                      key={a.to + a.label}
                      to={a.to}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-[12px] font-semibold transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
                    >
                      <Icon size={13} /> {a.label}
                      <span className="text-[10.5px] font-normal text-[var(--muted-foreground)]">{a.bn}</span>
                    </Link>
                  );
                })}
              </div>
            </Surface>
          )}

          <Surface>
            <SurfaceHeader title="Workflow maps" hint="Clickable end-to-end flows — every step opens its guide." />
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
              {FLOWS.map((f) => (
                <Link
                  key={f.slug}
                  to={`/help/flow/${f.slug}`}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-3 transition-colors hover:border-[var(--primary)]/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-bold">{f.title}</span>
                    <ArrowRight size={13} className="text-[var(--muted-foreground)]" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">{f.nodes.length} steps · {f.bn}</p>
                </Link>
              ))}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Browse by topic" hint={`${ARTICLES.length} guides across ${CATEGORIES.length} topics.`} />
            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c) => {
                const Icon = ICONS[c.icon] || BookOpen;
                const count = articlesInCategory(c.id).length;
                if (!count) return null;
                return (
                  <Link
                    key={c.id}
                    to={`/help/c/${c.id}`}
                    className="rounded-lg border border-[var(--border)] px-3.5 py-3 transition-colors hover:border-[var(--primary)]/60"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={15} className="text-[var(--primary)]" />
                      <span className="text-[12.5px] font-bold">{c.label}</span>
                      <span className="text-[10.5px] text-[var(--muted-foreground)]">{c.bn}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">{c.blurb}</p>
                    <p className="mt-1 text-[10px] font-semibold text-[var(--muted-foreground)]">{count} guide{count === 1 ? "" : "s"}</p>
                  </Link>
                );
              })}
            </div>
          </Surface>
        </>
      )}
    </PageShell>
  );
}
