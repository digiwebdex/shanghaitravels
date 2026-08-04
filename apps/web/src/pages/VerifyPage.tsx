import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ShieldCheck, ShieldX } from "lucide-react";
import { ERP } from "@/config/env";

type VerifyResult =
  | { valid: false }
  | {
      valid: true;
      type: string;
      number: string;
      status: string;
      total: number;
      currency: string;
      issuedAt: string;
      customerName: string;
    };

const money = (minor: number, cur = "BDT") =>
  `${cur === "BDT" ? "৳" : cur + " "}${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

/** Public document verification page (QR target). No login. Customer-safe fields only. */
export default function VerifyPage() {
  const { no = "" } = useParams();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`${ERP}/public/verify?no=${encodeURIComponent(no)}`)
      .then((r) => r.json())
      .then((d) => alive && setResult(d))
      .catch(() => alive && setResult({ valid: false }))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [no]);

  const valid = result?.valid === true;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)]">
        <div className="mb-4 text-center">
          <p className="text-[16px] font-extrabold text-[var(--primary)]">Shanghai Travels</p>
          <p className="text-[11px] text-[var(--muted-foreground)]">Document verification</p>
        </div>
        {loading ? (
          <p className="py-8 text-center text-[12px] text-[var(--muted-foreground)]">Verifying {no}…</p>
        ) : valid && result?.valid ? (
          <>
            <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[var(--success-bg)] py-3 text-[var(--success-foreground)]">
              <ShieldCheck size={18} />
              <span className="text-[13px] font-bold">Authentic document</span>
            </div>
            <dl className="space-y-2 text-[12.5px]">
              <Row k="Type" v={result.type} />
              <Row k="Number" v={result.number} />
              <Row k="Status" v={String(result.status).toUpperCase()} />
              <Row k="Amount" v={money(result.total, result.currency)} />
              <Row k="Customer" v={result.customerName} />
              <Row k="Issued" v={new Date(result.issuedAt).toLocaleDateString("en-GB")} />
            </dl>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[var(--error-bg,#fdecec)] text-[var(--error,#c0392b)]">
              <ShieldX size={22} />
            </span>
            <p className="text-[13px] font-bold text-[var(--primary)]">No matching document</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">
              We could not verify a document numbered <span className="font-mono">{no}</span>.
            </p>
          </div>
        )}
        <p className="mt-5 text-center text-[10px] text-[var(--muted-foreground)]">
          shanghaitravels.com.bd · Reg. No. 0017053
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--border)] pb-1.5">
      <dt className="text-[var(--muted-foreground)]">{k}</dt>
      <dd className="font-semibold text-[var(--foreground)]">{v}</dd>
    </div>
  );
}
