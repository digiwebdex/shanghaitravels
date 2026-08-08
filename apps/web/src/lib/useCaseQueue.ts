import { useEffect, useState } from "react";
import { applicationsApi, financeApi, usersApi } from "@/lib/services";
import { listOf } from "@/lib/api";
import type { AppDocument, Application, Invoice, Journey, StaffUser } from "@/lib/types";
import type { CaseBundle } from "@/components/enterprise/CaseSummary";
import { downloadBlob } from "@/lib/statements";

/**
 * V12+ shared queue mechanics for service verticals (Tour, Hajj/Umrah, Student,
 * Manpower): staff-name map, row selection (keyboard target), multi-select for
 * bulk actions, and the 360-drawer bundle fetch (journey + invoices + documents
 * via existing endpoints). One implementation instead of a copy per queue page;
 * frozen queues (Visa/Ticket/Hotel/Transport) keep their own copies untouched.
 */
export function useCaseQueue(visible: Application[]) {
  const [staffMap, setStaffMap] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<CaseBundle | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    usersApi.list()
      .then((u: StaffUser[]) => { if (alive) setStaffMap(Object.fromEntries(u.map((s) => [s.id, s.fullName]))); })
      .catch(() => { /* non-fatal */ });
    return () => { alive = false; };
  }, []);

  // 360 bundle whenever the drawer opens (row already carries the expanded detail).
  useEffect(() => {
    if (!viewId) { setBundle(null); return; }
    const app = visible.find((r) => r.id === viewId);
    if (!app) return;
    let alive = true;
    setBundle(null);
    Promise.all([
      applicationsApi.journey(viewId).catch(() => null as Journey | null),
      financeApi.listInvoices({ applicationId: viewId }).then((r) => listOf<Invoice>(r)).catch(() => [] as Invoice[]),
      applicationsApi.documents(viewId).catch(() => [] as AppDocument[]),
    ]).then(([journey, invoices, documents]) => { if (alive) setBundle({ app, journey, invoices, documents }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);

  // Keyboard: Enter opens the 360 for the selected row (ignores typing contexts).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedKey || viewId) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "Enter") {
        const a = visible.find((x) => x.id === selectedKey);
        if (a) { e.preventDefault(); setViewId(a.id); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedKey, viewId, visible]);

  const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && visible.some((r) => selectedIds.has(r.id));
  const selectedCase = visible.find((r) => r.id === selectedKey) || null;

  function openView(a: Application) { setSelectedKey(a.id); setViewId(a.id); }
  function toggleOne(id: string) {
    setSelectedIds((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleAll() { setSelectedIds(allSelected ? new Set() : new Set(visible.map((r) => r.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  return {
    staffMap, selectedKey, setSelectedKey, viewId, setViewId, bundle,
    selectedIds, toggleOne, toggleAll, clearSelection,
    allSelected, someSelected, selectedCase, openView,
  };
}

/** Columnar CSV export shared by the vertical queues (reuses downloadBlob). */
export function exportCaseCsv(baseName: string, cols: [string, (a: Application) => string][], list: Application[]) {
  if (!list.length) return;
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [cols.map((c) => c[0]), ...list.map((a) => cols.map((c) => c[1](a)))].map((r) => r.map(esc).join(",")).join("\r\n");
  downloadBlob(list.length === 1 ? `${list[0].referenceNo}.csv` : `${baseName}-${list.length}.csv`, csv, "text/csv;charset=utf-8");
}
