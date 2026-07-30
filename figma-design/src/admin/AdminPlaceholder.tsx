import { useLocation } from "react-router";
import { SERVICE_MODULES, OPS_MODULES } from "./data";
import { Layers } from "lucide-react";

export default function AdminPlaceholder() {
  const { pathname } = useLocation();
  const seg = pathname.split("/").pop() ?? "";
  const all = [...SERVICE_MODULES, ...OPS_MODULES];
  const mod = all.find(m => m.route === pathname);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[460px] space-y-4">
      <div className="size-12 rounded-2xl flex items-center justify-center border-2"
           style={{ borderColor: mod?.color ?? "#F59E0B", background: (mod?.color ?? "#F59E0B") + "20" }}>
        <Layers size={20} style={{ color: mod?.color ?? "#F59E0B" }} />
      </div>
      <div className="text-center">
        <p className="text-[16px] font-bold text-slate-800">{mod?.label ?? seg} Module</p>
        <p className="text-[11.5px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
          This module is under active development and will be available in the next release.
        </p>
      </div>
      <span className="text-[9.5px] font-mono text-slate-400 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
        {pathname}
      </span>
    </div>
  );
}
