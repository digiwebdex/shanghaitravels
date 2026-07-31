import { useEffect, useState } from "react";
import { applicationsApi } from "@/lib/services";
import { ApiError } from "@/lib/api";
import type { Application, StaffUser } from "@/lib/types";
import { useAuth } from "@/auth/AuthProvider";
import { inputCls, labelCls } from "@/components/cases/formStyles";

export function CaseAssignCard({
  app,
  staff,
  onSaved,
  setError,
  setOk,
}: {
  app: Application;
  staff: StaffUser[];
  onSaved: () => Promise<void>;
  setError: (s: string) => void;
  setOk: (s: string) => void;
}) {
  const { can, user } = useAuth();
  const [assignedTo, setAssignedTo] = useState(app.assignedTo || "");

  useEffect(() => {
    setAssignedTo(app.assignedTo || "");
  }, [app.assignedTo]);

  const options = staff.filter((u) => u.status === "active");

  async function save() {
    try {
      await applicationsApi.assign(app.id, assignedTo || null);
      setOk("Case assigned");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Assign failed");
    }
  }

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-[12px] font-bold text-slate-800 mb-3">Staff assignment</h2>
      {!can("application:assign") ? (
        <p className="text-[11px] text-slate-400">You do not have assign permission.</p>
      ) : (
        <>
          <label className={labelCls} htmlFor="case-assign-select">
            Assigned officer
          </label>
          <select
            id="case-assign-select"
            className={inputCls}
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            aria-label="Assigned officer"
          >
            <option value="">— unassigned —</option>
            {user && (
              <option value={user.id}>
                {user.fullName || user.email} (me)
              </option>
            )}
            {options
              .filter((u) => u.id !== user?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
          </select>
          {options.length === 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              No other active staff returned — you can still assign to yourself.
            </p>
          )}
          <button
            type="button"
            onClick={() => void save()}
            className="mt-3 px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#F59E0B,#B45309)" }}
          >
            Save assignment
          </button>
        </>
      )}
    </section>
  );
}
