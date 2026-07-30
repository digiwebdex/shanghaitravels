import { AlertTriangle } from "lucide-react";
import { LIVE_MODULES } from "@/config/env";

/** Persistent banner — staff must not enter real data into mock screens. */
export function DemoBadge({ moduleKey }: { moduleKey: string }) {
  if (LIVE_MODULES.has(moduleKey)) return null;
  return (
    <div
      className="sticky top-0 z-20 flex items-center gap-2 px-4 py-2 bg-amber-100 border-b border-amber-300 text-amber-900"
      role="status"
    >
      <AlertTriangle size={14} className="flex-shrink-0" />
      <p className="text-[11px] font-bold">Not yet live — demo data</p>
    </div>
  );
}
