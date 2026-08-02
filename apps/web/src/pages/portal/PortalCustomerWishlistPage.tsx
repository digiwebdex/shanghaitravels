import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { customerPortalApi } from "@/lib/portalApi";
import { ApiError } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { ErrorBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { formatPrice, displayPricePoisha } from "@/lib/packages";

export default function PortalCustomerWishlistPage() {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customerPortalApi.wishlist();
      setRows((Array.isArray(r) ? r : []) as PackageMaster[]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    await customerPortalApi.removeWishlist(id);
    await load();
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <h1 className="text-[18px] font-bold">Wishlist</h1>
      <ErrorBanner message={error} />
      {loading ? (
        <InlineSpinner />
      ) : !rows.length ? (
        <p className="text-[12px] text-[var(--muted-foreground)]">No saved packages.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li key={p.id} className="flex items-center justify-between bg-white border rounded-xl p-3 text-[12px]">
              <div>
                <Link to={`/portal/customer/packages/${p.slug}/book`} className="font-bold text-amber-800">
                  {p.name}
                </Link>
                <p className="text-[var(--muted-foreground)]">{formatPrice(displayPricePoisha(p))}</p>
              </div>
              <button type="button" className="text-red-600" onClick={() => void remove(p.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
