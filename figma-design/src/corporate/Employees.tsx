import { useState } from "react";
import {
  Search, Plus, ChevronUp, ChevronDown,
  Edit2, Trash2, Mail, X,
} from "lucide-react";
import { EMPLOYEES, Employee, fmtAED } from "./data";

const DEPTS = ["All","Executive","Sales","Marketing","Finance","Operations","IT","HR"];
const ROLE_CFG = {
  admin:    { label: "Admin",    color: "text-purple-700", bg: "bg-purple-100" },
  manager:  { label: "Manager", color: "text-blue-700",   bg: "bg-blue-100"   },
  employee: { label: "Employee",color: "text-slate-600",  bg: "bg-slate-100"  },
};
type SK = "name" | "department" | "applications" | "totalSpend";

export default function Employees() {
  const [search,       setSearch]       = useState("");
  const [dept,         setDept]         = useState("All");
  const [statusF,      setStatusF]      = useState<"all"|"active"|"inactive">("all");
  const [sortKey,      setSortKey]      = useState<SK>("name");
  const [sortDir,      setSortDir]      = useState<1|-1>(1);
  const [selected,     setSelected]     = useState<string[]>([]);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Partial<Employee>>({});

  const handleSort = (k: SK) => { if (sortKey === k) setSortDir(d => d === 1 ? -1 : 1); else { setSortKey(k); setSortDir(1); } };
  const toggle     = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const rows = EMPLOYEES
    .filter(e =>
      (dept === "All" || e.department === dept) &&
      (statusF === "all" || e.status === statusF) &&
      (e.name.toLowerCase().includes(search.toLowerCase()) ||
       e.email.toLowerCase().includes(search.toLowerCase()) ||
       e.employeeId.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      return typeof av === "number"
        ? (av - (bv as number)) * sortDir
        : String(av).localeCompare(String(bv)) * sortDir;
    });

  const Th = ({ k, label }: { k: SK; label: string }) => (
    <th onClick={() => handleSort(k)} className="px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] cursor-pointer select-none whitespace-nowrap">
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k
          ? sortDir === 1 ? <ChevronUp size={10} className="text-[#F97316]" /> : <ChevronDown size={10} className="text-[#F97316]" />
          : <ChevronDown size={10} className="text-[#D1D5DB]" />}
      </span>
    </th>
  );

  return (
    <div className="p-6 space-y-4 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#0B1829] text-[20px] font-bold">Employee Management</h1>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            {EMPLOYEES.length} employees · {EMPLOYEES.filter(e => e.status === "active").length} active
          </p>
        </div>
        <button onClick={() => { setEditing({ role: "employee", status: "active", department: "Sales" }); setModalOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-semibold hover:bg-[#162840] transition-colors">
          <Plus size={13} /> Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] focus:outline-none focus:border-[#0B1829] placeholder:text-[#94A3B8]"
            placeholder="Name, email or employee ID…"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DEPTS.map(d => (
            <button key={d} onClick={() => setDept(d)} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${dept === d ? "bg-[#0B1829] text-white" : "bg-[#EEF0F4] text-[#64748B] hover:bg-[#E2E5EA]"}`}>{d}</button>
          ))}
        </div>
        <select value={statusF} onChange={e => setStatusF(e.target.value as "all"|"active"|"inactive")} className="text-[11px] border border-[#E2E5EA] rounded-lg px-2.5 py-1.5 bg-[#F8FAFC] appearance-none focus:outline-none text-[#64748B]">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span className="text-[11px] text-[#94A3B8] ml-auto">{rows.length} result{rows.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Bulk bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0B1829] rounded-xl">
          <span className="text-white text-[12px] font-semibold">{selected.length} selected</span>
          <div className="flex gap-2 ml-auto">
            {["Deactivate","Export","Delete"].map((l, i) => (
              <button key={l} className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors ${i === 2 ? "text-red-400" : "text-white/70"}`}>{l}</button>
            ))}
            <button onClick={() => setSelected([])} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/50"><X size={12} /></button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E2E5EA] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E5EA]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="accent-[#F97316]" checked={selected.length === rows.length && rows.length > 0} onChange={() => setSelected(selected.length === rows.length ? [] : rows.map(e => e.id))} />
                </th>
                <Th k="name"         label="Employee"        />
                <Th k="department"   label="Department"      />
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">Role</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">Status</th>
                <Th k="applications" label="Applications"    />
                <Th k="totalSpend"   label="Total Spend"     />
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em]">Joined</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F9]">
              {rows.map(emp => {
                const rc = ROLE_CFG[emp.role];
                return (
                  <tr key={emp.id} className={`hover:bg-[#FAFBFC] transition-colors ${selected.includes(emp.id) ? "bg-[#F0F4FF]" : ""}`}>
                    <td className="px-4 py-3.5 w-10"><input type="checkbox" className="accent-[#F97316]" checked={selected.includes(emp.id)} onChange={() => toggle(emp.id)} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-[#0B1829] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#0B1829]">{emp.name}</p>
                          <p className="text-[10px] text-[#94A3B8]">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12px] text-[#334155]">{emp.department}</p>
                      <p className="text-[10px] text-[#94A3B8]">{emp.employeeId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rc.bg} ${rc.color}`}>{rc.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${emp.status === "active" ? "bg-emerald-400" : "bg-[#94A3B8]"}`} />
                        <span className="text-[12px] text-[#334155] capitalize">{emp.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-semibold text-[#0B1829]">{emp.applications}</td>
                    <td className="px-4 py-3.5 text-[12px] font-mono font-semibold text-[#0B1829]">{fmtAED(emp.totalSpend)}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#94A3B8]">{emp.joinDate}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => { setEditing(emp); setModalOpen(true); }} className="p-1.5 rounded-md hover:bg-[#EEF0F4] text-[#94A3B8] hover:text-[#0B1829] transition-colors"><Edit2 size={12} /></button>
                        <button className="p-1.5 rounded-md hover:bg-[#EEF0F4] text-[#94A3B8] hover:text-[#0B1829] transition-colors"><Mail size={12} /></button>
                        <button className="p-1.5 rounded-md hover:bg-red-50 text-[#94A3B8] hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E5EA] bg-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8]">Showing {rows.length} of {EMPLOYEES.length} employees</p>
          <div className="flex gap-1">
            {[1, 2].map(p => (
              <button key={p} className={`size-7 rounded-lg text-[11px] font-semibold ${p === 1 ? "bg-[#0B1829] text-white" : "text-[#94A3B8] hover:bg-[#EEF0F4]"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl border border-[#E2E5EA] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E5EA]">
              <h3 className="text-[#0B1829] font-bold">{editing.id ? "Edit Employee" : "Add Employee"}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-[#EEF0F4] text-[#94A3B8]"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Full Name",   key: "name",        placeholder: "Ahmad Al-Rashidi" },
                { label: "Email",       key: "email",       placeholder: "ahmad@company.ae" },
                { label: "Employee ID", key: "employeeId",  placeholder: "ACME-013" },
                { label: "Nationality", key: "nationality", placeholder: "UAE" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-1.5">{f.label}</label>
                  <input defaultValue={(editing as any)[f.key] ?? ""} placeholder={f.placeholder} className="w-full px-3 py-2.5 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] focus:outline-none focus:border-[#0B1829]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-1.5">Department</label>
                  <select defaultValue={editing.department} className="w-full px-3 py-2.5 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] appearance-none focus:outline-none">
                    {DEPTS.slice(1).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-[0.08em] mb-1.5">Role</label>
                  <select defaultValue={editing.role} className="w-full px-3 py-2.5 text-[12px] border border-[#E2E5EA] rounded-lg bg-[#F8FAFC] appearance-none focus:outline-none">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-[#E2E5EA] text-[12px] font-semibold text-[#64748B] hover:bg-[#EEF0F4] transition-colors">Cancel</button>
              <button onClick={() => setModalOpen(false)} className="px-5 py-2 rounded-lg bg-[#0B1829] text-white text-[12px] font-bold hover:bg-[#162840] transition-colors">{editing.id ? "Save Changes" : "Add Employee"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
