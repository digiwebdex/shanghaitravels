import { useState } from "react";
import {
  Settings, GitBranch, Users, Shield, DollarSign, Receipt, Mail, HardDrive,
  Plus, X, ChevronRight, CheckCircle2, XCircle, AlertCircle, RefreshCw, Download,
  Edit3, Eye, EyeOff, Lock,
} from "lucide-react";
import {
  BRANCHES, SYSTEM_USERS, PERMISSION_GROUPS, ROLES, ROLE_PERMISSIONS,
  CURRENCIES, TAX_CONFIGS, SMTP_CONFIG, BACKUP_RECORDS,
  Branch, SystemUser, CurrencyConfig, BackupRecord, UserRole,
} from "./data";

type SettingsTab = "general" | "branches" | "users" | "roles" | "currency" | "tax" | "smtp" | "backup";

const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key:"general",  label:"General",           icon:Settings    },
  { key:"branches", label:"Branches",          icon:GitBranch   },
  { key:"users",    label:"Users & Roles",     icon:Users       },
  { key:"roles",    label:"RBAC Matrix",       icon:Shield      },
  { key:"currency", label:"Currency",          icon:DollarSign  },
  { key:"tax",      label:"Tax Settings",      icon:Receipt     },
  { key:"smtp",     label:"Email / SMTP",      icon:Mail        },
  { key:"backup",   label:"Backup",            icon:HardDrive   },
];

function Pill({ cls, label }: { cls: string; label: string }) {
  return <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function FieldRow({ label, defaultValue, type="text", span=false }: { label: string; defaultValue: string; type?: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <input type={type} defaultValue={defaultValue}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500" />
    </div>
  );
}

// ── General Settings ──────────────────────────────────────────────────────────
function GeneralTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Company Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <FieldRow label="Company Name"    defaultValue="TravelPro LLC"              />
          <FieldRow label="Trade Licence"   defaultValue="TL-2005-DXB-12345"          />
          <FieldRow label="IATA Code"       defaultValue="9H1234"                     />
          <FieldRow label="Country"         defaultValue="United Arab Emirates"        />
          <FieldRow label="City"            defaultValue="Dubai"                       />
          <FieldRow label="Phone"           defaultValue="+971 4 123 4567"             />
          <FieldRow label="Email"           defaultValue="info@travelpro.ae"           />
          <FieldRow label="Website"         defaultValue="https://www.travelpro.ae"    />
          <FieldRow label="Address Line 1"  defaultValue="Office 1204, Al Moosa Tower 2" span={true} />
          <FieldRow label="Address Line 2"  defaultValue="Sheikh Zayed Road, Dubai, UAE" span={true} />
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">Regional Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Default Language</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
              <option>English (en)</option>
              <option>Arabic (ar)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Timezone</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
              <option>Asia/Dubai (UTC+4)</option>
              <option>Europe/London (UTC+0)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date Format</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
              <option>DD MMM YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Currency Display</label>
            <select className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
              <option>AED (UAE Dirham)</option>
              <option>USD (US Dollar)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">System Preferences</h3>
        {[
          { label:"Enable Two-Factor Authentication (MFA)",  on:true  },
          { label:"Force HTTPS everywhere",                  on:true  },
          { label:"Session timeout after 2 hours",          on:true  },
          { label:"Allow agent self-registration",           on:false },
          { label:"Enable audit logging",                    on:true  },
          { label:"Maintenance mode",                        on:false },
        ].map(pref => (
          <div key={pref.label} className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-300">{pref.label}</span>
            <button className={`relative w-10 h-5 rounded-full transition-colors ${pref.on ? "bg-emerald-600" : "bg-slate-600"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${pref.on ? "left-5.5" : "left-0.5"}`}
                style={{left: pref.on ? "22px" : "2px"}} />
            </button>
          </div>
        ))}
      </div>

      <button className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-sm font-semibold">Save General Settings</button>
    </div>
  );
}

