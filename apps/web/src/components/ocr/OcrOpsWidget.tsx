import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { AlertTriangle, Brain, CheckCircle2, Clock, FileWarning, ScanLine } from "lucide-react";
import { applicationsApi, customersApi, ocrApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { Application, Customer, Passport } from "@/lib/types";
import { passportExpiry } from "@/lib/types";
import { Can } from "@/auth/Can";
import { Surface } from "@/components/enterprise/Page";

const EXPIRY_DAYS = 180;

function daysUntil(dateStr: string): number | null {
  if (!dateStr || dateStr === "—") return null;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

/**
 * Operations dashboard widget — Document Intelligence KPIs.
 */
export function OcrOpsWidget() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof ocrApi.stats>> | null>(null);
  const [failed, setFailed] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [expiringPassports, setExpiringPassports] = useState(0);
  const [expiringVisas, setExpiringVisas] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, recent, fails] = await Promise.all([
        ocrApi.stats(),
        ocrApi.recent(100),
        ocrApi.failed(50),
      ]);
      setStats(s);
      setFailed(fails.length);
      const low = (Array.isArray(recent) ? recent : []).filter((r) => {
        const c = Number(r.averageConfidence ?? (Number(r.confidence) || 0) * 100);
        return r.status === "completed" && c > 0 && c < 80;
      });
      setPendingReview(low.length);

      try {
        const customers = listOf<Customer>(await customersApi.list({ limit: 200 }));
        let expP = 0;
        for (const c of customers) {
          for (const p of c.passports || []) {
            const d = daysUntil(passportExpiry(p));
            if (d != null && d >= 0 && d <= EXPIRY_DAYS) expP += 1;
          }
        }
        setExpiringPassports(expP);
      } catch {
        setExpiringPassports(0);
      }

      try {
        const visas = listOf<Application>(
          await applicationsApi.list({ serviceType: "visa", limit: 100, status: "in_progress" }),
        );
        // Without a visa-expiry column, surface active visa cases that need attention as proxy.
        setExpiringVisas(visas.filter((v) => v.status === "docs_required" || v.priority === "urgent").length);
      } catch {
        setExpiringVisas(0);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "OCR stats unavailable");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const successRate =
    stats && stats.scannedToday > 0
      ? Math.round(((stats.scannedToday - (stats.failures || 0)) / stats.scannedToday) * 100)
      : null;

  return (
    <Can perm="ocr:use">
      <Surface padded className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-[var(--accent)]" />
            <h2 className="text-[13px] font-bold text-[var(--primary)]">Document Intelligence</h2>
          </div>
          <Link
            to="/operations/document-intelligence"
            className="text-[11px] font-bold text-[var(--accent)]"
          >
            Open hub →
          </Link>
        </div>
        {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <MiniKpi icon={ScanLine} label="Processed today" value={String(stats?.scannedToday ?? 0)} />
          <MiniKpi
            icon={CheckCircle2}
            label="OCR success"
            value={successRate != null ? `${successRate}%` : "—"}
          />
          <MiniKpi icon={Clock} label="Pending review" value={String(pendingReview)} warn={pendingReview > 0} />
          <MiniKpi icon={FileWarning} label="Failed OCR" value={String(failed || stats?.failures || 0)} warn />
          <MiniKpi
            icon={AlertTriangle}
            label="Expiring passports"
            value={String(expiringPassports)}
            warn={expiringPassports > 0}
            hint={`≤ ${EXPIRY_DAYS}d`}
          />
          <MiniKpi
            icon={AlertTriangle}
            label="Expiring visas"
            value={String(expiringVisas)}
            warn={expiringVisas > 0}
            hint="Urgent / docs due"
          />
        </div>
      </Surface>
    </Can>
  );
}

function MiniKpi({
  icon: Icon,
  label,
  value,
  warn,
  hint,
}: {
  icon: typeof ScanLine;
  label: string;
  value: string;
  warn?: boolean;
  hint?: string;
}) {
  return (
    <div className={`rounded-xl border px-2.5 py-2 ${warn && value !== "0" && value !== "—" ? "border-amber-300 bg-amber-50" : "border-[var(--border)] bg-white"}`}>
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-[var(--muted-foreground)]">
        <Icon size={11} /> {label}
      </div>
      <div className="mt-1 text-[16px] font-extrabold text-[var(--primary)]">{value}</div>
      {hint && <div className="text-[9px] text-[var(--muted-foreground)]">{hint}</div>}
    </div>
  );
}

/** Customer profile — document timeline from OCR journal + saved passports. */
export function CustomerDocumentTimeline({
  customerId,
  passports,
}: {
  customerId: string;
  passports?: Passport[];
}) {
  const [events, setEvents] = useState<
    { at: string; label: string; detail?: string; tone?: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items: { at: string; label: string; detail?: string; tone?: string }[] = [];
      for (const p of passports || []) {
        items.push({
          at: p.createdAt || "",
          label: `Passport saved ${p.passportNo}`,
          detail: `Exp ${passportExpiry(p)} · ${p.issuingCountry || "—"}`,
          tone: "ok",
        });
      }
      try {
        const recent = await ocrApi.recent(80);
        for (const r of Array.isArray(recent) ? recent : []) {
          if (String(r.customerId || "") !== customerId) continue;
          items.push({
            at: String(r.createdAt || ""),
            label: `OCR ${r.docType || "document"} · ${r.status}`,
            detail: [r.passportNo, r.nidNumber, r.visaNumber].filter(Boolean).join(" · ") || undefined,
            tone: r.status === "failed" ? "bad" : "ocr",
          });
        }
      } catch {
        /* journal optional */
      }
      items.sort((a, b) => String(b.at).localeCompare(String(a.at)));
      if (!cancelled) setEvents(items.slice(0, 40));
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId, passports]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-bold text-[var(--primary)]">Document timeline</h3>
        <Link to="/operations/document-intelligence?tab=search" className="text-[10px] font-bold text-[var(--accent)]">
          Search all →
        </Link>
      </div>
      {!events.length ? (
        <p className="text-[11px] text-[var(--muted-foreground)]">No document events yet. Scan a passport to start.</p>
      ) : (
        <ul className="space-y-2 border-l-2 border-[var(--border)] pl-3">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative">
              <span
                className={`absolute -left-[19px] top-1 size-2.5 rounded-full ${
                  e.tone === "bad" ? "bg-rose-500" : e.tone === "ocr" ? "bg-sky-500" : "bg-emerald-500"
                }`}
              />
              <p className="text-[11px] font-semibold text-[var(--primary)]">{e.label}</p>
              {e.detail && <p className="text-[10px] text-[var(--muted-foreground)]">{e.detail}</p>}
              {e.at && (
                <p className="font-mono text-[9px] text-[var(--muted-foreground)]">
                  {e.at.replace("T", " ").slice(0, 19)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
