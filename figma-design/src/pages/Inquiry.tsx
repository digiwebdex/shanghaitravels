import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ChevronRight, FileText, User, MessageSquare, ClipboardList, Check, Phone } from "lucide-react";
import { HOTLINE, OPENING_HOURS, telHref } from "../company";

const STEPS = [
  { label: "Service Details",  icon: FileText },
  { label: "Personal Info",    icon: User },
  { label: "Additional Info",  icon: MessageSquare },
  { label: "Review & Submit",  icon: ClipboardList },
];

const SERVICES = [
  "Visa Application", "Flight Booking", "Hotel Booking", "Tour Package",
  "Hajj Package", "Umrah Package", "Corporate Travel", "Medical Tourism",
  "Travel Insurance", "Group Travel", "Other",
];

const COUNTRIES = ["United Kingdom", "Schengen Area", "United States", "Canada", "Australia", "Saudi Arabia", "Turkey", "Other"];

type FormData = {
  service: string; destination: string; travelDate: string; returnDate: string; adults: string; children: string;
  firstName: string; lastName: string; email: string; phone: string; nationality: string; passportExpiry: string;
  budget: string; accommodation: string; dietary: string; notes: string; consent: boolean;
};

export default function Inquiry() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    service: "", destination: "", travelDate: "", returnDate: "", adults: "1", children: "0",
    firstName: "", lastName: "", email: "", phone: "", nationality: "", passportExpiry: "",
    budget: "", accommodation: "", dietary: "", notes: "", consent: false,
  });

  const set = (field: keyof FormData, val: string | boolean) => setForm(f => ({ ...f, [field]: val }));

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";
  const selectCls = `${inputCls} appearance-none`;

  const canAdvance = [
    form.service && form.destination && form.travelDate,
    form.firstName && form.lastName && form.email && form.phone,
    true,
    form.consent,
  ][step];

  if (submitted) return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-foreground text-2xl font-bold mb-3">Inquiry Submitted!</h2>
        <p className="text-muted-foreground mb-2">Reference: <span className="font-bold text-foreground">TRV-{Math.floor(Math.random() * 90000) + 10000}</span></p>
        <p className="text-sm text-muted-foreground mb-8">Our team will review your inquiry and contact you within 2 business hours. You'll receive a confirmation email at <strong>{form.email}</strong>.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Back to Home</Link>
          <Link to="/payment" className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors">Pay Deposit</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background">
      <section className="bg-primary py-16">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Get Started</p>
          <h1 className="text-white text-4xl font-bold mb-3">Online Inquiry</h1>
          <p className="text-white/65 max-w-md mx-auto">Fill in your travel requirements and we'll prepare a personalised quote within 2 hours.</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-4 left-0 right-0 h-px bg-border z-0" />
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <button
                  onClick={() => done && setStep(i)}
                  className={`size-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold
                    ${done ? "bg-green-500 border-green-500 text-white cursor-pointer" : active ? "bg-primary border-primary text-white" : "bg-card border-border text-muted-foreground"}`}
                >
                  {done ? <Check size={13} /> : i + 1}
                </button>
                <span className={`text-[11px] font-semibold hidden sm:block ${active ? "text-foreground" : done ? "text-green-600" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
            {(() => { const Icon = STEPS[step].icon; return <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon size={18} className="text-primary" /></div>; })()}
            <div>
              <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
              <h2 className="text-foreground font-bold">{STEPS[step].label}</h2>
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Service Required *</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => (
                    <button key={s} onClick={() => set("service", s)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${form.service === s ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Destination *</label>
                  <select className={selectCls} value={form.destination} onChange={e => set("destination", e.target.value)}>
                    <option value="">Select destination</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Adults</label>
                    <select className={selectCls} value={form.adults} onChange={e => set("adults", e.target.value)}>
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Children</label>
                    <select className={selectCls} value={form.children} onChange={e => set("children", e.target.value)}>
                      {[0,1,2,3,4].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Departure Date *</label>
                  <input type="date" className={inputCls} value={form.travelDate} onChange={e => set("travelDate", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Return Date</label>
                  <input type="date" className={inputCls} value={form.returnDate} onChange={e => set("returnDate", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input className={inputCls} placeholder="Ahmad" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Last Name *</label>
                  <input className={inputCls} placeholder="Al-Rashidi" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input type="email" className={inputCls} placeholder="ahmad@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Phone Number *</label>
                  <input type="tel" className={inputCls} placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nationality</label>
                  <input className={inputCls} placeholder="UAE" value={form.nationality} onChange={e => set("nationality", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Passport Expiry</label>
                  <input type="date" className={inputCls} value={form.passportExpiry} onChange={e => set("passportExpiry", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Budget Per Person (AED)</label>
                <div className="flex flex-wrap gap-2">
                  {["Under 3,000", "3,000–5,000", "5,000–10,000", "10,000–20,000", "20,000+", "Flexible"].map(b => (
                    <button key={b} onClick={() => set("budget", b)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${form.budget === b ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Preferred Accommodation</label>
                <div className="flex flex-wrap gap-2">
                  {["3-Star", "4-Star", "5-Star", "Luxury / Boutique", "Budget Friendly", "No Preference"].map(a => (
                    <button key={a} onClick={() => set("accommodation", a)} className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all ${form.accommodation === a ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Dietary Requirements</label>
                <input className={inputCls} placeholder="e.g. Halal, Vegetarian, Gluten-free, None" value={form.dietary} onChange={e => set("dietary", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Additional Notes</label>
                <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Any special requests, medical requirements, or preferences our team should know about…" value={form.notes} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-muted rounded-xl p-5 space-y-3 text-sm">
                {[
                  ["Service", form.service || "—"],
                  ["Destination", form.destination || "—"],
                  ["Travel Date", form.travelDate || "—"],
                  ["Return Date", form.returnDate || "—"],
                  ["Travellers", `${form.adults} adult(s), ${form.children} child(ren)`],
                  ["Full Name", `${form.firstName} ${form.lastName}`.trim() || "—"],
                  ["Email", form.email || "—"],
                  ["Phone", form.phone || "—"],
                  ["Budget", form.budget || "Not specified"],
                  ["Accommodation", form.accommodation || "No preference"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-muted-foreground font-medium min-w-[140px]">{k}</span>
                    <span className="text-foreground font-semibold text-right">{v}</span>
                  </div>
                ))}
                {form.notes && (
                  <div className="border-t border-border pt-3">
                    <p className="text-muted-foreground font-medium mb-1">Additional Notes</p>
                    <p className="text-foreground text-xs leading-relaxed">{form.notes}</p>
                  </div>
                )}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" className="mt-0.5 accent-accent" checked={form.consent} onChange={e => set("consent", e.target.checked)} />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I consent to Shanghai Travels / TravelOS processing my personal data for the purpose of handling this travel inquiry, in accordance with the{" "}
                  <a href="#" className="text-accent underline">Privacy Policy</a>. I understand my information will not be shared with third parties without consent.
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Back
            </button>
            <button
              disabled={!canAdvance}
              onClick={() => step < 3 ? setStep(s => s + 1) : setSubmitted(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Submit Inquiry" : "Continue"} <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="mt-6 bg-card rounded-xl border border-border p-5 flex items-center gap-5">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Phone size={18} className="text-primary" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">Prefer to speak with us?</p>
            <p className="text-xs text-muted-foreground">Call <a href={telHref(HOTLINE)} className="text-accent font-semibold">{HOTLINE}</a> · {OPENING_HOURS}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
