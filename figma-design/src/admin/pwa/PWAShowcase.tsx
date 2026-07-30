import { useState } from "react";
import {
  WifiOff, Download, RefreshCw, Bell, Share2, Plus,
  CheckCircle2, Clock, ChevronLeft, ArrowDown, X,
  Home, Search, User, FileText, Settings, Zap,
  AlertTriangle, DollarSign, ChevronRight, UploadCloud,
  Check, XCircle, RotateCcw, ClipboardList, Layers,
  Smartphone, MonitorSmartphone, BellOff, Menu,
} from "lucide-react";

// ─── Brand atom ───────────────────────────────────────────────────────────────

function STIcon({ size = 48, radius = "22.5%" }: { size?: number; radius?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        borderRadius: radius,
        background: "linear-gradient(145deg,#0D1629,#1E3570)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}>
      <span className="font-black text-white" style={{ fontSize: size * 0.3, letterSpacing: "-0.04em", lineHeight: 1 }}>ST</span>
      <div style={{ width: size * 0.46, height: size * 0.045, background: "#F59E0B", borderRadius: 99, marginTop: size * 0.035 }} />
    </div>
  );
}

// ─── Shared chrome wrappers ───────────────────────────────────────────────────

function PhoneFrame({ children, h = 580, light = false }: { children: React.ReactNode; h?: number; light?: boolean }) {
  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden shadow-2xl shadow-black/60 ${light ? "bg-white" : "bg-[#0D1117]"}`}
      style={{ width: 200, height: h, borderRadius: 28, border: "6px solid #334155" }}>
      {/* status bar */}
      <div className={`flex items-center justify-between px-4 py-1.5 text-[9px] font-semibold flex-shrink-0 ${light ? "bg-white text-slate-600" : "bg-black/40 text-white/70"}`}>
        <span>9:41</span><span>▲ ▮▮ ▶</span>
      </div>
      {/* notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-5 bg-black rounded-b-xl z-20" />
      {/* home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/25 rounded-full z-20" />
      <div className="flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SectionHead({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-black text-amber-400">{num}</span>
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Tag({ children, color = "slate" }: { children: React.ReactNode; color?: string }) {
  const cls: Record<string, string> = {
    slate: "bg-slate-700/60 text-slate-400 border-slate-700",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    emerald:"bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    red:   "bg-red-500/15 text-red-400 border-red-500/30",
    blue:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
    sky:   "bg-sky-500/15 text-sky-400 border-sky-500/30",
  };
  return <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border ${cls[color] ?? cls.slate}`}>{children}</span>;
}

// ─── Section 1: Icons & Splash ────────────────────────────────────────────────

