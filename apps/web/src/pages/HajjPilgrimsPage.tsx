import { FormEvent, useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  PageHeader,
  PageShell,
  inputCls,
  labelCls,
} from "@/components/enterprise/Page";
import { hajjPilgrimsApi } from "@/lib/services";
import { ApiError, listOf } from "@/lib/api";
import type { HajjPilgrim } from "@/lib/types";
import { Can } from "@/auth/Can";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/Feedback";
import { InlineSpinner } from "@/components/FullPageSpinner";
import { HajjModuleNav } from "@/components/hajj/HajjModuleNav";
import { PASSPORT_STATUSES, VISA_STATUSES } from "@/lib/hajj";
import { ScanDocumentPanel, ocrFullName } from "@/components/ocr/ScanDocumentPanel";

export default function HajjPilgrimsPage() {
  const [rows, setRows] = useState<HajjPilgrim[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [nationality, setNationality] = useState("Bangladeshi");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [mahramName, setMahramName] = useState("");
  const [mahramRelation, setMahramRelation] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [visaStatus, setVisaStatus] = useState("not_applied");
  const [passportStatus, setPassportStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(listOf<HajjPilgrim>(await hajjPilgrimsApi.list({ q: q || undefined, limit: 200 })));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load pilgrims");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !fullName.trim()) {
      setError("Code and full name are required");
      return;
    }
    setError("");
    setOk("");
    try {
      await hajjPilgrimsApi.create({
        code: code.trim(),
        fullName: fullName.trim(),
        passportNo: passportNo.trim() || undefined,
        nationality: nationality.trim() || undefined,
        gender: gender || undefined,
        dob: dob.trim() || undefined,
        phone: phone.trim() || undefined,
        mahramName: mahramName.trim() || undefined,
        mahramRelation: mahramRelation.trim() || undefined,
        healthNotes: healthNotes.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        visaStatus,
        passportStatus,
        notes: notes.trim() || undefined,
      });
      setOk("Pilgrim profile created");
      setCode("");
      setFullName("");
      setPassportNo("");
      setPhone("");
      setMahramName("");
      setHealthNotes("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  }

  return (
    <PageShell wide>
      <PageHeader
        icon={Users}
        title="Pilgrim profiles"
        subtitle="Passport & visa status, mahram relationships, health notes, emergency contacts."
        breadcrumb={[{ label: "Hajj & Umrah", to: "/hajj" }, { label: "Pilgrim profiles" }]}
      />
      <HajjModuleNav />
        <ErrorBanner message={error} />
        <SuccessBanner message={ok} />

        <Can perm="settings:manage">
          <form onSubmit={(e) => void create(e)} className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Add pilgrim</p>
              <ScanDocumentPanel
                defaultDocType="passport"
                savePassportOnConfirm={false}
                title="Scan pilgrim passport"
                onAutofill={(fields) => {
                  const name = ocrFullName(fields);
                  if (name) setFullName(name);
                  if (fields.passportNo) setPassportNo(fields.passportNo);
                  if (fields.nationality) setNationality(fields.nationality);
                  if (fields.gender === "M" || fields.gender === "F") setGender(fields.gender);
                  if (fields.dateOfBirth) setDob(fields.dateOfBirth);
                  if (fields.passportNo) setPassportStatus("received");
                }}
              />
            </div>
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Full name *</label>
              <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Passport no</label>
              <input className={inputCls} value={passportNo} onChange={(e) => setPassportNo(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Passport status</label>
              <select className={inputCls} value={passportStatus} onChange={(e) => setPassportStatus(e.target.value)}>
                {PASSPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Visa status</label>
              <select className={inputCls} value={visaStatus} onChange={(e) => setVisaStatus(e.target.value)}>
                {VISA_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input className={inputCls} value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">—</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>DOB</label>
              <input className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="YYYY-MM-DD" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Mahram</label>
              <input className={inputCls} value={mahramName} onChange={(e) => setMahramName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Mahram relation</label>
              <input className={inputCls} value={mahramRelation} onChange={(e) => setMahramRelation(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Emergency contact</label>
              <input className={inputCls} value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Emergency phone</label>
              <input className={inputCls} value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Health notes</label>
              <textarea className={inputCls} rows={2} value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelCls}>Notes</label>
              <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="sm:col-span-3">
              <button type="submit" className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white" style={{ background: "linear-gradient(135deg,#F97316,#C2410C)" }}>
                Save pilgrim
              </button>
            </div>
          </form>
        </Can>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
            <input
              className="flex-1 max-w-sm px-3 py-2 border border-slate-200 rounded-lg text-[11px]"
              placeholder="Search pilgrims…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              aria-label="Search pilgrims"
            />
            <button type="button" onClick={() => void load()} className="px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-semibold">
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No pilgrims" hint="Add pilgrim profiles for bookings and manifests." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2 font-bold">Code</th>
                    <th className="px-4 py-2 font-bold">Name</th>
                    <th className="px-4 py-2 font-bold">Passport</th>
                    <th className="px-4 py-2 font-bold">Visa</th>
                    <th className="px-4 py-2 font-bold">Mahram</th>
                    <th className="px-4 py-2 font-bold">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 text-[11px]">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.code}</td>
                      <td className="px-4 py-2.5 text-slate-700">{p.fullName}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {p.passportNo || "—"} ({p.passportStatus || "—"})
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p.visaStatus || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.mahramName || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </PageShell>
  );
}
