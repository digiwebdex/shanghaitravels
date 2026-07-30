import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Check, ChevronRight, FileText, Scan, ClipboardList, Upload,
  CreditCard, Send, Loader2, Calendar, CheckCircle2, Package,
  AlertCircle, Camera, RefreshCw, Lock
} from "lucide-react";
import { WORKFLOW_STAGES } from "./data";

const STAGE_ICONS = [FileText, Scan, ClipboardList, Upload, CreditCard, Send, Loader2, Calendar, CheckCircle2, Package];

const SERVICES = ["Visa Application", "Flight Booking", "Hotel Booking", "Tour Package", "Hajj Package", "Umrah Package"];
const COUNTRIES = ["United Kingdom", "Schengen Area", "United States", "Canada", "Australia", "Saudi Arabia", "Turkey", "Maldives", "Indonesia", "Other"];

type S0 = { service: string; destination: string; travelDate: string; returnDate: string; adults: string; children: string; purpose: string };
type S1 = { passportImg: string | null; extractedName: string; extractedNum: string; extractedExpiry: string; extractedNat: string; confirmed: boolean };
type S2 = { checked: Record<string, boolean> };
type S3 = { uploaded: Record<string, boolean> };
type S4 = { method: string; paid: boolean };
type S5 = { agreed: boolean };

const CHECKLIST_BY_SERVICE: Record<string, string[]> = {
  "Visa Application":  ["Valid Passport (6+ months)", "Passport Photos (2x)", "Bank Statements (3 months)", "Employment Letter", "Hotel Bookings", "Return Flights", "Travel Insurance"],
  "Flight Booking":    ["Valid Passport", "Payment Method"],
  "Hotel Booking":     ["Valid Passport", "Payment Method", "Arrival Confirmation"],
  "Tour Package":      ["Valid Passport (6+ months)", "Passport Photos (2x)", "Travel Insurance", "Medical Certificate (if required)"],
  "Hajj Package":      ["Valid Passport (6+ months)", "Meningitis Vaccination", "Mahram Documentation", "Passport Photos (4x)", "Medical Certificate"],
  "Umrah Package":     ["Valid Passport (6+ months)", "Passport Photos (2x)", "Vaccination Certificate", "Mahram Documentation"],
};

