import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Landmark,
  Upload,
  MessageSquare,
  BarChart2,
  Package,
} from "lucide-react";
import { agentPortalApi } from "@/lib/agentPortalApi";
import { PortalPasswordGate, PortalShell } from "@/layouts/portalChrome";

const NAV = [
  { to: "/portal/agent", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/portal/agent/packages", label: "Packages", icon: Package },
  { to: "/portal/agent/bookings", label: "Bookings", icon: Briefcase },
  { to: "/portal/agent/customers", label: "Customers", icon: Users },
  { to: "/portal/agent/finance", label: "Commission / Payments", icon: Landmark },
  { to: "/portal/agent/documents", label: "Documents / OCR", icon: Upload },
  { to: "/portal/agent/communications", label: "Communications", icon: MessageSquare },
  { to: "/portal/agent/reports", label: "Reports", icon: BarChart2 },
];

export default function AgentPortalLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Agent");
  const [code, setCode] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void agentPortalApi
      .me()
      .then((m) => {
        setName(String(m.agent?.name || "Agent"));
        setCode(String(m.agent?.code || ""));
        setMustChange(!!m.user?.mustChangePassword);
      })
      .catch(() => nav("/portal/agent/login"));
  }, [nav]);

  async function logout() {
    await agentPortalApi.logout().catch(() => null);
    nav("/portal/agent/login");
  }

  async function changePw() {
    try {
      await agentPortalApi.changePassword(current, next);
      setMustChange(false);
      setCurrent("");
      setNext("");
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Password change failed");
    }
  }

  if (mustChange) {
    return (
      <PortalPasswordGate
        current={current}
        next={next}
        error={error}
        onCurrent={setCurrent}
        onNext={setNext}
        onSave={() => void changePw()}
      />
    );
  }

  return (
    <PortalShell
      brandTitle="Shanghai Travels"
      brandSubtitle="Agent Portal"
      nav={NAV}
      userName={name}
      userMeta={code}
      journey="Packages → Commission → Customer → OCR → Booking request → Admin approval → Payment"
      onLogout={() => void logout()}
    >
      <Outlet />
    </PortalShell>
  );
}
