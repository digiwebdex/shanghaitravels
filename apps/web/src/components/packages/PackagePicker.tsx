import { useCallback, useEffect, useMemo, useState } from "react";
import { packagesApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { PackageMaster } from "@/lib/packages";
import { formatPrice, displayPricePoisha } from "@/lib/packages";
import { inputCls, labelCls } from "@/components/cases/formStyles";

type Props = {
  value: string;
  onChange: (packageId: string, pkg?: PackageMaster) => void;
  label?: string;
  required?: boolean;
  status?: "published" | "draft";
  id?: string;
};

export function PackagePicker({ value, onChange, label = "Package", required, status = "published", id = "package-picker" }: Props) {
  const [rows, setRows] = useState<PackageMaster[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await packagesApi.list({ q: q || undefined, status, limit: 50 });
      setRows(listOf<PackageMaster>(r));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [load]);

  const selected = useMemo(() => rows.find((p) => p.id === value), [rows, value]);

  return (
    <div className="space-y-1">
      <label className={labelCls} htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={`${id}-search`}
        className={inputCls}
        placeholder="Search packages by name or code…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-controls={id}
      />
      <select
        id={id}
        className={inputCls}
        value={value}
        onChange={(e) => {
          const pkg = rows.find((p) => p.id === e.target.value);
          onChange(e.target.value, pkg);
        }}
        required={required}
        aria-busy={loading}
      >
        <option value="">Select package…</option>
        {rows.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name} ({formatPrice(displayPricePoisha(p))})
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-[10px] text-slate-500">
          PackageID: <span className="font-mono">{selected.id}</span> · {selected.destination || selected.country || "—"}
        </p>
      )}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
