/**
 * Shanghai Travels Owner Requirement — Monthly Staff Salary.
 *
 * Reuses the EXISTING HR backend (Employee + SalaryPayment, /employees,
 * /employees/:id/salary, /payroll) behind the EXISTING hr:read/hr:manage
 * permissions. Recording a salary posts to the ledger through the existing
 * finance mechanism (see hr.service.paySalary) — no second accounting engine.
 * net = gross − deduction, both typed; nothing is computed and no tax rule is
 * invented.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Plus } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import {
  PageShell, PageHeader, Surface, SurfaceHeader, StatStrip, KpiCard, SkeletonRows, EmptyPanel,
  btnPrimary, btnGhost, inputCls, labelCls,
} from "@/components/enterprise/Page";
import { ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { DataTable, Pill, type Column } from "@/components/enterprise/DataTable";
import { hrApi, financeApi, type Employee, type SalaryPayment } from "@/lib/services";
import { fmtBDT, toPoisha, fromPoisha } from "@/lib/money";

type Account = { id: string; name: string; type: string };

const thisMonth = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export default function SalaryPage() {
  const { can } = useAuth();
  const mayManage = can("hr:manage");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // pay form
  const [payFor, setPayFor] = useState<Employee | null>(null);
  const [period, setPeriod] = useState(thisMonth());
  const [gross, setGross] = useState("");
  const [deduction, setDeduction] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // add-employee form
  const [showAdd, setShowAdd] = useState(false);
  const [newEmp, setNewEmp] = useState({ fullName: "", designation: "", department: "", phone: "", salary: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [emps, sals] = await Promise.all([hrApi.listEmployees({ limit: 100 }), hrApi.listSalaries({ take: 200 })]);
      setEmployees(emps.data || []);
      setSalaries(sals || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load salary data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    financeApi.accounts().then((r) => setAccounts((r as unknown as Account[]) || [])).catch(() => setAccounts([]));
  }, []);

  const net = useMemo(() => {
    const g = gross.trim() === "" ? null : toPoisha(Number(gross));
    const d = deduction.trim() === "" ? 0 : toPoisha(Number(deduction));
    if (g == null || !Number.isFinite(g)) return null;
    return Math.max(0, g - (Number.isFinite(d) ? d : 0));
  }, [gross, deduction]);

  const monthTotal = useMemo(
    () => salaries.filter((s) => s.period === thisMonth()).reduce((a, s) => a + s.amount, 0),
    [salaries],
  );

  function openPay(emp: Employee) {
    setPayFor(emp);
    setPeriod(thisMonth());
    setGross(emp.salary ? String(fromPoisha(emp.salary)) : "");
    setDeduction("");
    setAccountId("");
    setNote("");
    setError(""); setOk("");
  }

  async function submitPay() {
    if (!payFor) return;
    setBusy(true); setError(""); setOk("");
    try {
      await hrApi.paySalary(payFor.id, {
        period,
        amount: toPoisha(Number(gross)),
        deduction: deduction.trim() === "" ? 0 : toPoisha(Number(deduction)),
        accountId: accountId || undefined,
        note: note.trim() || undefined,
      });
      setOk(`Salary for ${payFor.fullName} (${period}) recorded${accountId ? " and posted to the account" : ""}.`);
      setPayFor(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record the salary");
    } finally {
      setBusy(false);
    }
  }

  async function addEmployee() {
    setBusy(true); setError(""); setOk("");
    try {
      await hrApi.createEmployee({
        fullName: newEmp.fullName.trim(),
        designation: newEmp.designation.trim() || undefined,
        department: newEmp.department.trim() || undefined,
        phone: newEmp.phone.trim() || undefined,
        salary: newEmp.salary.trim() ? toPoisha(Number(newEmp.salary)) : 0,
      });
      setOk(`Employee ${newEmp.fullName} added.`);
      setShowAdd(false);
      setNewEmp({ fullName: "", designation: "", department: "", phone: "", salary: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the employee");
    } finally {
      setBusy(false);
    }
  }

  const empCols: Column<Employee>[] = [
    { key: "code", header: "Code", className: "w-24 font-mono text-[11px]", render: (e) => e.code },
    { key: "name", header: "Name", className: "min-w-[150px] font-semibold", render: (e) => e.fullName },
    { key: "designation", header: "Designation", className: "min-w-[120px]", render: (e) => e.designation || "—" },
    { key: "department", header: "Department", className: "min-w-[110px]", render: (e) => e.department || "—" },
    { key: "salary", header: "Monthly Salary", className: "w-32 text-right", render: (e) => fmtBDT(e.salary) },
    {
      key: "act", header: "", className: "w-28 text-right",
      render: (e) => mayManage ? <button type="button" className={`${btnPrimary} !px-2.5 !py-1 text-[11px]`} onClick={() => openPay(e)}>Pay salary</button> : null,
    },
  ];

  const salCols: Column<SalaryPayment>[] = [
    { key: "period", header: "Month", className: "w-24 font-mono text-[11px]", render: (s) => s.period },
    { key: "emp", header: "Employee", className: "min-w-[150px]", render: (s) => <span className="font-semibold">{s.employee?.fullName || "—"}</span> },
    { key: "dept", header: "Department", className: "min-w-[110px]", render: (s) => s.employee?.department || "—" },
    { key: "net", header: "Net Paid", className: "w-28 text-right font-semibold", render: (s) => fmtBDT(s.amount) },
    { key: "acct", header: "Account", className: "w-40", render: (s) => s.accountId ? <Pill value="posted" tone="green" /> : <Pill value="record only" tone="amber" /> },
    { key: "paidAt", header: "Paid", className: "w-28", render: (s) => new Date(s.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "note", header: "Note", className: "min-w-[120px]", render: (s) => <span className="text-[11px] text-[var(--muted-foreground)]">{s.note || "—"}</span> },
  ];

  return (
    <PageShell wide>
      <PageHeader
        title="Staff Salary"
        subtitle="Monthly staff salary — recorded and posted to Finance. Shanghai Travels Owner Requirement."
        icon={Banknote}
        breadcrumb={[{ label: "Finance", to: "/finance/dashboard" }, { label: "Salary" }]}
        actions={mayManage ? <button type="button" className={btnPrimary} onClick={() => setShowAdd((v) => !v)}><Plus size={13} className="mr-1 inline" /> Add employee</button> : undefined}
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={ok} />

      <StatStrip>
        <KpiCard label="Employees" value={String(employees.length)} />
        <KpiCard label={`Paid this month (${thisMonth()})`} value={fmtBDT(monthTotal)} />
        <KpiCard label="Salary records" value={String(salaries.length)} />
      </StatStrip>

      {showAdd && mayManage && (
        <Surface>
          <SurfaceHeader title="Add employee" />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
            <div><label className={labelCls} htmlFor="ne-name">Full name *</label><input id="ne-name" className={inputCls} value={newEmp.fullName} onChange={(e) => setNewEmp((s) => ({ ...s, fullName: e.target.value }))} /></div>
            <div><label className={labelCls} htmlFor="ne-desig">Designation</label><input id="ne-desig" className={inputCls} value={newEmp.designation} onChange={(e) => setNewEmp((s) => ({ ...s, designation: e.target.value }))} /></div>
            <div><label className={labelCls} htmlFor="ne-dept">Department</label><input id="ne-dept" className={inputCls} value={newEmp.department} onChange={(e) => setNewEmp((s) => ({ ...s, department: e.target.value }))} /></div>
            <div><label className={labelCls} htmlFor="ne-phone">Phone</label><input id="ne-phone" className={inputCls} value={newEmp.phone} onChange={(e) => setNewEmp((s) => ({ ...s, phone: e.target.value }))} /></div>
            <div><label className={labelCls} htmlFor="ne-sal">Monthly salary (BDT)</label><input id="ne-sal" type="number" min="0" className={inputCls} value={newEmp.salary} onChange={(e) => setNewEmp((s) => ({ ...s, salary: e.target.value }))} /></div>
            <div className="flex items-end gap-2">
              <button type="button" className={btnPrimary} disabled={busy || newEmp.fullName.trim().length < 2} onClick={addEmployee}>Save</button>
              <button type="button" className={btnGhost} onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </Surface>
      )}

      {payFor && (
        <Surface>
          <SurfaceHeader title={`Pay salary — ${payFor.fullName} (${payFor.code})`} hint="Net = gross − deduction. Choose a receive account to post it to Finance." />
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
            <div><label className={labelCls} htmlFor="sp-period">Salary month *</label><input id="sp-period" type="month" className={inputCls} value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
            <div><label className={labelCls} htmlFor="sp-gross">Gross salary (BDT) *</label><input id="sp-gross" type="number" min="0" step="0.01" className={inputCls} value={gross} onChange={(e) => setGross(e.target.value)} /></div>
            <div><label className={labelCls} htmlFor="sp-ded">Deduction (BDT)</label><input id="sp-ded" type="number" min="0" step="0.01" className={inputCls} value={deduction} onChange={(e) => setDeduction(e.target.value)} /></div>
            <div>
              <label className={labelCls} htmlFor="sp-acct">Payment account</label>
              <select id="sp-acct" className={inputCls} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">— Record only (no ledger posting) —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.type}</option>)}
              </select>
            </div>
            <div><label className={labelCls} htmlFor="sp-note">Note</label><input id="sp-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <div>
              <span className={labelCls}>Net salary</span>
              <div className="rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] font-bold text-emerald-600">{net == null ? "—" : fmtBDT(net)}</div>
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button type="button" className={btnPrimary} disabled={busy || net == null || net <= 0} onClick={submitPay}>{busy ? "Saving…" : "Record salary"}</button>
            <button type="button" className={btnGhost} onClick={() => setPayFor(null)}>Cancel</button>
          </div>
        </Surface>
      )}

      <Surface>
        <SurfaceHeader title="Employees" hint={`${employees.length} on the roster`} />
        {loading ? <SkeletonRows /> : employees.length === 0 ? (
          <EmptyPanel title="No employees yet." hint={mayManage ? "Use 'Add employee' to build the staff roster." : "Ask an administrator to add staff."} />
        ) : <DataTable columns={empCols} rows={employees} rowKey={(e) => e.id} />}
      </Surface>

      <Surface>
        <SurfaceHeader title="Salary Report" hint="Every recorded salary; 'posted' means it hit the account ledger." />
        {loading ? <SkeletonRows /> : salaries.length === 0 ? (
          <EmptyPanel title="No salary records yet." hint="Recorded salaries appear here and in Finance." />
        ) : <DataTable columns={salCols} rows={salaries} rowKey={(s) => s.id} />}
      </Surface>
    </PageShell>
  );
}