// ── Branches Tab ──────────────────────────────────────────────────────────────
function BranchesTab() {
  const [selected, setSelected] = useState<Branch | null>(null);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Branches", value: BRANCHES.length,                          color:"text-slate-200"  },
              { label:"Active",         value: BRANCHES.filter(b=>b.active).length,      color:"text-emerald-400"},
              { label:"Total Staff",    value: BRANCHES.reduce((s,b)=>s+b.staffCount,0), color:"text-amber-400"  },
            ].map(k => (
              <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5">
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium">
            <Plus size={13} /> Add Branch
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {["Code","Branch Name","Country/City","Manager","Staff","Phone","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map(branch => (
                <tr key={branch.id} onClick={() => setSelected(branch)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === branch.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3 text-xs font-mono font-bold text-slate-300">{branch.code}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{branch.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{branch.country} · {branch.city}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{branch.manager}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{branch.staffCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{branch.phone}</td>
                  <td className="px-4 py-3">
                    {branch.active
                      ? <Pill cls="bg-emerald-500/15 text-emerald-400" label="Active" />
                      : <Pill cls="bg-slate-500/15 text-slate-400" label="Inactive" />}
                  </td>
                  <td className="px-4 py-3"><ChevronRight size={13} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-72 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.code}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="font-semibold text-slate-200">{selected.name}</p>
            {branch_fields(selected).map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200 text-right max-w-40">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.active ? "Deactivate" : "Activate"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
function branch_fields(b: Branch) {
  return [
    { l:"Manager",  v: b.manager   },
    { l:"Staff",    v: String(b.staffCount) },
    { l:"Country",  v: b.country   },
    { l:"City",     v: b.city      },
    { l:"Address",  v: b.address   },
    { l:"Phone",    v: b.phone     },
    { l:"Email",    v: b.email     },
    { l:"Opened",   v: b.openedAt  },
  ];
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  super_admin:  "bg-red-500/20 text-red-400",
  admin:        "bg-amber-500/20 text-amber-400",
  manager:      "bg-blue-500/20 text-blue-400",
  visa_officer: "bg-violet-500/20 text-violet-400",
  sales:        "bg-cyan-500/20 text-cyan-400",
  finance:      "bg-emerald-500/20 text-emerald-400",
  staff:        "bg-slate-500/20 text-slate-300",
  read_only:    "bg-slate-600/20 text-slate-500",
};
const USER_STATUS_COLOR: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400",
  inactive:  "bg-slate-500/15 text-slate-400",
  suspended: "bg-red-500/15 text-red-400",
};

function UsersTab() {
  const [selected, setSelected] = useState<SystemUser | null>(null);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:"Total Users",  value: SYSTEM_USERS.length,                                    color:"text-slate-200" },
              { label:"Active",       value: SYSTEM_USERS.filter(u=>u.status==="active").length,     color:"text-emerald-400"},
              { label:"MFA Enabled",  value: SYSTEM_USERS.filter(u=>u.mfaEnabled).length,           color:"text-blue-400"  },
            ].map(k => (
              <div key={k.label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5">
                <p className="text-xs text-slate-500">{k.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium"><Plus size={13} /> Invite User</button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {["User","Role","Department","Branch","Last Login","MFA","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {SYSTEM_USERS.map(u => (
                <tr key={u.id} onClick={() => setSelected(u)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === u.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                        {u.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{u.name}</p>
                        <p className="text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium capitalize ${ROLE_COLOR[u.role]}`}>
                      {u.role.replace("_"," ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.department}</td>
                  <td className="px-4 py-3 text-slate-400">{u.branch}</td>
                  <td className="px-4 py-3 text-slate-500">{u.lastLogin ?? "Never"}</td>
                  <td className="px-4 py-3 text-center">
                    {u.mfaEnabled
                      ? <Lock size={12} className="text-emerald-400 mx-auto" />
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3"><Pill cls={USER_STATUS_COLOR[u.status]} label={u.status} /></td>
                  <td className="px-4 py-3"><ChevronRight size={12} className="text-slate-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-64 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.name}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <div className="flex items-center justify-center py-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white">
                {selected.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
            </div>
            <Pill cls={ROLE_COLOR[selected.role]} label={selected.role.replace("_"," ")} />
            {[
              { l:"Email",      v: selected.email      },
              { l:"Department", v: selected.department },
              { l:"Branch",     v: selected.branch     },
              { l:"Created",    v: selected.createdAt  },
              { l:"Last Login", v: selected.lastLogin ?? "Never" },
              { l:"MFA",        v: selected.mfaEnabled ? "Enabled" : "Disabled" },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-slate-700 flex gap-2">
            <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Edit</button>
            <button className="flex-1 py-1.5 bg-red-600/70 hover:bg-red-600 text-white rounded text-xs">
              {selected.status === "suspended" ? "Reinstate" : "Suspend"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RBAC Matrix Tab ───────────────────────────────────────────────────────────
function RolesTab() {
  const [matrix, setMatrix] = useState<Record<UserRole, Record<string, boolean>>>(
    JSON.parse(JSON.stringify(ROLE_PERMISSIONS))
  );
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const toggle = (role: UserRole, perm: string) => {
    setMatrix(prev => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Click a checkbox to toggle permission for a role. Roles are columns, permissions are rows.</p>
        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-semibold">Save Changes</button>
      </div>

      <div className="overflow-x-auto">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden min-w-max">
          <table className="text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="text-left px-4 py-3 text-slate-400 font-medium sticky left-0 bg-slate-800/80 min-w-52">Permission</th>
                {ROLES.map(r => (
                  <th key={r.role} onClick={() => setSelectedRole(selectedRole === r.role ? null : r.role)}
                    className={`px-3 py-3 text-center min-w-28 cursor-pointer transition-colors ${selectedRole === r.role ? "bg-amber-500/10 text-amber-400" : "text-slate-300 hover:text-amber-400"}`}>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${ROLE_COLOR[r.role]}`}>
                      {r.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={group.group} className="bg-slate-700/30">
                    <td colSpan={ROLES.length + 1} className="px-4 py-2 text-xs font-semibold text-slate-400 sticky left-0">
                      {group.group}
                    </td>
                  </tr>
                  {group.permissions.map(perm => (
                    <tr key={perm.key} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      <td className="px-4 py-2.5 text-slate-300 sticky left-0 bg-slate-800/60 font-medium">{perm.label}</td>
                      {ROLES.map(r => {
                        const granted = matrix[r.role]?.[perm.key] ?? false;
                        return (
                          <td key={r.role} className={`px-3 py-2.5 text-center ${selectedRole === r.role ? "bg-amber-500/5" : ""}`}>
                            <button onClick={() => r.role !== "super_admin" && toggle(r.role, perm.key)}
                              className={r.role === "super_admin" ? "cursor-not-allowed" : "cursor-pointer"}>
                              {granted
                                ? <CheckCircle2 size={15} className={r.role === "super_admin" ? "text-emerald-600 mx-auto" : "text-emerald-400 mx-auto hover:text-emerald-300"} />
                                : <XCircle size={15} className={r.role === "super_admin" ? "text-slate-700 mx-auto" : "text-slate-700 mx-auto hover:text-slate-500"} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Currency Tab ──────────────────────────────────────────────────────────────
function CurrencyTab() {
  const [selected, setSelected] = useState<CurrencyConfig | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Base currency: <span className="font-bold text-amber-400">AED (UAE Dirham)</span>. Rates updated: <span className="text-slate-300">13 Jan 2025 09:00</span></p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-xs border border-slate-700 bg-slate-800 hover:border-amber-500/50 text-slate-300 px-2.5 py-1.5 rounded-lg"><RefreshCw size={11} /> Fetch Live Rates</button>
            <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-2.5 py-1.5 rounded-lg font-medium"><Plus size={11} /> Add Currency</button>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                {["Code","Currency","Symbol","Rate to AED","Updated","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`border-b border-slate-700/50 cursor-pointer hover:bg-slate-700/30 ${selected?.id === c.id ? "bg-slate-700/40" : ""}`}>
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">{c.code}</td>
                  <td className="px-4 py-3 text-slate-300">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{c.symbol}</td>
                  <td className="px-4 py-3">
                    {c.isBase
                      ? <span className="text-amber-400 font-bold">BASE</span>
                      : <span className="font-mono text-slate-200">{c.exchangeRateToAED.toFixed(4)}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.updatedAt}</td>
                  <td className="px-4 py-3">
                    <Pill cls={c.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"} label={c.status} />
                    {c.isBase && <span className="ml-1 text-xs text-amber-400">Base</span>}
                  </td>
                  <td className="px-4 py-3">
                    {!c.isBase && (
                      <button onClick={e => { e.stopPropagation(); setSelected(c); setShowEdit(true); }}
                        className="text-xs text-amber-400 hover:text-amber-300"><Edit3 size={11} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="w-60 flex-shrink-0 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-200">{selected.code} — {selected.name}</span>
            <button onClick={() => setSelected(null)}><X size={13} className="text-slate-400" /></button>
          </div>
          <div className="p-4 flex-1 space-y-3 text-xs">
            <p className="text-4xl font-bold text-amber-400">{selected.symbol}</p>
            {[
              { l:"Code",    v: selected.code    },
              { l:"Name",    v: selected.name    },
              { l:"Rate",    v: selected.isBase ? "Base Currency" : `1 AED = ${(1/selected.exchangeRateToAED).toFixed(4)} ${selected.code}` },
              { l:"Updated", v: selected.updatedAt },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-slate-500">{r.l}</span>
                <span className="text-slate-200">{r.v}</span>
              </div>
            ))}
            {!selected.isBase && (
              <div>
                <p className="text-slate-500 mb-1">Manual Override Rate</p>
                <input type="number" defaultValue={selected.exchangeRateToAED}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
                <p className="text-slate-600 mt-0.5">AED per 1 {selected.code}</p>
              </div>
            )}
          </div>
          {!selected.isBase && (
            <div className="p-3 border-t border-slate-700 flex gap-2">
              <button className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-xs font-medium">Save Rate</button>
              <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">{selected.status === "active" ? "Disable" : "Enable"}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tax Settings Tab ──────────────────────────────────────────────────────────
function TaxTab() {
  return (
    <div className="max-w-2xl space-y-4">
      {TAX_CONFIGS.map(tax => (
        <div key={tax.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-slate-200">{tax.name}</p>
              <p className="text-xs text-slate-500 capitalize">{tax.type.replace("_"," ")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill cls={tax.active ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"} label={tax.active ? "Active" : "Inactive"} />
              <button className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2 py-1 rounded">Edit</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-700/40 rounded-lg p-3 text-center">
              <p className="text-slate-500 mb-1">Rate</p>
              <p className="text-3xl font-bold text-amber-400">{tax.rate}%</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-slate-500 mb-1">Registration No.</p>
              <p className="font-mono text-slate-200 text-xs">{tax.registrationNo ?? "—"}</p>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-3">
              <p className="text-slate-500 mb-1">Filing Frequency</p>
              <p className="text-slate-200 capitalize">{tax.filingFrequency}</p>
              <p className="text-slate-500 mt-0.5">Effective: {tax.effectiveFrom}</p>
            </div>
          </div>
        </div>
      ))}
      <button className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-2 rounded-lg font-medium"><Plus size={12} /> Add Tax Configuration</button>
    </div>
  );
}

// ── SMTP Tab ──────────────────────────────────────────────────────────────────
function SMTPTab() {
  const [showPwd, setShowPwd] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle"|"testing"|"ok"|"fail">("idle");

  const runTest = () => {
    setTestStatus("testing");
    setTimeout(() => setTestStatus("ok"), 1500);
  };

  return (
    <div className="max-w-xl space-y-4">
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">SMTP Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">SMTP Host</label>
            <input defaultValue={SMTP_CONFIG.host} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Port</label>
            <input type="number" defaultValue={SMTP_CONFIG.port} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Encryption</label>
            <select defaultValue={SMTP_CONFIG.encryption} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500">
              <option>TLS</option><option>SSL</option><option>none</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input defaultValue={SMTP_CONFIG.username} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} defaultValue="TravelPr0!Secret"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pr-8 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
              <button onClick={() => setShowPwd(p=>!p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">From Name</label>
            <input defaultValue={SMTP_CONFIG.fromName} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">From Email</label>
            <input defaultValue={SMTP_CONFIG.fromEmail} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-slate-400 mb-1 block">Reply-To Email</label>
            <input defaultValue={SMTP_CONFIG.replyToEmail} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={`w-8 h-4 rounded-full ${SMTP_CONFIG.testMode ? "bg-amber-600" : "bg-slate-600"}`}>
              <div className="w-3 h-3 rounded-full bg-white mt-0.5 ml-0.5" style={{marginLeft: SMTP_CONFIG.testMode ? "18px" : "2px"}} />
            </div>
            <span className="text-xs text-slate-400">Test Mode (no real emails sent)</span>
          </label>
          <div className="flex gap-2">
            <button onClick={runTest}
              className="flex items-center gap-1 text-xs border border-slate-700 bg-slate-800 hover:border-amber-500/50 text-slate-300 px-3 py-1.5 rounded-lg">
              {testStatus === "testing" ? <RefreshCw size={11} className="animate-spin" /> : null}
              Send Test Email
            </button>
            <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-semibold">Save Config</button>
          </div>
        </div>

        {testStatus === "ok" && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
            <CheckCircle2 size={14} /> Test email sent successfully to sysadmin@travelpro.ae
          </div>
        )}
        {testStatus === "fail" && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            <AlertCircle size={14} /> Connection failed — check host and credentials
          </div>
        )}
      </div>
    </div>
  );
}

// ── Backup Tab ────────────────────────────────────────────────────────────────
const BACKUP_STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-500/15 text-emerald-400",
  failed:    "bg-red-500/15 text-red-400",
  running:   "bg-blue-500/15 text-blue-400",
  scheduled: "bg-amber-500/15 text-amber-400",
};

function BackupTab() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 col-span-2">
          <p className="text-xs font-semibold text-slate-400 mb-3">Backup Schedule</p>
          <div className="space-y-2 text-xs">
            {[
              { label:"Full Backup",        schedule:"Daily at 02:00 AM",  location:"AWS S3 — eu-west-1", retention:"30 days" },
              { label:"Incremental Backup", schedule:"Every 4 hours",      location:"AWS S3 — eu-west-1", retention:"7 days"  },
              { label:"Database Only",      schedule:"Daily at 03:30 AM",  location:"AWS S3 — eu-west-1", retention:"30 days" },
              { label:"Local NAS Mirror",   schedule:"Daily at 04:00 AM",  location:"Local NAS — DXB-HQ", retention:"7 days"  },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4 p-2.5 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-200">{s.label}</p>
                  <p className="text-slate-500">{s.schedule}</p>
                </div>
                <p className="text-slate-400">{s.location}</p>
                <p className="text-slate-500">Retain {s.retention}</p>
                <button className="text-xs text-amber-400 hover:text-amber-300">Edit</button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">Quick Actions</p>
          <div className="space-y-2">
            <button className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-xs font-semibold">Run Full Backup Now</button>
            <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs">Run DB Backup Now</button>
            <button className="w-full flex items-center justify-center gap-1 py-2 border border-slate-700 hover:border-slate-600 text-slate-300 rounded-lg text-xs"><Download size={11} /> Download Latest</button>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 text-xs">
            <p className="text-slate-500 mb-1">Storage Used</p>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-emerald-500 rounded-full" style={{width:"42%"}} />
            </div>
            <p className="text-slate-400">42 GB / 100 GB</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-sm font-semibold text-slate-200">Backup History</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/60">
              {["Type","Scheduled At","Completed At","Size","Location","Retention","Status"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BACKUP_RECORDS.map(bk => (
              <tr key={bk.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="px-4 py-3 text-slate-300 capitalize font-medium">{bk.type}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{bk.scheduledAt}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{bk.completedAt ?? "—"}</td>
                <td className="px-4 py-3 text-slate-300">{bk.size}</td>
                <td className="px-4 py-3 text-slate-400">{bk.location}</td>
                <td className="px-4 py-3 text-slate-500">{bk.retentionDays}d</td>
                <td className="px-4 py-3"><Pill cls={BACKUP_STATUS_COLOR[bk.status]} label={bk.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsModule() {
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-slate-700/60">
        <h1 className="text-lg font-bold text-slate-100">Settings &amp; Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">System configuration, access control, and integrations</p>
      </div>
      <div className="flex-shrink-0 flex gap-0.5 px-6 pt-3 border-b border-slate-700/60 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-t border-b-2 ${tab === t.key ? "text-amber-400 border-amber-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-6">
        {tab === "general"  && <GeneralTab />}
        {tab === "branches" && <BranchesTab />}
        {tab === "users"    && <UsersTab />}
        {tab === "roles"    && <RolesTab />}
        {tab === "currency" && <CurrencyTab />}
        {tab === "tax"      && <TaxTab />}
        {tab === "smtp"     && <SMTPTab />}
        {tab === "backup"   && <BackupTab />}
      </div>
    </div>
  );
}
