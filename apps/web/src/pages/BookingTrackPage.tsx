import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router";
import { PackageSearch, Search } from "lucide-react";
import { ERP } from "@/config/env";
import { BookingTracker, type TrackData } from "@/components/tracking/BookingTracker";

type TrackResult = ({ found: true } & TrackData) | { found: false };

/** Public booking tracking page. No login — customer-safe status + stage progress. */
export default function BookingTrackPage() {
  const { ref: refParam = "" } = useParams();
  const [ref, setRef] = useState(refParam);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function track(value: string) {
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    try {
      const r = await fetch(`${ERP}/public/track?ref=${encodeURIComponent(q)}`);
      setResult(await r.json());
    } catch {
      setResult({ found: false });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (refParam) void track(refParam);
  }, [refParam]);

  function submit(e: FormEvent) {
    e.preventDefault();
    void track(ref);
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] p-6">
      <div className="mt-10 w-full max-w-lg rounded-2xl bg-[var(--card)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--ring-card)]">
        <div className="mb-4 text-center">
          <p className="text-[16px] font-extrabold text-[var(--primary)]">Shanghai Travels</p>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
            <PackageSearch size={13} /> Track your booking
          </p>
        </div>

        <form onSubmit={submit} className="mb-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[13px]"
            placeholder="Enter booking reference (e.g. APP-00123)"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            aria-label="Booking reference"
          />
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-[12.5px] font-bold text-white">
            <Search size={14} /> Track
          </button>
        </form>

        {loading ? (
          <p className="py-8 text-center text-[12px] text-[var(--muted-foreground)]">Looking up {ref}…</p>
        ) : result?.found ? (
          <div className="rounded-xl border border-[var(--border)] p-4">
            <BookingTracker data={result} />
            {result.customerName && (
              <p className="mt-3 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--muted-foreground)]">Booked for {result.customerName}</p>
            )}
          </div>
        ) : result && !result.found ? (
          <p className="py-6 text-center text-[12.5px] text-[var(--muted-foreground)]">
            No booking found for <span className="font-mono">{ref}</span>. Check the reference and try again.
          </p>
        ) : null}

        <p className="mt-5 text-center text-[10px] text-[var(--muted-foreground)]">shanghaitravels.com.bd</p>
      </div>
    </div>
  );
}
