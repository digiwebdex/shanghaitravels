import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "" });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/portal/dashboard"); }, 1200);
  };

  const labelCls = "block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wider";
  const inputCls = "w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&h=900&fit=crop&auto=format" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-black">T</span>
            </div>
            <div>
              <p className="text-white font-bold">TravelOS</p>
              <p className="text-white/40 text-[11px]">Shanghai Travels LLC</p>
            </div>
          </div>
          <div>
            <h1 className="text-white text-4xl font-bold leading-tight mb-4">Your travel applications,<br />all in one place.</h1>
            <p className="text-white/60 text-base leading-relaxed mb-10">Track visas, manage documents, pay online, and communicate with our team — 24/7 from any device.</p>
            <div className="grid grid-cols-3 gap-4">
              {[["98.7%", "Approval Rate"], ["24h", "Response Time"], ["15,000+", "Happy Clients"]].map(([v, l]) => (
                <div key={l} className="bg-white/10 rounded-xl p-4 border border-white/15">
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-white/50 text-xs mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/30 text-xs">© 2025 Shanghai Travels LLC · IATA · ATAS Accredited · Dubai Tourism Licensed</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-black text-sm">T</span></div>
            <span className="font-bold text-foreground">TravelOS Portal</span>
          </div>

          {/* Toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-8">
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <h2 className="text-foreground text-xl font-bold mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="text-muted-foreground text-sm mb-6">{mode === "login" ? "Sign in to track your applications and manage documents." : "Register to start a new visa or travel application."}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>First Name</label><input className={inputCls} placeholder="Ahmad" value={form.firstName} onChange={e => set("firstName", e.target.value)} required /></div>
                <div><label className={labelCls}>Last Name</label><input className={inputCls} placeholder="Al-Rashidi" value={form.lastName} onChange={e => set("lastName", e.target.value)} required /></div>
              </div>
            )}
            {mode === "register" && (
              <div><label className={labelCls}>Phone Number</label><input type="tel" className={inputCls} placeholder="+971 50 000 0000" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            )}
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" className={inputCls} placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} required />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} className={inputCls} placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} required />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {mode === "register" && (
              <div><label className={labelCls}>Confirm Password</label><input type="password" className={inputCls} placeholder="••••••••" value={form.confirm} onChange={e => set("confirm", e.target.value)} required /></div>
            )}
            {mode === "login" && (
              <div className="flex justify-end"><button type="button" className="text-xs text-accent hover:underline">Forgot password?</button></div>
            )}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 transition-all disabled:opacity-50">
              {loading ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 p-3 bg-muted rounded-xl">
            <Shield size={14} className="text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">Your data is encrypted and protected under UAE data protection laws.</p>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">
            Not applying online? <Link to="/inquiry" className="text-accent hover:underline font-semibold">Submit a manual inquiry</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