function IconsAndSplash() {
  return (
    <div className="space-y-10">
      {/* Icon sizes */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">App Icon Set — maskable-safe format</p>
        <div className="flex items-end gap-8 flex-wrap">
          {[{ px: 512, label: "512px — PWA manifest" }, { px: 192, label: "192px — Android" }, { px: 180, label: "180px — Apple touch" }, { px: 96, label: "96px — favicon" }].map(({ px, label }) => {
            const d = Math.round(px / 5.5);
            return (
              <div key={px} className="flex flex-col items-center gap-2">
                <STIcon size={d} />
                <p className="text-[10px] font-mono text-slate-500 text-center leading-tight">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Maskable safe zone */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Maskable safe-zone preview — logo stays within inner 80% circle</p>
        <div className="flex items-center gap-8 flex-wrap">
          {[
            { label: "Circle (Android)",    style: "rounded-full",          size: 80 },
            { label: "Squircle (Android)",  style: "rounded-[25%]",         size: 80 },
            { label: "Rounded square (iOS)",style: "rounded-[22%]",         size: 80 },
          ].map(({ label, style, size }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`${style} overflow-hidden flex-shrink-0`} style={{ width: size, height: size }}>
                <div style={{ width: size, height: size, background: "linear-gradient(145deg,#0D1629,#1E3570)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="font-black text-white" style={{ fontSize: size * 0.28, lineHeight: 1, letterSpacing: "-0.04em" }}>ST</span>
                  <div style={{ width: size * 0.46, height: size * 0.045, background: "#F59E0B", borderRadius: 99, marginTop: size * 0.035 }} />
                </div>
              </div>
              <p className="text-[9px] text-slate-500 text-center leading-tight">{label}</p>
            </div>
          ))}
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 max-w-[200px]">
            <p className="font-bold text-slate-300 mb-1">Safe zone rule</p>
            <p>Logo and wordmark stay within the inner 80% circle. No text or mark is ever clipped by any system crop shape.</p>
          </div>
        </div>
      </div>

      {/* Splash screens */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Splash / Launch screens — Portrait & Landscape</p>
        <div className="flex items-end gap-6">
          {/* Portrait */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-between rounded-2xl overflow-hidden shadow-xl border border-slate-700"
              style={{ width: 130, height: 230, background: "linear-gradient(160deg,#0D1629,#0A0F20)", padding: "24px 16px 20px" }}>
              <div />
              <div className="flex flex-col items-center gap-3">
                <STIcon size={52} />
                <div className="text-center">
                  <p className="text-white font-black text-xs tracking-tight leading-tight">SHANGHAI</p>
                  <p className="text-white font-black text-xs tracking-tight leading-tight">TRAVELS</p>
                  <p className="text-white/30 text-[8px] mt-1">TravelOS Platform</p>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "#F59E0B" : "rgba(255,255,255,0.2)" }} />
                  ))}
                </div>
              </div>
              <p className="text-white/25 text-[6.5px] text-center leading-tight">Govt. Registered Travel Agency<br />Reg. No. 0017053</p>
            </div>
            <p className="text-[10px] text-slate-500">Portrait 390×844</p>
          </div>
          {/* Landscape */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-between rounded-2xl overflow-hidden shadow-xl border border-slate-700"
              style={{ width: 230, height: 130, background: "linear-gradient(160deg,#0D1629,#0A0F20)", padding: "16px 28px" }}>
              <div className="flex flex-col items-center gap-2">
                <STIcon size={48} />
                <div className="text-center">
                  <p className="text-white font-black text-[10px] tracking-tight leading-tight">SHANGHAI TRAVELS</p>
                  <p className="text-white/30 text-[7px] mt-0.5">TravelOS Platform</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? "#F59E0B" : "rgba(255,255,255,0.2)" }} />
                  ))}
                </div>
                <p className="text-white/20 text-[6.5px] text-center leading-tight">Govt. Registered<br />Travel Agency<br />Reg. No. 0017053</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Landscape 844×390</p>
          </div>
        </div>
      </div>

      {/* Home screen previews */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Home screen placement — iOS & Android</p>
        <div className="flex gap-8">
          {/* iPhone */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-[28px] border-4 border-slate-700 overflow-hidden shadow-2xl"
              style={{ width: 180, height: 320, background: "linear-gradient(160deg,#1a1f2e,#0d1117)" }}>
              {/* iOS grid of app icons */}
              <div className="grid grid-cols-4 gap-2 p-3 mt-8">
                {["Maps","Photos","Safari","Mail","Messages","Camera","Music","Settings","Notes","Contacts","FaceTime","Clock"].map((app, i) => (
                  <div key={app} className="flex flex-col items-center gap-0.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[7px] font-bold text-white"
                      style={{ background: ["#0EA5E9","#F97316","#64748B","#2563EB","#10B981","#6B7280","#EC4899","#94A3B8","#F59E0B","#14B8A6","#06B6D4","#64748B"][i] }}>
                      {app.slice(0,2)}
                    </div>
                    <p className="text-[5px] text-white/60 text-center leading-none truncate w-9">{app}</p>
                  </div>
                ))}
                {/* TravelOS icon — highlighted */}
                <div className="flex flex-col items-center gap-0.5">
                  <STIcon size={36} />
                  <p className="text-[5px] text-white text-center font-bold leading-none">TravelOS</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">iOS Home Screen</p>
          </div>

          {/* Android */}
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border-4 border-slate-700 overflow-hidden shadow-2xl"
              style={{ width: 180, height: 320, background: "linear-gradient(160deg,#1a1f2e,#0d1117)" }}>
              {/* Android layout */}
              <div className="flex flex-col h-full">
                <div className="p-3 mt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {["Phone","SMS","Chrome","Store","Camera","Files","Spotify","Maps"].map((app, i) => (
                      <div key={app} className="flex flex-col items-center gap-0.5">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                          style={{ background: ["#10B981","#06B6D4","#EA580C","#10B981","#64748B","#3B82F6","#10B981","#4285F4"][i] }}>
                          {app.slice(0,2)}
                        </div>
                        <p className="text-[5px] text-white/60 text-center leading-none truncate w-9">{app}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                {/* Dock */}
                <div className="mx-3 mb-3 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-around">
                  {[null, null, null].map((_, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-white/50">
                      {["Ph","SM","Br"][i]}
                    </div>
                  ))}
                  <STIcon size={36} />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Android Home Screen</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 2: Install Flows ─────────────────────────────────────────────────

function InstallFlows() {
  const [iosStep, setIosStep] = useState(0);

  const IOS_STEPS = [
    { icon: Share2,    text: "Tap the Share icon in the Safari toolbar at the bottom of your screen" },
    { icon: ChevronRight, text: "Scroll down in the share sheet until you see 'Add to Home Screen'" },
    { icon: Plus,      text: "Tap 'Add to Home Screen' — you can rename the app if you wish" },
    { icon: CheckCircle2, text: "Tap 'Add' in the top-right corner. TravelOS appears on your home screen!" },
  ];

  return (
    <div className="space-y-10">
      {/* Android/Chrome flow */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Android & Desktop Chrome</p>
          <Tag color="emerald">Auto-triggerable</Tag>
        </div>
        <div className="flex flex-wrap gap-6 items-start">
          {/* Chrome mini-infobar */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-slate-600">1 — Browser install chip</p>
            <div className="rounded-xl overflow-hidden border border-slate-700 shadow-lg" style={{ width: 220 }}>
              <div className="bg-[#2A2A2A] px-3 py-2 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                <div className="flex-1 bg-[#3A3A3A] rounded px-2 py-0.5 text-[8px] text-slate-400 mx-2">travelapp.ae</div>
              </div>
              <div className="bg-[#1C2127] px-3 py-2.5 flex items-center gap-2.5 border-t border-slate-700">
                <STIcon size={28} radius="6px" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white">Add TravelOS to home</p>
                  <p className="text-[8px] text-slate-500">travelapp.ae</p>
                </div>
                <button className="bg-blue-600 text-white text-[8px] font-bold px-2.5 py-1 rounded-full">Install</button>
              </div>
            </div>
          </div>

          {/* Custom bottom sheet */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-slate-600">2 — In-app install bottom sheet</p>
            <PhoneFrame h={440}>
              {/* Dimmed background */}
              <div className="absolute inset-0 bg-black/50 z-10" />
              {/* Sheet */}
              <div className="absolute bottom-0 inset-x-0 z-20 rounded-t-2xl bg-[#1E293B] border-t border-slate-700 px-4 pt-4 pb-8">
                <div className="w-8 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
                <div className="flex items-center gap-3 mb-4">
                  <STIcon size={44} />
                  <div>
                    <p className="text-sm font-bold text-white">Install TravelOS</p>
                    <p className="text-[9px] text-slate-400">Shanghai Travels · travelapp.ae</p>
                  </div>
                </div>
                {[
                  { icon: Zap,       text: "Faster access — no browser chrome" },
                  { icon: UploadCloud, text: "View saved documents offline"      },
                  { icon: Bell,      text: "Receive push notifications"         },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <b.icon size={11} className="text-amber-400" />
                    </div>
                    <p className="text-[10px] text-slate-300">{b.text}</p>
                  </div>
                ))}
                <button className="w-full mt-3 py-2.5 bg-[#14213D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Download size={13} /> Install App
                </button>
                <button className="w-full mt-2 py-2 text-slate-500 text-xs">Not now</button>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </div>

      {/* iOS Safari flow */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">iPhone / iOS Safari</p>
          <Tag color="amber">Manual install — no auto-prompt</Tag>
        </div>
        <div className="flex gap-6 items-start flex-wrap">
          <PhoneFrame h={520} light>
            <div className="flex flex-col h-full bg-white">
              {/* Safari address bar */}
              <div className="px-3 py-2 border-b border-slate-200 flex-shrink-0">
                <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-[9px] text-slate-500 text-center">travelapp.ae</div>
              </div>
              <div className="flex-1 overflow-auto p-3">
                {/* Modal */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                  <div className="bg-[#0D1629] px-3 py-3 flex items-center gap-2.5">
                    <STIcon size={32} />
                    <div>
                      <p className="text-xs font-bold text-white">Add TravelOS to Home Screen</p>
                      <p className="text-[8px] text-white/50">Get the full app experience</p>
                    </div>
                    <button className="ml-auto text-white/40"><X size={11} /></button>
                  </div>
                  <div className="p-3 space-y-2">
                    {IOS_STEPS.map((step, i) => (
                      <div key={i}
                        onClick={() => setIosStep(i)}
                        className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-all ${i === iosStep ? "bg-blue-50 border border-blue-200" : "border border-transparent"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${i === iosStep ? "bg-blue-500 text-white" : i < iosStep ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                          {i < iosStep ? <Check size={8} /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <step.icon size={10} className={`mb-0.5 ${i === iosStep ? "text-blue-500" : "text-slate-400"}`} />
                          <p className={`text-[8px] leading-tight ${i === iosStep ? "text-slate-700" : "text-slate-500"}`}>{step.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <p className="text-[8px] text-slate-400">Don't show again</p>
                  </div>
                </div>
              </div>
              {/* Safari bottom toolbar */}
              <div className="flex-shrink-0 border-t border-slate-200 px-4 py-2 flex items-center justify-between bg-white">
                <ChevronLeft size={16} className="text-blue-500" />
                <ChevronRight size={16} className="text-slate-300" />
                <div className="w-6 h-5 bg-slate-200 rounded" />
                <Share2 size={15} className="text-blue-500" />
                <div className="grid grid-cols-2 gap-0.5"><div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" /><div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" /><div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" /><div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" /></div>
              </div>
            </div>
          </PhoneFrame>

          {/* Profile menu entry point */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] text-slate-600">Persistent entry point in profile/settings menu</p>
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden w-48">
              <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white">AA</div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-200">Ahmed Al-Rashidi</p>
                  <p className="text-[8px] text-slate-500">Customer</p>
                </div>
              </div>
              {["My Applications", "Documents", "Notifications"].map(item => (
                <div key={item} className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                  <p className="text-[10px] text-slate-300">{item}</p>
                  <ChevronRight size={9} className="text-slate-600" />
                </div>
              ))}
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-amber-500/8">
                <div className="flex items-center gap-2">
                  <Download size={10} className="text-amber-400" />
                  <p className="text-[10px] text-amber-300 font-medium">Install App</p>
                </div>
                <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">NEW</span>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">Settings</p>
                <ChevronRight size={9} className="text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Offline States ────────────────────────────────────────────────

function OfflineStates() {
  return (
    <div className="space-y-8">
      {/* Offline banner */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Offline banner — persistent thin bar</p>
        <div className="max-w-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <WifiOff size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300 flex-1">You&apos;re offline — showing saved data</p>
            <span className="text-[9px] text-amber-500 font-mono">12 min ago</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg mt-2 text-xs text-slate-400">
            <span className="font-semibold">Cached data indicator:</span> <span className="font-mono text-slate-500">Last updated 12 min ago</span>
          </div>
        </div>
      </div>

      {/* Full offline page + queued actions side by side */}
      <div className="flex flex-wrap gap-8 items-start">
        {/* Full offline fallback page */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-600">Full offline fallback page</p>
          <PhoneFrame>
            <div className="flex flex-col items-center justify-center h-full px-5 text-center bg-[#0D1117]">
              <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <WifiOff size={24} className="text-slate-500" />
              </div>
              <STIcon size={36} />
              <p className="text-white font-bold text-sm mt-3">You&apos;re offline</p>
              <p className="text-slate-400 text-[10px] mt-2 leading-relaxed">No internet connection. Some features are unavailable but your saved documents and applications are still accessible.</p>
              <button className="mt-5 flex items-center gap-1.5 bg-[#14213D] text-white px-5 py-2 rounded-xl text-xs font-bold">
                <RotateCcw size={11} /> Try again
              </button>
              <button className="mt-2 text-amber-400 text-[10px]">View saved documents →</button>
              <p className="text-slate-700 text-[8px] mt-6 font-mono">Last synced: today 09:28 AM</p>
            </div>
          </PhoneFrame>
        </div>

        {/* Queued action states */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-slate-600">Staff: queued actions while offline</p>
          <div className="w-64 space-y-2">
            {/* Pending sync card */}
            <div className="bg-slate-800 border border-amber-500/40 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-slate-200">APP-7705 · Status update</p>
                  <p className="text-[9px] text-slate-400">Changed to "Embassy Submitted"</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                  <Clock size={9} className="text-amber-400" />
                  <span className="text-[8px] text-amber-400 font-bold">PENDING SYNC</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <WifiOff size={9} />
                <span>Will sync when connection restores</span>
              </div>
            </div>

            {/* Pending document upload */}
            <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-slate-200">Bank Statement.pdf</p>
                  <p className="text-[9px] text-slate-400">APP-7708 · 2.4 MB</p>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                  <UploadCloud size={9} className="text-amber-400" />
                  <span className="text-[8px] text-amber-400 font-bold">QUEUED</span>
                </div>
              </div>
              <div className="h-1 bg-slate-700 rounded-full">
                <div className="h-full w-0 bg-amber-500 rounded-full" />
              </div>
            </div>

            {/* Sync complete toast */}
            <div className="bg-emerald-900/40 border border-emerald-500/40 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-emerald-300">2 actions synced</p>
                <p className="text-[8px] text-emerald-700">Status update + document upload complete</p>
              </div>
              <button><X size={10} className="text-emerald-700" /></button>
            </div>
          </div>
        </div>

        {/* Skeleton loaders */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-slate-600">Skeleton loaders — slow connection</p>
          <div className="w-56 space-y-2.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-700 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 bg-slate-700 rounded animate-pulse w-3/4" />
                    <div className="h-1.5 bg-slate-700/60 rounded animate-pulse w-1/2" />
                  </div>
                </div>
                <div className="h-1.5 bg-slate-700/60 rounded animate-pulse w-full" />
                <div className="h-1.5 bg-slate-700/40 rounded animate-pulse w-2/3" />
                <div className="flex gap-2 mt-1">
                  <div className="h-5 bg-slate-700/50 rounded-lg animate-pulse flex-1" />
                  <div className="h-5 bg-slate-700/30 rounded-lg animate-pulse w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 4: App Chrome ────────────────────────────────────────────────────

function AppChrome() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-8 items-start">
        {/* Safe area diagram */}
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-slate-600">Safe area — standalone mode (no browser bar)</p>
          <div className="relative rounded-[32px] overflow-hidden border-4 border-slate-600 shadow-2xl" style={{ width: 200, height: 420 }}>
            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
            {/* Safe-area zone annotations */}
            <div className="absolute inset-0 flex flex-col" style={{ background: "#0D1117" }}>
              {/* Status bar + Dynamic Island safe zone */}
              <div className="flex-shrink-0 h-12 flex items-center justify-between px-4 border-b-2 border-dashed border-blue-500/40 relative">
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-[7px] text-blue-400 font-bold whitespace-nowrap">← env(safe-area-inset-top) + 20px</div>
              </div>
              {/* Content area */}
              <div className="flex-1 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ChevronLeft size={14} className="text-amber-400" />
                  <p className="text-[10px] font-bold text-slate-200">← In-app back</p>
                </div>
                <div className="h-2 bg-slate-700 rounded w-3/4" />
                <div className="h-2 bg-slate-700/60 rounded w-1/2" />
                <div className="h-12 bg-slate-800 rounded-xl mt-3" />
                <div className="h-12 bg-slate-800 rounded-xl" />
                <div className="h-12 bg-slate-800 rounded-xl" />
              </div>
              {/* Bottom tab bar */}
              <div className="flex-shrink-0 border-t border-slate-700 bg-slate-900/90 backdrop-blur-sm">
                <div className="flex justify-around items-center py-2">
                  {[{ icon: Home, label: "Home", active: true }, { icon: FileText, label: "Apply" }, { icon: ClipboardList, label: "Track" }, { icon: User, label: "Profile" }].map(t => (
                    <div key={t.label} className="flex flex-col items-center gap-0.5">
                      <t.icon size={16} className={t.active ? "text-amber-400" : "text-slate-600"} />
                      <span className={`text-[7px] ${t.active ? "text-amber-400" : "text-slate-600"}`}>{t.label}</span>
                    </div>
                  ))}
                </div>
                {/* Home indicator safe area */}
                <div className="flex justify-center pb-1.5">
                  <div className="w-24 h-1 bg-white/20 rounded-full" />
                </div>
                <div className="absolute -right-1 bottom-10 text-[7px] text-blue-400 font-bold whitespace-nowrap">← env(safe-area-inset-bottom)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pull to refresh + update toast */}
        <div className="flex flex-col gap-5">
          {/* Pull to refresh */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-600">Pull-to-refresh indicator</p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden w-52">
              <div className="flex justify-center py-3 bg-slate-900/60">
                <div className="flex flex-col items-center gap-1">
                  <ArrowDown size={16} className="text-amber-400 animate-bounce" />
                  <p className="text-[9px] text-slate-400">Release to refresh</p>
                </div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="border-t border-slate-700/50 px-3 py-2.5">
                  <div className="h-2 bg-slate-700 rounded w-3/4" />
                  <div className="h-1.5 bg-slate-700/50 rounded w-1/2 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Update available toast */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-600">Update-available toast</p>
            <div className="bg-[#14213D] border border-[#1E3570] rounded-xl px-3 py-2.5 flex items-center gap-2.5 w-52 shadow-lg">
              <RefreshCw size={13} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-white">New version available</p>
                <p className="text-[8px] text-blue-300/70">v2.1.4 · Bug fixes + improvements</p>
              </div>
              <button className="text-[9px] font-bold text-amber-400 whitespace-nowrap">Refresh</button>
            </div>
          </div>

          {/* Bottom tab bar reference */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-600">Bottom tab bar — standalone mode</p>
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden w-52">
              <div className="flex items-center justify-around px-2 py-2.5 border-t border-slate-700">
                {[{ icon: Home, label: "Home", active: true }, { icon: Search, label: "Search" }, { icon: FileText, label: "Cases" }, { icon: Bell, label: "Alerts" }, { icon: User, label: "Profile" }].map(t => (
                  <div key={t.label} className={`flex flex-col items-center gap-0.5 px-1 ${t.active ? "" : ""}`}>
                    <t.icon size={16} className={t.active ? "text-amber-400" : "text-slate-500"} />
                    <span className={`text-[7px] font-medium ${t.active ? "text-amber-400" : "text-slate-500"}`}>{t.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pb-2">
                <div className="w-20 h-1 bg-white/15 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: Push Notifications ───────────────────────────────────────────

function PushNotifications() {
  const [toggles, setToggles] = useState({ app_updates: true, payments: true, sla: true, promo: false, maintenance: true });

  const NOTIF_TYPES = [
    { icon: AlertTriangle, color: "#EF4444", bg: "#1F0A0A", title: "SLA Breach Alert", body: "APP-7705 is overdue by 2 days. Immediate action required.", time: "now",    audience: "Staff / Admin" },
    { icon: FileText,      color: "#F59E0B", bg: "#1A1200", title: "Application Update",  body: "Your Schengen visa application has moved to 'Embassy Submitted'.", time: "5m",   audience: "Customer" },
    { icon: DollarSign,    color: "#10B981", bg: "#0A1A12", title: "Payment Received",     body: "AED 2,850.00 received for APP-7708. Processing your application.", time: "23m",  audience: "Customer" },
    { icon: UploadCloud,   color: "#F97316", bg: "#1A0E00", title: "Document Missing",     body: "Your Employment Letter was rejected. Please re-upload a clear copy.", time: "1h",   audience: "Customer" },
    { icon: CheckCircle2,  color: "#3B82F6", bg: "#050E1F", title: "Approval Needed",      body: "James Thornton — New York trip requires your approval (AED 12,400).", time: "2h",   audience: "Corporate" },
  ];

  return (
    <div className="space-y-8">
      {/* Permission priming + notification center side by side */}
      <div className="flex flex-wrap gap-8 items-start">
        {/* Permission priming */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-600">Permission priming screen — before OS prompt</p>
          <PhoneFrame h={520}>
            <div className="flex flex-col h-full bg-[#0D1117] px-4 pt-8 pb-6">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5">
                  <Bell size={28} className="text-amber-400" />
                </div>
                <p className="text-base font-bold text-white leading-tight">Stay updated on<br />your applications</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">Get instant alerts so you never miss an important update about your visa or travel booking.</p>
                <div className="mt-5 space-y-2.5 text-left w-full">
                  {[
                    "Application status changes",
                    "Payment confirmations",
                    "Document requests & reminders",
                    "SLA alerts and overdue notices",
                  ].map(b => (
                    <div key={b} className="flex items-center gap-2.5">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      <p className="text-[10px] text-slate-300">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full py-3 bg-[#14213D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <Bell size={13} /> Enable Notifications
                </button>
                <button className="w-full py-2 text-slate-500 text-xs">Not now</button>
                <p className="text-[8px] text-slate-700 text-center leading-tight">📱 iOS: Must install app to home screen to receive push notifications</p>
              </div>
            </div>
          </PhoneFrame>
        </div>

        {/* Notification types */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-600">Notification designs — all 5 key alert types</p>
          <div className="w-64 space-y-1.5">
            {NOTIF_TYPES.map(n => (
              <div key={n.title} className="rounded-xl px-3 py-2.5 border flex items-start gap-2.5" style={{ background: n.bg, borderColor: n.color + "33" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: n.color + "20" }}>
                  <n.icon size={14} style={{ color: n.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1 mb-0.5">
                    <p className="text-[10px] font-bold text-white leading-tight">{n.title}</p>
                    <span className="text-[8px] text-slate-600 flex-shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">{n.body}</p>
                  <span className="text-[7px] font-bold mt-1 inline-block" style={{ color: n.color }}>{n.audience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification settings */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-600">Notification settings — per-channel toggles</p>
          <div className="w-52 bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-700">
              <p className="text-xs font-bold text-slate-200">Notifications</p>
              <p className="text-[9px] text-slate-500 mt-0.5">Manage what you receive</p>
            </div>
            {[
              { key: "app_updates", label: "Application updates", sub: "Status changes, decisions" },
              { key: "payments",    label: "Payment confirmations", sub: "Receipts, refunds" },
              { key: "sla",         label: "SLA alerts",           sub: "Staff & Admin only" },
              { key: "promo",       label: "Promotional",          sub: "Offers, newsletters" },
              { key: "maintenance", label: "System alerts",        sub: "Downtime, updates" },
            ].map(row => (
              <div key={row.key} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-200 leading-none">{row.label}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">{row.sub}</p>
                </div>
                <button
                  onClick={() => setToggles(p => ({ ...p, [row.key]: !p[row.key as keyof typeof p] }))}
                  className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${toggles[row.key as keyof typeof toggles] ? "bg-amber-500" : "bg-slate-700"}`}>
                  <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${toggles[row.key as keyof typeof toggles] ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="px-3 py-2 bg-slate-800/40">
              <p className="text-[8px] text-slate-600 leading-tight">📱 iOS users: Push notifications require app installed to home screen. <span className="text-amber-600">Install now →</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 6: Responsive Breakpoints ───────────────────────────────────────

const BREAKPOINTS = [
  { px: 390,  label: "390px",  name: "Mobile S",      sidebar: "Bottom tab bar (4 icons)", grid: "1 col",      table: "Card list",      form: "1 col",      modal: "Full-screen sheet" },
  { px: 430,  label: "430px",  name: "Mobile L",      sidebar: "Bottom tab bar (5 icons)", grid: "1 col",      table: "Card list",      form: "1 col",      modal: "Full-screen sheet" },
  { px: 768,  label: "768px",  name: "Tablet portrait",sidebar:"Icon rail (44px)",         grid: "2 col",      table: "Horiz. scroll",  form: "1 col",      modal: "Bottom sheet 80vh" },
  { px: 834,  label: "834px",  name: "iPad landscape", sidebar:"Icon rail (44px)",          grid: "2 col",      table: "Horiz. scroll",  form: "2 col",      modal: "Centered 500px"    },
  { px: 1024, label: "1024px", name: "Small laptop",  sidebar: "Collapsed (44px)",         grid: "2-3 col",    table: "Full table",     form: "2 col",      modal: "Centered 520px"    },
  { px: 1440, label: "1440px", name: "Desktop",       sidebar: "Full sidebar (220px)",     grid: "4 col",      table: "Full table",     form: "2 col",      modal: "Centered 600px"    },
  { px: 1920, label: "1920px", name: "Wide",          sidebar: "Full sidebar (220px)",     grid: "4-5 col",    table: "Full table",     form: "2-3 col",    modal: "Centered 640px"    },
];

function CaseDetailFrame({ bp }: { bp: typeof BREAKPOINTS[0] }) {
  const isMobile = bp.px <= 430;
  const isTablet = bp.px >= 768 && bp.px < 1024;
  const isDesktop = bp.px >= 1024;
  const sidebarW = isMobile ? 0 : bp.px >= 1440 ? 220 : 44;

  const STAGES = ["Inquiry","Created","Passport","Checklist","Upload","AI Verify","Review","Invoice","Payment","Assign","Embassy","Processing","Approved"];
  const currentStage = 8;

  return (
    <div className="flex h-full text-[8px]" style={{ background: "#0D1117", color: "#E2E8F0" }}>
      {/* Sidebar / icon rail */}
      {!isMobile && (
        <div className="flex-shrink-0 flex flex-col items-center py-2 gap-1" style={{ width: sidebarW, background: "#080B12", borderRight: "1px solid #1E293B" }}>
          <div style={{ width: 16, height: 16, background: "linear-gradient(135deg,#F59E0B,#B45309)", borderRadius: 3, marginBottom: 4 }} />
          {isDesktop && sidebarW > 44 ? (
            <div className="w-full space-y-0.5 px-1">
              {["Dashboard","CRM","Customers","Visa","Ticketing","Hotels"].map(item => (
                <div key={item} style={{ padding: "3px 6px", borderRadius: 4, background: item === "Visa" ? "rgba(245,158,11,0.15)" : "transparent", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: 1, background: item === "Visa" ? "#F59E0B" : "#475569" }} />
                  <span style={{ color: item === "Visa" ? "#FCD34D" : "#64748B", fontSize: 6, fontWeight: item === "Visa" ? 700 : 400 }}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            [1,2,3,4,5,6].map(i => (
              <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: i === 3 ? "rgba(245,158,11,0.2)" : "#1E293B" }} />
            ))
          )}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ height: 22, display: "flex", alignItems: "center", padding: "0 8px", borderBottom: "1px solid #1E293B", background: "#0D1117", flexShrink: 0 }}>
          {isMobile && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1E293B", marginRight: 4 }} />}
          <span style={{ fontSize: 7, fontWeight: 700, color: "#CBD5E1" }}>APP-7705 · Sarah Chen · UK Visa</span>
          <div style={{ marginLeft: "auto", width: 14, height: 8, background: "#EF444420", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 5, color: "#EF4444", fontWeight: 700 }}>OVERDUE</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: isTablet && bp.px >= 834 ? "row" : "column", gap: 4, padding: 4 }}>
          {/* Timeline */}
          <div style={{ flex: isTablet && bp.px >= 834 ? "0 0 48%" : 1, overflow: "hidden" }}>
            <div style={{ fontSize: 6, color: "#64748B", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Workflow</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {STAGES.slice(0, isMobile ? 7 : 11).map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: i < currentStage ? "#10B981" : i === currentStage ? "#F59E0B" : "#1E293B", border: i === currentStage ? "1px solid #F59E0B" : "1px solid #334155" }} />
                  <span style={{ fontSize: 5.5, color: i <= currentStage ? "#CBD5E1" : "#334155", fontWeight: i === currentStage ? 700 : 400 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Docs */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 6, color: "#64748B", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Documents</div>
            {["Passport","Bank Stmt","Empl. Letter","Hotel Booking","Flight Itin"].map((d, i) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2, padding: "2px 0", borderBottom: "1px solid #0F172A" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: [1,1,0,0,1][i] ? "#10B981" : "#EF4444", flexShrink: 0 }} />
                <span style={{ fontSize: 5.5, color: "#94A3B8", flex: 1 }}>{d}</span>
                <span style={{ fontSize: 5, color: [1,1,0,0,1][i] ? "#10B981" : "#EF4444", fontWeight: 700 }}>{[1,1,0,0,1][i] ? "OK" : "FAIL"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tab bar for mobile */}
        {isMobile && (
          <div style={{ height: 24, borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-around", background: "#080B12", flexShrink: 0 }}>
            {["Home","Apps","Tasks","Me"].map((t, i) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: i === 1 ? "#F59E0B20" : "#1E293B" }} />
                <span style={{ fontSize: 4.5, color: i === 1 ? "#F59E0B" : "#475569" }}>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BreakpointSystem() {
  const SCALE = 0.44;
  const FRAME_H = 380;

  return (
    <div className="space-y-6">
      {/* Rules table */}
      <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-xs font-bold text-slate-300">Breakpoint rules reference</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider text-[9px]">
                {["Breakpoint","Name","Sidebar","Grid","Table","Form","Modal"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {BREAKPOINTS.map(bp => (
                <tr key={bp.px} className="hover:bg-slate-800/20">
                  <td className="px-3 py-2 font-mono text-amber-400 font-bold">{bp.label}</td>
                  <td className="px-3 py-2 text-slate-300">{bp.name}</td>
                  <td className="px-3 py-2 text-slate-400">{bp.sidebar}</td>
                  <td className="px-3 py-2 text-slate-400">{bp.grid}</td>
                  <td className="px-3 py-2 text-slate-400">{bp.table}</td>
                  <td className="px-3 py-2 text-slate-400">{bp.form}</td>
                  <td className="px-3 py-2 text-slate-400">{bp.modal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7 breakpoint frames */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Staff Case Detail — same screen at all 7 breakpoints</p>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 items-end" style={{ minWidth: "max-content" }}>
            {BREAKPOINTS.map(bp => (
              <div key={bp.px} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="relative overflow-hidden rounded-lg border border-slate-700/60 shadow-lg"
                  style={{ width: bp.px * SCALE, height: FRAME_H * SCALE }}>
                  <div style={{ width: bp.px, height: FRAME_H, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>
                    <CaseDetailFrame bp={bp} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-mono font-bold text-amber-400">{bp.label}</p>
                  <p className="text-[8px] text-slate-600">{bp.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 7: Touch & Accessibility ────────────────────────────────────────

function TouchAndA11y() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-10 items-start">
        {/* 44×44 targets */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">44×44px minimum tap targets</p>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-72">
            <div className="space-y-3">
              {[
                { label: "Primary CTA button",     ok: true,  size: "full × 48px" },
                { label: "Secondary action",        ok: true,  size: "full × 44px" },
                { label: "Tab bar item",            ok: true,  size: "min 56px × 44px" },
                { label: "Checkbox + label row",    ok: true,  size: "full × 44px" },
                { label: "Close (×) icon button",   ok: true,  size: "44×44px with padding" },
                { label: "Inline text link alone",  ok: false, size: "varies — needs padding" },
                { label: "Status badge (read-only)",ok: null,  size: "non-interactive → OK" },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${r.ok === true ? "bg-emerald-500/20 text-emerald-400" : r.ok === false ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-400"}`}>
                    {r.ok === true ? <Check size={11} /> : r.ok === false ? <X size={11} /> : <span className="text-[9px]">—</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-200">{r.label}</p>
                    <p className="text-[9px] font-mono text-slate-500">{r.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thumb reach */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Thumb reach zones</p>
          <div className="relative flex-shrink-0" style={{ width: 140, height: 280 }}>
            <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-slate-600 bg-[#0D1117]">
              {/* Reach zones */}
              <div className="absolute inset-x-0 bottom-0 rounded-b-3xl" style={{ height: "40%", background: "rgba(16,185,129,0.15)", borderTop: "1px dashed rgba(16,185,129,0.4)" }}>
                <p style={{ fontSize: 6, color: "#10B981", position: "absolute", left: 4, top: 4, fontWeight: 700 }}>EASY REACH</p>
              </div>
              <div className="absolute inset-x-0" style={{ top: "30%", height: "30%", background: "rgba(245,158,11,0.10)", borderTop: "1px dashed rgba(245,158,11,0.3)", borderBottom: "1px dashed rgba(245,158,11,0.3)" }}>
                <p style={{ fontSize: 6, color: "#F59E0B", position: "absolute", left: 4, top: 4, fontWeight: 700 }}>STRETCH</p>
              </div>
              <div className="absolute inset-x-0 top-0" style={{ height: "30%", background: "rgba(239,68,68,0.08)", borderBottom: "1px dashed rgba(239,68,68,0.3)" }}>
                <p style={{ fontSize: 6, color: "#EF4444", position: "absolute", left: 4, top: 4, fontWeight: 700 }}>HARD REACH</p>
              </div>
              {/* Content elements positioning */}
              <div style={{ position: "absolute", bottom: 12, left: 8, right: 8 }}>
                <div style={{ background: "#14213D", borderRadius: 8, padding: "6px 8px", marginBottom: 4, display: "flex", justifyContent: "space-around", borderTop: "1px solid #1E3570" }}>
                  {["H","A","T","P"].map(t => (
                    <div key={t} style={{ width: 20, height: 20, borderRadius: 4, background: "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, color: "#64748B" }}>{t}</div>
                  ))}
                </div>
                <div style={{ background: "#F59E0B", borderRadius: 8, padding: "5px 8px", textAlign: "center" }}>
                  <span style={{ fontSize: 7, fontWeight: 700, color: "#0D1117" }}>Primary Action ← Primary zone</span>
                </div>
              </div>
              <div style={{ position: "absolute", top: 24, right: 6, width: 18, height: 18, borderRadius: 4, background: "#334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 6, color: "#64748B" }}>⚙</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color + icon/label */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status — never color alone</p>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-72 space-y-4">
            <div>
              <p className="text-[9px] font-bold text-red-400 uppercase mb-2">✗ Color only (fails WCAG)</p>
              <div className="flex gap-2">
                {["Approved","Pending","Rejected"].map((s, i) => (
                  <div key={s} className="w-16 h-6 rounded flex items-center justify-center" style={{ background: ["#10B981","#F59E0B","#EF4444"][i] }}>
                    <span className="text-[8px] font-bold text-white">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-emerald-400 uppercase mb-2">✓ Color + icon + label (passes)</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Approved", icon: CheckCircle2, c: "#10B981", bg: "bg-emerald-500/15 border-emerald-500/30" },
                  { label: "Pending",  icon: Clock,         c: "#F59E0B", bg: "bg-amber-500/15 border-amber-500/30"   },
                  { label: "Rejected", icon: XCircle,       c: "#EF4444", bg: "bg-red-500/15 border-red-500/30"       },
                  { label: "Overdue",  icon: AlertTriangle, c: "#F97316", bg: "bg-orange-500/15 border-orange-500/30" },
                  { label: "SLA OK",   icon: CheckCircle2,  c: "#10B981", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map(s => (
                  <div key={s.label} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${s.bg}`}>
                    <s.icon size={11} style={{ color: s.c, flexShrink: 0 }} />
                    <span className="text-[10px] font-bold" style={{ color: s.c }}>{s.label}</span>
                    <span className="text-[8px] text-slate-500 ml-1">← icon + color + text</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation summary */}
      <div className="bg-slate-800/40 border border-emerald-500/20 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
        <p className="font-bold text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={13} /> Accessibility compliance summary</p>
        {[
          "All interactive elements: minimum 44×44px tap target (WCAG 2.5.5)",
          "Primary actions positioned in lower 40% of viewport (thumb reach zone)",
          "Status never communicated by color alone — always color + icon + label",
          "Text contrast: body text ≥ 4.5:1, large text ≥ 3:1 against backgrounds",
          "Focus indicators: ring-ring CSS token provides 2px visible focus outline",
          "Motion: all animations respect prefers-reduced-motion media query",
        ].map(note => (
          <div key={note} className="flex items-start gap-2">
            <Check size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "icons",      label: "Icons & Splash",    num: "01" },
  { id: "install",    label: "Install Flows",      num: "02" },
  { id: "offline",    label: "Offline States",     num: "03" },
  { id: "chrome",     label: "App Chrome",         num: "04" },
  { id: "push",       label: "Push Notifications", num: "05" },
  { id: "responsive", label: "Responsive System",  num: "06" },
  { id: "touch",      label: "Touch & A11y",       num: "07" },
];

type TabId = typeof TABS[number]["id"];

export default function PWAShowcase() {
  const [active, setActive] = useState<TabId>("icons");
  const tab = TABS.find(t => t.id === active)!;

  return (
    <div className="flex flex-col h-full bg-[#080B11] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 border-b border-slate-800 bg-gradient-to-r from-[#0D1117] to-[#080B11]">
        <div className="flex items-center gap-4">
          <STIcon size={40} />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.12em]">12.5 — PWA & Responsive</span>
              <Tag color="amber">Shanghai Travels</Tag>
            </div>
            <h1 className="text-xl font-black text-slate-100 tracking-tight">Progressive Web App Experience</h1>
            <p className="text-xs text-slate-500 mt-0.5">All four app audiences · Install flows · Offline · Push notifications · 7-breakpoint responsive system</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-600">
            <MonitorSmartphone size={14} className="text-slate-500" />
            <span>Customer · Agent · Staff · Admin</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-0 px-6 pt-0 border-b border-slate-800 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors flex-shrink-0 whitespace-nowrap ${
              active === t.id ? "text-amber-400 border-amber-400" : "text-slate-500 border-transparent hover:text-slate-300"
            }`}>
            <span className={`text-[9px] font-mono ${active === t.id ? "text-amber-600" : "text-slate-700"}`}>{t.num}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        <SectionHead num={tab.num} title={tab.label} sub={{
          icons:      "App icon set, maskable safe-zone previews, splash screens, and home screen placement",
          install:    "Android/Chrome auto-prompt + custom bottom sheet · iOS Safari manual step-by-step guide",
          offline:    "Offline banner, full fallback page, queued action states, cached data indicator, skeleton loaders",
          chrome:     "Standalone-mode safe areas, pull-to-refresh, bottom tab bar, in-app back, update toast",
          push:       "Permission priming, 5 notification types, notification center, per-channel settings",
          responsive: "7-breakpoint rule table + Staff Case Detail demonstrated at every width",
          touch:      "44×44px targets, thumb reach zones, color + icon + label status confirmation",
        }[active]} />

        {active === "icons"      && <IconsAndSplash />}
        {active === "install"    && <InstallFlows />}
        {active === "offline"    && <OfflineStates />}
        {active === "chrome"     && <AppChrome />}
        {active === "push"       && <PushNotifications />}
        {active === "responsive" && <BreakpointSystem />}
        {active === "touch"      && <TouchAndA11y />}
      </div>
    </div>
  );
}
