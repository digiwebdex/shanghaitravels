export const inputCls =
  "w-full px-2.5 py-2 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-amber-400";
export const labelCls = "block text-[10px] font-bold text-slate-500 mb-1";

export const STATUS_PILL: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  in_progress: "bg-amber-100 text-amber-800",
  docs_required: "bg-orange-100 text-orange-800",
  on_hold: "bg-slate-200 text-slate-700",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};
