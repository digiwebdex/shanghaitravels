import { useState } from "react";
import { useParams, Link } from "react-router";
import { CreditCard, Building2, MapPin, CheckCircle2, Lock, Shield, Info, Download } from "lucide-react";
import { MOCK_APPLICATIONS, STATUS_CONFIG } from "./data";

type Method = "card" | "bank" | "cash";

export default function PortalPayment() {
  const { id } = useParams();
  const app = MOCK_APPLICATIONS.find(a => a.id === id) ?? MOCK_APPLICATIONS[1];
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const setC = (k: keyof typeof card, v: string) => setCard(c => ({ ...c, [k]: v }));
  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExp  = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setPaid(true); }, 1800);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground font-mono";
  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";

  const breakdown = [
    { label: "Government visa fee × 2", amount: "AED 640" },
    { label: "TravelOS service fee",    amount: "AED 300" },
    { label: "Document handling",       amount: "AED 80" },
  ];

  if (paid) return (
    <div className="p-8 max-w-[600px] mx-auto text-center">
      <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 size={40} className="text-green-600" />
      </div>
      <h2 className="text-foreground text-2xl font-bold mb-2">Payment Received</h2>
      <p className="text-muted-foreground mb-1">Reference: <strong className="text-foreground">{app.ref}</strong></p>
      <p className="text-sm text-muted-foreground mb-6">AED 1,020 processed. Your receipt has been sent to your registered email. Your application will now advance to the next stage.</p>
      <div className="flex gap-3 justify-center">
        <Link to={`/portal/track/${app.id}`} className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Track Application</Link>
        <Link to={`/portal/invoice/${app.id}`} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"><Download size={13} /> Download Invoice</Link>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <div className="mb-7">
        <p className="text-xs text-muted-foreground mb-0.5">{app.ref}</p>
        <h1 className="text-foreground text-xl font-bold">Make Payment</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="text-foreground font-bold mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {([
                { id: "card", label: "Card",            icon: CreditCard },
                { id: "bank", label: "Bank Transfer",   icon: Building2 },
                { id: "cash", label: "Cash at Office",  icon: MapPin },
              ] as { id: Method; label: string; icon: React.ElementType }[]).map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <m.icon size={18} className={method === m.id ? "text-primary" : "text-muted-foreground"} />
                  <span className={`text-[11px] font-semibold ${method === m.id ? "text-primary" : "text-muted-foreground"}`}>{m.label}</span>
                </button>
              ))}
            </div>

            {method === "card" && (
              <div className="space-y-3">
                <div className="flex justify-end gap-1.5 mb-1">
                  {["VISA", "MC", "AMEX"].map(b => <span key={b} className="text-[9px] font-bold px-1.5 py-0.5 border border-border rounded text-muted-foreground">{b}</span>)}
                </div>
                <div>
                  <label className={labelCls}>Card Number</label>
                  <div className="relative"><input className={inputCls} placeholder="0000 0000 0000 0000" value={card.number} onChange={e => setC("number", formatCard(e.target.value))} maxLength={19} /><CreditCard size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /></div>
                </div>
                <div><label className={labelCls}>Cardholder Name</label><input className={`${inputCls} font-sans`} placeholder="As on card" value={card.name} onChange={e => setC("name", e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Expiry</label><input className={inputCls} placeholder="MM/YY" value={card.expiry} onChange={e => setC("expiry", formatExp(e.target.value))} maxLength={5} /></div>
                  <div><label className={labelCls}>CVV</label><input type="password" className={inputCls} placeholder="•••" value={card.cvv} onChange={e => setC("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))} /></div>
                </div>
                <button onClick={handlePay} disabled={loading || !card.number || !card.name || !card.expiry || !card.cvv} className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <><Lock size={13} /> Pay AED 1,020</>}
                </button>
              </div>
            )}

            {method === "bank" && (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-foreground">Emirates NBD</p>
                  {[["Account Name", "Shanghai Travels LLC"], ["IBAN", "AE07 0260 0010 2690 5063 4"], ["Reference", app.ref], ["Amount", "AED 1,020"]].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono font-semibold text-foreground">{v}</span></div>
                  ))}
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-2">
                  <Info size={13} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">After transferring, email your receipt to <strong>payments@travelos.ae</strong> with reference <strong>{app.ref}</strong>.</p>
                </div>
              </div>
            )}

            {method === "cash" && (
              <div className="space-y-3">
                {[
                  { city: "Dubai HQ", addr: "Office 1204, Al Moosa Tower 1, Sheikh Zayed Rd", hours: "Mon–Sat 8am–8pm" },
                  { city: "Abu Dhabi", addr: "Office 305, Al Falah St, Khalidiyah", hours: "Mon–Sat 9am–7pm" },
                ].map(o => (
                  <div key={o.city} className="p-3.5 bg-muted rounded-xl">
                    <p className="text-sm font-bold text-foreground mb-1">{o.city}</p>
                    <p className="text-xs text-muted-foreground">{o.addr}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.hours}</p>
                  </div>
                ))}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2">
                  <Info size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">Quote reference <strong>{app.ref}</strong> when paying. Call <strong>+971 4 123 4567</strong> to confirm your visit.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            {[["Lock", "256-bit SSL"], ["Shield", "PCI DSS"], ["CheckCircle2", "3D Secure"]].map(([, l]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock size={11} /> {l}</div>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 bg-card rounded-2xl border border-border overflow-hidden">
            <div className="bg-primary px-6 py-4">
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">Invoice Summary</p>
              <p className="text-white font-bold mt-0.5">{app.ref}</p>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-foreground mb-4">{app.service}</p>
              <div className="space-y-2.5 mb-4">
                {breakdown.map(r => (
                  <div key={r.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium text-foreground">{r.amount}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-3">
                <span>Total Due</span><span className="text-xl text-accent">AED 1,020</span>
              </div>
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Application Status</p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full ${STATUS_CONFIG[app.status].bg} ${STATUS_CONFIG[app.status].color}`}>
                  {STATUS_CONFIG[app.status].label}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Stage {app.stage + 1} of 10 · Payment required to proceed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
