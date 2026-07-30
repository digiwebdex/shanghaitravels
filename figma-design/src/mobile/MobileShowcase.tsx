import { useState } from "react";
import { Smartphone, ChevronLeft, ChevronRight } from "lucide-react";
import CustomerApp from "./CustomerApp";
import AgentApp    from "./AgentApp";
import StaffApp    from "./StaffApp";
import AdminApp    from "./AdminApp";

const SCALE = 0.76;
const PH_W  = 375;
const PH_H  = 812;

const APPS = [
  {
    key:   "customer",
    label: "Customer App",
    sub:   "Apply, track & chat",
    color: "#F59E0B",
    badge: "iOS · Android",
    component: <CustomerApp/>,
  },
  {
    key:   "agent",
    label: "Agent App",
    sub:   "Wallet, bookings & commission",
    color: "#22C55E",
    badge: "iOS · Android",
    component: <AgentApp/>,
  },
  {
    key:   "staff",
    label: "Staff App",
    sub:   "Tasks, cases & team chat",
    color: "#0EA5E9",
    badge: "iOS · Android",
    component: <StaffApp/>,
  },
  {
    key:   "admin",
    label: "Admin App",
    sub:   "KPIs, approvals & alerts",
    color: "#A855F7",
    badge: "iOS · Android",
    component: <AdminApp/>,
  },
];

