import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { applicationsApi, tasksApi, type OpsTask } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application } from "@/lib/types";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { Pill, statusTone } from "@/components/enterprise/DataTable";
import { PageHeader, PageShell, Surface, SurfaceHeader } from "@/components/enterprise/Page";
import { WorkspaceTabsCompact } from "@/workspaces/WorkspaceTabs";
import { workspaceById } from "@/workspaces/registry";
import { Link } from "react-router";

type CalItem = {
  id: string;
  date: string;
  title: string;
  kind: "task" | "booking";
  status: string;
  href: string;
};

/**
 * Calendar is derived — there is no calendar entity.
 * Sources: task dueAt + application createdAt (upcoming travel dates when available).
 */
export default function OperationsCalendarPage() {
  const workspace = workspaceById("operations")!;
  const [items, setItems] = useState<CalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [taskRes, appRes] = await Promise.all([
          tasksApi.list({ limit: 50 }).catch(() => ({ data: [] as OpsTask[], total: 0, page: 1, limit: 50 })),
          applicationsApi.list({ limit: 50 }).catch(() => []),
        ]);
        if (cancelled) return;
        const tasks = listOf<OpsTask>(taskRes)
          .filter((t) => t.dueAt)
          .map((t) => ({
            id: `task-${t.id}`,
            date: t.dueAt!.slice(0, 10),
            title: t.title,
            kind: "task" as const,
            status: t.status,
            href: "/sales/tasks",
          }));
        const apps = listOf<Application>(appRes).map((a) => ({
          id: `app-${a.id}`,
          date: (a.createdAt || "").slice(0, 10),
          title: `${a.referenceNo} · ${a.serviceType}`,
          kind: "booking" as const,
          status: a.status,
          href: serviceHref(a.serviceType, a.id),
        }));
        setItems([...tasks, ...apps].filter((i) => i.date).sort((a, b) => a.date.localeCompare(b.date)));
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load calendar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    for (const i of items) {
      const list = map.get(i.date) || [];
      list.push(i);
      map.set(i.date, list);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <PageShell>
      <PageHeader
        icon={CalendarDays}
        title="Calendar"
        subtitle="Upcoming tasks and booking dates across operations."
        breadcrumb={[{ label: "Operations" }, { label: "Calendar" }]}
      />
      <WorkspaceTabsCompact workspace={workspace} />
      <ErrorBanner message={error} />
      {loading ? (
        <div className="flex justify-center py-16"><InlineSpinner /></div>
      ) : (
        <Surface>
          <SurfaceHeader title={`${items.length} event${items.length === 1 ? "" : "s"}`} hint="Tasks + bookings" />
          {byDate.length === 0 ? (
            <p className="px-4 py-12 text-center text-[11.5px] text-[var(--muted-foreground)]">Nothing scheduled</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {byDate.map(([date, list]) => (
                <div key={date} className="grid grid-cols-[100px_1fr] gap-3 px-4 py-3 sm:px-5">
                  <p className="text-[11px] font-bold tabular-nums text-[var(--primary)]">{date}</p>
                  <ul className="space-y-2">
                    {list.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center gap-2">
                        <Pill value={i.kind} tone={i.kind === "task" ? "amber" : "blue"} />
                        <Link to={i.href} className="text-[12px] font-semibold text-[var(--primary)] hover:text-[var(--accent)]">
                          {i.title}
                        </Link>
                        <Pill value={i.status} tone={statusTone(i.status)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Surface>
      )}
    </PageShell>
  );
}

function serviceHref(serviceType: string, id: string): string {
  const map: Record<string, string> = {
    visa: `/visa/${id}`,
    air_ticket: `/ticketing/${id}`,
    hotel: `/hotels/${id}`,
    transport: `/transport/${id}`,
    tour: `/tours/${id}`,
    hajj: `/hajj/${id}`,
    umrah: `/hajj/${id}`,
  };
  return map[serviceType] || "/visa";
}
