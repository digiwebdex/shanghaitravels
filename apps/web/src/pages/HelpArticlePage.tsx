/**
 * V17 — one guide, plus the category listing.
 *
 * The article answers the ten documentation questions in a fixed order, states
 * the permission each step needs, and hides the "Open this module" button when
 * the signed-in user could not use it.
 */
import { Link, useParams } from "react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, ExternalLink, Info, LifeBuoy, Lock, ListChecks } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { PageShell, PageHeader, Surface, SurfaceHeader, EmptyPanel } from "@/components/enterprise/Page";
import {
  ARTICLE_BY_SLUG, CATEGORY_BY_ID, ROLE_LABELS, articlesInCategory,
} from "@/help";
import type { CategoryId } from "@/help";

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Info; children: React.ReactNode }) {
  return (
    <section className="px-5 py-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
        {Icon && <Icon size={12} />} {title}
      </h3>
      {children}
    </section>
  );
}

export function HelpCategoryPage() {
  const { id } = useParams();
  const cat = id ? CATEGORY_BY_ID[id as CategoryId] : undefined;
  const list = cat ? articlesInCategory(cat.id) : [];

  if (!cat) {
    return (
      <PageShell>
        <PageHeader title="Topic not found" icon={LifeBuoy} breadcrumb={[{ label: "Help", to: "/help" }]} />
        <Surface><EmptyPanel title="Unknown topic" hint="Open the Help Center to browse the available topics." /></Surface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={`${cat.label} · ${cat.bn}`}
        subtitle={cat.blurb}
        icon={LifeBuoy}
        breadcrumb={[{ label: "Help", to: "/help" }, { label: cat.label }]}
      />
      <Surface>
        <SurfaceHeader title={`${list.length} guide${list.length === 1 ? "" : "s"}`} />
        <ul className="space-y-1.5 px-5 pb-5">
          {list.map((a) => (
            <li key={a.slug}>
              <Link to={`/help/a/${a.slug}`} className="block rounded-lg border border-[var(--border)] px-3.5 py-2.5 transition-colors hover:border-[var(--primary)]/60">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-bold">{a.title}</span>
                  {a.availability && a.availability !== "available" && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      {a.availability === "unavailable" ? "Not available" : "Partly available"}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--muted-foreground)]">{a.what}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Surface>
    </PageShell>
  );
}

export default function HelpArticlePage() {
  const { slug } = useParams();
  const { can } = useAuth();
  const a = slug ? ARTICLE_BY_SLUG[slug] : undefined;

  if (!a) {
    return (
      <PageShell>
        <PageHeader title="Guide not found" icon={LifeBuoy} breadcrumb={[{ label: "Help", to: "/help" }]} />
        <Surface><EmptyPanel title="Unknown guide" hint="Open the Help Center to search the available guides." /></Surface>
      </PageShell>
    );
  }

  const cat = CATEGORY_BY_ID[a.category];
  const canDo = !a.perms.length || a.perms.some((p) => can(p));
  const canOpen = a.openTo ? canDo : false;

  return (
    <PageShell>
      <PageHeader
        title={a.title}
        subtitle={a.bn}
        icon={LifeBuoy}
        breadcrumb={[{ label: "Help", to: "/help" }, { label: cat.label, to: `/help/c/${cat.id}` }, { label: a.title }]}
        actions={
          a.openTo ? (
            canOpen ? (
              <Link to={a.openTo} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-[12px] font-bold text-white">
                <ExternalLink size={13} /> {a.openLabel || "Open this module"}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-[12px] font-semibold text-[var(--muted-foreground)]">
                <Lock size={13} /> Administrator only
              </span>
            )
          ) : undefined
        }
      />

      {a.availability && a.availability !== "available" && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3">
          <AlertTriangle size={15} className="mt-[1px] shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-[12px] font-bold text-amber-700 dark:text-amber-300">
              {a.availability === "unavailable" ? "NOT CURRENTLY AVAILABLE" : "Partly available in this build"}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--foreground)]">{a.availabilityNote}</p>
          </div>
        </div>
      )}

      {!canDo && a.perms.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-3">
          <Lock size={15} className="mt-[1px] shrink-0 text-[var(--muted-foreground)]" />
          <p className="text-[11.5px] leading-relaxed">
            You don't have permission to perform this action. Please contact an Administrator.
            <span className="ml-1 text-[var(--muted-foreground)]">Needs: {a.perms.join(", ")}.</span>
          </p>
        </div>
      )}

      <Surface>
        <Section title="What is this?" icon={Info}>
          <p className="text-[12.5px] leading-relaxed">{a.what}</p>
        </Section>
        <div className="border-t border-[var(--border)]" />
        <Section title="Why do I use it?">
          <p className="text-[12.5px] leading-relaxed">{a.why}</p>
        </Section>
        <div className="border-t border-[var(--border)]" />
        <Section title="Who uses it & when">
          <p className="text-[12.5px] leading-relaxed">
            {a.who.includes("*") ? "Everyone with access to the module." : a.who.map((r) => ROLE_LABELS[r] || r).join(" · ")}
          </p>
          <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">{a.when}</p>
          {a.perms.length > 0 && (
            <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
              Permissions: <span className="font-mono">{a.perms.join(", ")}</span>
            </p>
          )}
        </Section>
        {a.prerequisites.length > 0 && (
          <>
            <div className="border-t border-[var(--border)]" />
            <Section title="Before you start" icon={ListChecks}>
              <ul className="space-y-1">
                {a.prerequisites.map((p) => (
                  <li key={p} className="flex items-start gap-1.5 text-[12.5px]">
                    <CheckCircle2 size={13} className="mt-[3px] shrink-0 text-[var(--muted-foreground)]" /> {p}
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </Surface>

      <Surface>
        <SurfaceHeader title="Step by step" hint="Each step names the screen and the permission it needs." />
        <ol className="space-y-2.5 px-5 pb-5">
          {a.steps.map((s, i) => {
            const stepAllowed = !s.perm || can(s.perm);
            return (
              <li key={`${s.title}-${i}`} className="rounded-xl border border-[var(--border)] px-3.5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] font-bold">{s.title}</span>
                  {s.bn && <span className="text-[11px] text-[var(--muted-foreground)]">{s.bn}</span>}
                  {s.perm && !stepAllowed && (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--muted)] px-1.5 py-[1px] text-[9.5px] font-semibold text-[var(--muted-foreground)]">
                      <Lock size={9} /> {s.perm}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--foreground)]">{s.detail}</p>

                {s.fields && s.fields.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-lg bg-[var(--muted)]/40 px-3 py-2">
                    {s.fields.map((f) => (
                      <li key={f.label} className="text-[11.5px]">
                        <span className="font-semibold">{f.label}</span>
                        {f.bn && <span className="ml-1 text-[var(--muted-foreground)]">{f.bn}</span>}
                        {f.required && <span className="ml-1 font-bold text-red-500">*required</span>}
                        {f.note && <span className="ml-1 text-[var(--muted-foreground)]">— {f.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {s.route && stepAllowed && (
                  <Link to={s.route} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--primary)]">
                    Go to this screen <ArrowRight size={11} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </Surface>

      <Surface>
        <Section title="Expected result" icon={CheckCircle2}>
          <p className="text-[12.5px] leading-relaxed">{a.result}</p>
          {a.seeResult && <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">Where to see it: {a.seeResult}</p>}
        </Section>
        {a.problems.length > 0 && (
          <>
            <div className="border-t border-[var(--border)]" />
            <Section title="Common problems & how to fix them" icon={AlertTriangle}>
              <ul className="space-y-2">
                {a.problems.map((p) => (
                  <li key={p.problem} className="rounded-lg border border-[var(--border)] px-3 py-2">
                    <p className="text-[12px] font-semibold">{p.problem}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">{p.fix}</p>
                  </li>
                ))}
              </ul>
            </Section>
          </>
        )}
      </Surface>

      {a.related.length > 0 && (
        <Surface>
          <SurfaceHeader title="Related guides" />
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {a.related.map((r) => {
              const rel = ARTICLE_BY_SLUG[r];
              if (!rel) return null;
              return (
                <Link
                  key={r}
                  to={`/help/a/${r}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11.5px] font-semibold transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
                >
                  {rel.title} <ArrowRight size={11} />
                </Link>
              );
            })}
          </div>
        </Surface>
      )}
    </PageShell>
  );
}