// Scale wrapper that preserves layout space
function PhoneFrame({ children, accentColor }: { children: React.ReactNode; accentColor: string }) {
  return (
    <div style={{
      width:  PH_W * SCALE,
      height: PH_H * SCALE,
      position: "relative",
      flexShrink: 0,
    }}>
      {/* Glow behind phone */}
      <div style={{
        position: "absolute",
        inset: "-12px",
        borderRadius: 54 * SCALE + 12,
        background: `radial-gradient(ellipse at center, ${accentColor}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }}/>
      {/* Scaled phone */}
      <div style={{
        position:        "absolute",
        top:             0,
        left:            0,
        transformOrigin: "top left",
        transform:       `scale(${SCALE})`,
        width:           PH_W,
        height:          PH_H,
        borderRadius:    54,
        overflow:        "hidden",
        boxShadow:       `0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)`,
      }}>
        {children}
      </div>
    </div>
  );
}

export default function MobileShowcase() {
  const [focused, setFocused] = useState<string | null>(null);
  const focusedApp = APPS.find(a => a.key === focused) ?? null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070B11",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* ── Top bar ── */}
      <div style={{ padding: "28px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg,#F59E0B,#D97706)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Smartphone size={18} color="#0D1117"/>
            </div>
            <p style={{ color: "#E6EDF3", fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>
              TravelOS Mobile
            </p>
          </div>
          <p style={{ color: "#8B949E", fontSize: 13 }}>
            4 native-grade mobile apps · iOS &amp; Android · One shared design system
          </p>
        </div>

        {focusedApp && (
          <button onClick={() => setFocused(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 12, background: "#161B22", border: "1px solid #30363D",
              color: "#E6EDF3", fontSize: 13, cursor: "pointer" }}>
            <ChevronLeft size={16}/> All Apps
          </button>
        )}
      </div>

      {/* ── Single-focus view ── */}
      {focusedApp ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "32px 40px" }}>
          <div style={{ display: "flex", gap: 60, alignItems: "flex-start", justifyContent: "center" }}>
            {/* Full-size phone */}
            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute", inset: "-20px",
                borderRadius: 74, pointerEvents: "none",
                background: `radial-gradient(ellipse at center, ${focusedApp.color}20 0%, transparent 70%)`,
              }}/>
              <div style={{ width: PH_W, height: PH_H, borderRadius: 54, overflow: "hidden",
                boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)` }}>
                {focusedApp.component}
              </div>
            </div>

            {/* Info panel */}
            <div style={{ width: 320, paddingTop: 48 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16,
                background: `${focusedApp.color}20`, border: `1px solid ${focusedApp.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Smartphone size={24} color={focusedApp.color}/>
              </div>
              <p style={{ color: "#8B949E", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: 1, marginBottom: 8 }}>{focusedApp.badge}</p>
              <p style={{ color: "#E6EDF3", fontSize: 28, fontWeight: 800, letterSpacing: -0.5,
                marginBottom: 8 }}>{focusedApp.label}</p>
              <p style={{ color: "#8B949E", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
                {focusedApp.sub}
              </p>

              {/* Feature list per app */}
              {focusedApp.key === "customer" && (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Login / Register + Face ID","Home dashboard with quick apply CTA","My Applications — list + case timeline","Document upload with Passport OCR viewfinder","Payments — outstanding balance + history","Live chat with support agents","Profile & settings"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${focusedApp.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: focusedApp.color }}/>
                      </div>
                      <p style={{ color: "#8B949E", fontSize: 13, lineHeight: 1.5 }}>{f}</p>
                    </li>
                  ))}
                </ul>
              )}
              {focusedApp.key === "agent" && (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Wallet balance + earnings overview","Today's bookings at a glance","Quick booking form (5 fields)","Passenger list with passport status","Commission trend — 6-month bar chart","Alert feed — confirmations & warnings"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${focusedApp.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: focusedApp.color }}/>
                      </div>
                      <p style={{ color: "#8B949E", fontSize: 13, lineHeight: 1.5 }}>{f}</p>
                    </li>
                  ))}
                </ul>
              )}
              {focusedApp.key === "staff" && (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["SLA-sorted task list with overdue highlighting","Condensed 14-stage case timeline","One-tap Quick Actions (approve/assign/escalate)","Team chat with thread list & live messaging","Staff profile with daily performance metrics"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${focusedApp.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: focusedApp.color }}/>
                      </div>
                      <p style={{ color: "#8B949E", fontSize: 13, lineHeight: 1.5 }}>{f}</p>
                    </li>
                  ))}
                </ul>
              )}
              {focusedApp.key === "admin" && (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Swipeable KPI cards — revenue, cases, SLA, staff","Revenue area chart with monthly trend","Tinder-style swipe-to-approve queue","SLA breach feed with acknowledge actions","6-month revenue breakdown by service type"].map(f => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${focusedApp.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: focusedApp.color }}/>
                      </div>
                      <p style={{ color: "#8B949E", fontSize: 13, lineHeight: 1.5 }}>{f}</p>
                    </li>
                  ))}
                </ul>
              )}

              {/* Switch apps */}
              <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
                {APPS.filter(a => a.key !== focusedApp.key).map(a => (
                  <button key={a.key} onClick={() => setFocused(a.key)}
                    style={{ padding: "7px 14px", borderRadius: 12,
                      background: "#161B22", border: "1px solid #30363D",
                      color: "#8B949E", fontSize: 12, cursor: "pointer" }}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── 4-up grid view ── */
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* App labels row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32,
            padding: "28px 40px 20px", overflowX: "auto" }}>
            {APPS.map(a => (
              <div key={a.key} style={{ width: PH_W * SCALE, flexShrink: 0, textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color }}/>
                  <p style={{ color: "#E6EDF3", fontSize: 14, fontWeight: 700 }}>{a.label}</p>
                </div>
                <p style={{ color: "#8B949E", fontSize: 11 }}>{a.sub}</p>
              </div>
            ))}
          </div>

          {/* Phones row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32,
            padding: "0 40px 40px", overflowX: "auto", alignItems: "flex-start" }}>
            {APPS.map(a => (
              <div key={a.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <PhoneFrame accentColor={a.color}>
                  {a.component}
                </PhoneFrame>
                <button onClick={() => setFocused(a.key)}
                  style={{ padding: "7px 20px", borderRadius: 20, fontSize: 12,
                    background: `${a.color}15`, border: `1px solid ${a.color}30`,
                    color: a.color, fontWeight: 700, cursor: "pointer" }}>
                  Focus →
                </button>
              </div>
            ))}
          </div>

          {/* Footer badge strip */}
          <div style={{ borderTop: "1px solid #1C2128", padding: "20px 40px",
            display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              "Plus Jakarta Sans · JetBrains Mono",
              "#0D1117 dark-first canvas",
              "#F59E0B amber gold accent",
              "iOS safe areas · bottom tab bar",
              "Full React state navigation",
              "Recharts data visualisations",
            ].map(tag => (
              <span key={tag} style={{ color: "#8B949E", fontSize: 11, display: "flex",
                alignItems: "center", gap: 5 }}>
                <span style={{ color: "#30363D" }}>·</span> {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