export default function Apply() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [s0, setS0] = useState<S0>({ service: "", destination: "", travelDate: "", returnDate: "", adults: "1", children: "0", purpose: "" });
  const [s1, setS1] = useState<S1>({ passportImg: null, extractedName: "Ahmad Al-Rashidi", extractedNum: "A12345678", extractedExpiry: "2029-08-15", extractedNat: "UAE", confirmed: false });
  const [s2, setS2] = useState<S2>({ checked: {} });
  const [s3, setS3] = useState<S3>({ uploaded: {} });
  const [s4, setS4] = useState<S4>({ method: "card", paid: false });
  const [s5, setS5] = useState<S5>({ agreed: false });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const checklist = CHECKLIST_BY_SERVICE[s0.service] ?? CHECKLIST_BY_SERVICE["Visa Application"];
  const allChecked = checklist.every(c => s2.checked[c]);
  const allUploaded = checklist.every(c => s3.uploaded[c]);

  const canAdvance = [
    s0.service && s0.destination && s0.travelDate,
    s1.confirmed,
    allChecked,
    allUploaded,
    s4.paid,
    s5.agreed,
  ][step];

  const handleOcrUpload = () => {
    setOcrLoading(true);
    setTimeout(() => { setS1(s => ({ ...s, passportImg: "uploaded", confirmed: false })); setOcrLoading(false); }, 1500);
  };

  const handlePay = () => {
    setPayLoading(true);
    setTimeout(() => { setS4(s => ({ ...s, paid: true })); setPayLoading(false); }, 1800);
  };

  const handleSubmit = () => {
    setTimeout(() => navigate("/portal/track/app-001"), 800);
  };

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <div className="mb-8">
        <h1 className="text-foreground text-xl font-bold mb-1">New Application</h1>
        <p className="text-sm text-muted-foreground">Complete all steps to submit your application. Your progress is saved automatically.</p>
      </div>

      {/* 10-stage stepper */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 overflow-x-auto">
        <div className="flex items-start gap-0 min-w-[700px]">
          {WORKFLOW_STAGES.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const future = i > 5; // post-submission stages
            const Icon = STAGE_ICONS[i];
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all text-[11px] font-bold flex-shrink-0
                    ${done ? "bg-green-500 border-green-500 text-white" : active ? "bg-primary border-primary text-white" : future ? "bg-background border-border text-muted-foreground/40" : "bg-background border-border text-muted-foreground"}`}>
                    {done ? <Check size={13} /> : <Icon size={12} />}
                  </div>
                  <span className={`text-[9px] font-semibold text-center leading-tight max-w-[56px] ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground/50"}`}>{s.short}</span>
                </div>
                {i < 9 && <div className={`h-px flex-1 mb-5 mx-1 ${i < step ? "bg-green-400" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="flex items-center gap-3 mb-7 pb-5 border-b border-border">
          {(() => { const Icon = STAGE_ICONS[step]; return <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon size={18} className="text-primary" /></div>; })()}
          <div>
            <p className="text-xs text-muted-foreground">Step {step + 1} of 6</p>
            <h2 className="text-foreground font-bold">{WORKFLOW_STAGES[step].label}</h2>
          </div>
        </div>

        {/* Step 0: Inquiry */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Service *</label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(s => (
                  <button key={s} onClick={() => setS0(f => ({ ...f, service: s }))} className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${s0.service === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Destination *</label>
                <select className={selectCls} value={s0.destination} onChange={e => setS0(f => ({ ...f, destination: e.target.value }))}>
                  <option value="">Select destination</option>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Purpose of Travel</label>
                <select className={selectCls} value={s0.purpose} onChange={e => setS0(f => ({ ...f, purpose: e.target.value }))}>
                  <option value="">Select purpose</option>
                  {["Tourism", "Business", "Family Visit", "Medical", "Education", "Transit"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Departure Date *</label>
                <input type="date" className={inputCls} value={s0.travelDate} onChange={e => setS0(f => ({ ...f, travelDate: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Return Date</label>
                <input type="date" className={inputCls} value={s0.returnDate} onChange={e => setS0(f => ({ ...f, returnDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Adults</label>
                <select className={selectCls} value={s0.adults} onChange={e => setS0(f => ({ ...f, adults: e.target.value }))}>
                  {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Children (under 18)</label>
                <select className={selectCls} value={s0.children} onChange={e => setS0(f => ({ ...f, children: e.target.value }))}>
                  {[0,1,2,3,4].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Passport OCR */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
              <Scan size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">Upload your passport photo page. Our system will automatically extract your details — please verify before continuing.</p>
            </div>
            {!s1.passportImg ? (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all group">
                {ocrLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <p className="text-sm font-medium text-foreground">Scanning passport…</p>
                  </div>
                ) : (
                  <>
                    <Camera size={32} className="text-muted-foreground mx-auto mb-3 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-semibold text-foreground mb-1">Upload passport photo page</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG or PDF · Max 5MB</p>
                    <button onClick={e => { e.stopPropagation(); handleOcrUpload(); }} className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors">
                      Choose File
                    </button>
                  </>
                )}
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleOcrUpload} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-600" /><span className="text-xs font-semibold text-green-700">Passport scanned successfully</span></div>
                  <button onClick={() => setS1(s => ({ ...s, passportImg: null, confirmed: false }))} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RefreshCw size={11} /> Re-upload</button>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Information — Please Verify</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Full Name",          key: "extractedName",   val: s1.extractedName },
                    { label: "Passport Number",    key: "extractedNum",    val: s1.extractedNum },
                    { label: "Expiry Date",        key: "extractedExpiry", val: s1.extractedExpiry },
                    { label: "Nationality",        key: "extractedNat",    val: s1.extractedNat },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input className={inputCls} value={f.val} onChange={e => setS1(s => ({ ...s, [f.key]: e.target.value } as S1))} />
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted rounded-xl">
                  <input type="checkbox" className="accent-accent" checked={s1.confirmed} onChange={e => setS1(s => ({ ...s, confirmed: e.target.checked }))} />
                  <span className="text-sm font-medium text-foreground">I confirm the extracted passport details are correct</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Checklist */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Confirm you have all the following documents ready to upload. You'll need them in the next step.</p>
            <div className="space-y-2">
              {checklist.map(doc => (
                <label key={doc} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${s2.checked[doc] ? "border-green-300 bg-green-50" : "border-border hover:border-primary/30"}`}>
                  <input type="checkbox" className="accent-green-600 size-4" checked={!!s2.checked[doc]} onChange={e => setS2(s => ({ checked: { ...s.checked, [doc]: e.target.checked } }))} />
                  <div className={`size-5 rounded flex items-center justify-center flex-shrink-0 ${s2.checked[doc] ? "bg-green-500" : "bg-muted border border-border"}`}>
                    {s2.checked[doc] && <Check size={11} className="text-white" />}
                  </div>
                  <span className={`text-sm font-medium ${s2.checked[doc] ? "text-green-800" : "text-foreground"}`}>{doc}</span>
                </label>
              ))}
            </div>
            {!allChecked && <p className="text-xs text-orange-600 flex items-center gap-1.5"><AlertCircle size={12} /> Please confirm all documents before proceeding.</p>}
          </div>
        )}

        {/* Step 3: Document Upload */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Upload each document below. Accepted formats: PDF, JPG, PNG. Max 10MB per file.</p>
            {checklist.map(doc => (
              <div key={doc} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background">
                <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s3.uploaded[doc] ? "bg-green-100" : "bg-muted"}`}>
                  {s3.uploaded[doc] ? <CheckCircle2 size={15} className="text-green-600" /> : <FileText size={15} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{doc}</p>
                  <p className="text-xs text-muted-foreground">{s3.uploaded[doc] ? "Uploaded · Pending review" : "Not uploaded"}</p>
                </div>
                <button onClick={() => setS3(s => ({ uploaded: { ...s.uploaded, [doc]: true } }))} disabled={!!s3.uploaded[doc]} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${s3.uploaded[doc] ? "bg-green-100 text-green-700" : "bg-primary text-white hover:bg-primary/90"}`}>
                  {s3.uploaded[doc] ? "Uploaded" : "Upload"}
                </button>
              </div>
            ))}
            <div className="mt-2 p-3 bg-muted rounded-xl flex gap-2">
              <AlertCircle size={13} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Documents are reviewed within 2–4 business hours. Rejected documents will be flagged with the reason and you'll be notified by email.</p>
            </div>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="bg-muted rounded-xl p-5 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fee Breakdown</p>
              {[
                { label: "Government visa fee × 2", amount: "AED 640" },
                { label: "TravelOS service fee",    amount: "AED 300" },
                { label: "Document handling",       amount: "AED 80" },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm"><span className="text-muted-foreground">{r.label}</span><span className="font-medium text-foreground">{r.amount}</span></div>
              ))}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2.5">
                <span>Total Due</span><span className="text-lg text-accent">AED 1,020</span>
              </div>
            </div>
            {!s4.paid ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {(["card", "bank", "cash"] as const).map(m => (
                    <button key={m} onClick={() => setS4(s => ({ ...s, method: m }))} className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition-all ${s4.method === m ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                      {m === "card" ? "Card" : m === "bank" ? "Bank Transfer" : "Cash at Office"}
                    </button>
                  ))}
                </div>
                {s4.method === "card" && (
                  <div className="space-y-3">
                    <input className={inputCls} placeholder="Card number" />
                    <div className="grid grid-cols-2 gap-3"><input className={inputCls} placeholder="MM/YY" /><input type="password" className={inputCls} placeholder="CVV" /></div>
                    <input className={inputCls} placeholder="Cardholder name" />
                  </div>
                )}
                {s4.method === "bank" && (
                  <div className="p-4 bg-muted rounded-xl text-xs space-y-2">
                    <p className="font-semibold text-foreground">Emirates NBD</p>
                    <p className="text-muted-foreground">Account: Shanghai Travels LLC</p>
                    <p className="font-mono text-foreground">IBAN: AE07 0260 0010 2690 5063 4</p>
                    <p className="text-muted-foreground">Reference: <span className="font-bold text-accent">TRV-NEW-{Date.now().toString().slice(-5)}</span></p>
                  </div>
                )}
                <button onClick={handlePay} disabled={payLoading} className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {payLoading ? <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing…</> : <><Lock size={14} /> Pay AED 1,020</>}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800">Payment Successful</p>
                  <p className="text-xs text-green-700">AED 1,020 received · Receipt sent to your email</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Submission */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="bg-muted rounded-xl p-5 space-y-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Application Summary</p>
              {[
                ["Service",     s0.service || "Visa Application"],
                ["Destination", s0.destination || "United Kingdom"],
                ["Travel Date", s0.travelDate || "—"],
                ["Travellers",  `${s0.adults} adult(s), ${s0.children} child(ren)`],
                ["Passport",    s1.extractedNum],
                ["Documents",   `${checklist.length} documents uploaded`],
                ["Payment",     "AED 1,020 · Paid"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-[110px]">{k}</span>
                  <span className="text-foreground font-semibold text-right">{v}</span>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-muted rounded-xl">
              <input type="checkbox" className="mt-0.5 accent-accent" checked={s5.agreed} onChange={e => setS5({ agreed: e.target.checked })} />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I confirm all information provided is accurate and complete. I understand that submitting false documents may result in visa refusal and/or legal consequences. I consent to processing of my data by Shanghai Travels LLC and the relevant embassy/consulate.
              </span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40">
            Back
          </button>
          <button disabled={!canAdvance} onClick={() => step < 5 ? setStep(s => s + 1) : handleSubmit()} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 5 ? "Submit Application" : "Continue"} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
