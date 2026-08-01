import { useState } from "react";
import { Link } from "react-router";
import { CreditCard, Building2, MapPin, CheckCircle2, Lock, Shield, ChevronDown, Info } from "lucide-react";
import { EMAIL, HOTLINE, OFFICES, OPENING_HOURS, telHref } from "../company";

type PayMethod = "card" | "bank" | "cash";

const ORDER = {
  ref: "TRV-38241",
  service: "UK Standard Visitor Visa × 2",
  breakdown: [
    { label: "Visa processing fee × 2", amount: "AED 640" },
    { label: "Service fee (TravelOS)", amount: "AED 300" },
    { label: "Document handling",       amount: "AED 80" },
  ],
  total: "AED 1,020",
  totalNum: 1020,
};

const BANKS = [
  { name: "Emirates NBD",    iban: "AE07 0260 0010 2690 5063 4" },
  { name: "Abu Dhabi Commercial Bank (ADCB)", iban: "AE66 0030 0001 0932 8555 001" },
];

export default function Payment() {
  const [method, setMethod] = useState<PayMethod>("card");
  const [paid, setPaid] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [loading, setLoading] = useState(false);

  const setC = (field: keyof typeof card, val: string) => setCard(c => ({ ...c, [field]: val }));

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setPaid(true); }, 1800);
  };

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono";

  if (paid) return (
    <div className="min-h-[80vh] bg-background flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-600" />
        </div>
        <h2 className="text-foreground text-2xl font-bold mb-3">Payment Successful</h2>
        <p className="text-muted-foreground mb-2">Reference: <span className="font-bold text-foreground">{ORDER.ref}</span></p>
        <p className="text-sm text-muted-foreground mb-6">
          {ORDER.total} has been processed. A receipt will be sent to your registered email address within 5 minutes.
        </p>
        <div className="bg-card rounded-xl border border-border p-5 mb-8 text-left space-y-2">
          {ORDER.breakdown.map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium text-foreground">{r.amount}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
            <span>Total Paid</span><span>{ORDER.total}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="px-6 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Back to Home</Link>
          <Link to="/contact" className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Track Application</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background">
      <section className="bg-primary py-16">
        <div className="max-w-[1440px] mx-auto px-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">Secure Payment</p>
          <h1 className="text-white text-4xl font-bold mb-3">Complete Your Payment</h1>
          <p className="text-white/65">All transactions are encrypted and processed securely.</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Payment form */}
          <div className="lg:col-span-3 space-y-5">
            {/* Method selector */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-foreground font-bold mb-4">Payment Method</h3>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "card", label: "Card", icon: CreditCard },
                  { id: "bank", label: "Bank Transfer", icon: Building2 },
                  { id: "cash", label: "Cash at Office", icon: MapPin },
                ] as { id: PayMethod; label: string; icon: React.ElementType }[]).map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <m.icon size={20} className={method === m.id ? "text-primary" : "text-muted-foreground"} />
                    <span className={`text-xs font-semibold ${method === m.id ? "text-primary" : "text-muted-foreground"}`}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card form */}
            {method === "card" && (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-foreground font-bold">Card Details</h3>
                  <div className="flex gap-2">
                    {["VISA", "MC", "AMEX"].map(b => (
                      <span key={b} className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded border border-border">{b}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Card Number</label>
                  <div className="relative">
                    <input className={inputCls} placeholder="0000 0000 0000 0000" value={card.number} onChange={e => setC("number", formatCard(e.target.value))} maxLength={19} />
                    <CreditCard size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Cardholder Name</label>
                  <input className={inputCls} placeholder="As it appears on card" value={card.name} onChange={e => setC("name", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Expiry Date</label>
                    <input className={inputCls} placeholder="MM/YY" value={card.expiry} onChange={e => setC("expiry", formatExpiry(e.target.value))} maxLength={5} />
                  </div>
                  <div>
                    <label className={labelCls}>CVV</label>
                    <div className="relative">
                      <input type="password" className={inputCls} placeholder="•••" value={card.cvv} onChange={e => setC("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} />
                      <Info size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-help" title="3 digits on the back of your card (4 for Amex)" />
                    </div>
                  </div>
                </div>
                <button onClick={handlePay} disabled={loading || !card.number || !card.name || !card.expiry || !card.cvv} className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Processing…</>
                  ) : (
                    <><Lock size={14} /> Pay {ORDER.total} Securely</>
                  )}
                </button>
              </div>
            )}

            {/* Bank transfer */}
            {method === "bank" && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-foreground font-bold mb-2">Bank Transfer Details</h3>
                <p className="text-xs text-muted-foreground mb-5">Transfer the exact amount and include your reference number. Processing takes 1–2 business days.</p>
                <div className="space-y-4">
                  {BANKS.map(b => (
                    <div key={b.name} className="bg-muted rounded-xl p-4 space-y-2">
                      <p className="text-sm font-bold text-foreground">{b.name}</p>
                      {[
                        ["Account Name", "Shanghai Travels LLC"],
                        ["IBAN", b.iban],
                        ["Reference", ORDER.ref],
                        ["Amount", ORDER.total],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 text-xs">
                          <span className="text-muted-foreground min-w-[110px]">{k}</span>
                          <span className="font-mono font-semibold text-foreground text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-2">
                  <Info size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">After transferring, email your payment slip to <strong>{EMAIL}</strong> with your reference number to expedite processing.</p>
                </div>
              </div>
            )}

            {/* Cash at office */}
            {method === "cash" && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="text-foreground font-bold mb-2">Pay at Our Office</h3>
                <p className="text-xs text-muted-foreground mb-5">Visit any of our branches and pay cash, card, or cheque. Bring your booking reference.</p>
                <div className="space-y-3">
                  {OFFICES.map(o => (
                    <div key={o.label} className="p-4 rounded-xl bg-muted">
                      <p className="font-bold text-foreground text-sm mb-1">{o.label}</p>
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5"><MapPin size={11} className="mt-0.5 flex-shrink-0" />{o.street}, {o.area}</p>
                      <p className="text-xs text-muted-foreground mt-1">{OPENING_HOURS}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
                  <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">Please quote reference <strong>{ORDER.ref}</strong> when making payment. Call ahead to confirm your slot: <strong>{HOTLINE}</strong></p>
                </div>
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 py-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock size={12} /> 256-bit SSL</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Shield size={12} /> PCI DSS Compliant</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 size={12} /> 3D Secure</div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-card rounded-2xl border border-border overflow-hidden">
              <div className="bg-primary px-6 py-4">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Order Summary</p>
                <p className="text-white font-bold mt-0.5">{ORDER.ref}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-foreground mb-4">{ORDER.service}</p>
                <div className="space-y-3 mb-5">
                  {ORDER.breakdown.map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium text-foreground">{r.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-baseline">
                  <span className="font-bold text-foreground">Total Due</span>
                  <span className="text-2xl font-bold text-foreground">{ORDER.total}</span>
                </div>
                <div className="mt-5 pt-5 border-t border-border space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">What Happens Next</p>
                  {["Payment confirmed by email", "Application submitted to embassy", "Updates sent via WhatsApp", "Visa decision notification"].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="size-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">{i + 1}</div>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-xs text-muted-foreground">Questions? <Link to="/contact" className="text-accent font-semibold hover:underline">Contact us</Link> or call <a href={telHref(HOTLINE)} className="text-accent font-semibold hover:underline">{HOTLINE}</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
