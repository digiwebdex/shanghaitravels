import { AnalyticsFilters } from "@/lib/services";
import { inputCls, labelCls } from "@/components/cases/formStyles";

export function AnalyticsFiltersBar({
  value,
  onChange,
  onApply,
}: {
  value: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  onApply: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
      <div>
        <label className={labelCls}>From</label>
        <input
          type="date"
          className={inputCls}
          value={value.from || ""}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className={labelCls}>To</label>
        <input
          type="date"
          className={inputCls}
          value={value.to || ""}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </div>
      <div>
        <label className={labelCls}>Branch ID (HQ)</label>
        <input
          className={inputCls}
          value={value.branchId || ""}
          onChange={(e) => onChange({ ...value, branchId: e.target.value || undefined })}
          placeholder="optional UUID"
        />
      </div>
      <div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          onClick={onApply}
        >
          Apply filters
        </button>
      </div>
    </div>
  );
}
