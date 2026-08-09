/**
 * V17 — the floating "ERP Assistant".
 *
 * Role-aware by construction: it reuses `useAuth().can()` so it never tells a
 * user to perform an action the API would refuse. There is no LLM behind it —
 * answers come from the audited knowledge base, so it cannot invent a workflow.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, HelpCircle, Lock, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ANSWERS, ARTICLE_BY_SLUG, ROLE_LABELS, bestAnswer, searchHelp } from "./index";

type Msg = {
  role: "user" | "bot";
  text: string;
  article?: string;
  route?: string;
  routeAllowed?: boolean;
  suggestions?: { label: string; slug: string; kind: string }[];
};

const STARTERS = [
  "How do I add a customer?",
  "How do I scan a passport?",
  "How do I create a visa booking?",
  "How do I record a payment?",
  "Where can I see supplier due?",
  "What does At Risk mean?",
];

export function HelpAssistant() {
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => {
    const role = user?.role ? ROLE_LABELS[user.role] || user.role : "there";
    return `Hello ${role}. Ask me how to do something in the ERP — I answer from the official guide and only suggest actions your role allows.`;
  }, [user?.role]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ block: "end" });
      inputRef.current?.focus();
    }
  }, [open, msgs]);

  function ask(text: string) {
    const query = text.trim();
    if (!query) return;
    const hits = searchHelp(query, 6);
    const direct = bestAnswer(query);

    let reply: Msg;
    if (direct) {
      const allowed = !direct.perm || can(direct.perm);
      reply = {
        role: "bot",
        text: allowed
          ? direct.a
          : `${direct.a}\n\nYou don't have permission to perform this action. Please contact an Administrator.`,
        article: direct.article,
        route: direct.route,
        routeAllowed: allowed,
        suggestions: hits.filter((h) => h.kind !== "answer").slice(0, 3).map((h) => ({ label: h.title, slug: h.slug, kind: h.kind })),
      };
    } else if (hits.length) {
      const top = hits[0];
      const art = top.kind === "article" ? ARTICLE_BY_SLUG[top.slug] : undefined;
      const allowed = !art?.perms.length || art.perms.some((p) => can(p));
      reply = {
        role: "bot",
        text: art
          ? `${art.what}\n\n${allowed ? "" : "You don't have permission to perform this action. Please contact an Administrator.\n\n"}Open the full guide for the step-by-step.`
          : "Here is the closest guidance I have.",
        article: top.kind === "article" ? top.slug : undefined,
        route: allowed ? art?.openTo : undefined,
        routeAllowed: allowed,
        suggestions: hits.slice(0, 4).map((h) => ({ label: h.title, slug: h.slug, kind: h.kind })),
      };
    } else {
      reply = {
        role: "bot",
        text: "I could not find that in the ERP guide. Try different words — for example 'passport', 'invoice', 'supplier due' or 'agent ownership' — or browse the Help Center.",
        suggestions: [],
      };
    }

    setMsgs((m) => [...m, { role: "user", text: query }, reply]);
    setQ("");
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open ERP Assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--primary)] px-4 py-3 text-[12.5px] font-bold text-white shadow-lg transition-transform hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <HelpCircle size={16} />
          ERP Assistant
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="ERP Assistant"
          className="fixed bottom-5 right-5 z-50 flex h-[min(560px,calc(100vh-2.5rem))] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          <header className="flex items-start justify-between gap-2 border-b border-[var(--border)] bg-[var(--primary)] px-4 py-3 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[13px] font-bold">
                <Sparkles size={14} /> ERP Assistant
              </div>
              <p className="text-[11px] text-white/80">How can I help you?</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded p-1 hover:bg-white/15">
              <X size={15} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3">
            {msgs.length === 0 && (
              <>
                <p className="rounded-xl bg-[var(--muted)]/50 px-3 py-2.5 text-[12px] leading-relaxed text-[var(--foreground)]">{greeting}</p>
                <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-xl rounded-br-sm bg-[var(--primary)] px-3 py-2 text-[12px] font-medium text-white"
                      : "w-full rounded-xl bg-[var(--muted)]/50 px-3 py-2.5 text-[12px] leading-relaxed text-[var(--foreground)]"
                  }
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {m.role === "bot" && (m.article || m.route || m.suggestions?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.article && (
                        <Link
                          to={`/help/a/${m.article}`}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[10.5px] font-semibold transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
                        >
                          Full guide <ArrowRight size={10} />
                        </Link>
                      )}
                      {m.route && m.routeAllowed && (
                        <Link
                          to={m.route}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-2 py-1 text-[10.5px] font-semibold text-white"
                        >
                          Open module <ArrowRight size={10} />
                        </Link>
                      )}
                      {m.routeAllowed === false && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--border)] px-2 py-1 text-[10.5px] text-[var(--muted-foreground)]">
                          <Lock size={10} /> Administrator only
                        </span>
                      )}
                      {m.suggestions?.map((s) => (
                        <Link
                          key={`${s.kind}-${s.slug}`}
                          to={s.kind === "flow" ? `/help/flow/${s.slug}` : `/help/a/${s.slug}`}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center rounded-md border border-[var(--border)] px-2 py-1 text-[10.5px] transition-colors hover:border-[var(--primary)]/60 hover:text-[var(--primary)]"
                        >
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask how to do something…"
              aria-label="Ask the ERP Assistant"
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[12px] outline-none focus:border-[var(--primary)]/60"
            />
            <button type="submit" aria-label="Send" className="rounded-lg bg-[var(--primary)] p-2 text-white disabled:opacity-40" disabled={!q.trim()}>
              <Send size={14} />
            </button>
          </form>

          <Link
            to="/help"
            onClick={() => setOpen(false)}
            className="border-t border-[var(--border)] px-3 py-2 text-center text-[10.5px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
          >
            Browse the full Help Center →
          </Link>
        </div>
      )}
    </>
  );
}

/** Exported for tests/registry parity with the answer list. */
export const ASSISTANT_STARTERS = STARTERS;
export const ANSWER_COUNT = ANSWERS.length;
