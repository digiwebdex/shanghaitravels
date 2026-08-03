import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  CheckSquare,
  Briefcase,
  Landmark,
  MessageSquare,
  BarChart2,
  Package,
} from "lucide-react";
import { corporatePortalApi } from "@/lib/corporatePortalApi";
import { corporatePortalSearchHits } from "@/lib/portalSmartSearch";
import { PortalPasswordGate, PortalShell } from "@/layouts/portalChrome";

const NAV = [
  { to: "/portal/corporate", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/portal/corporate/company", label: "Company", icon: Building2 },
  { to: "/portal/corporate/packages", label: "Packages", icon: Package },
  { to: "/portal/corporate/employees", label: "Employees", icon: Users },
  { to: "/portal/corporate/requests", label: "Travel Requests", icon: FileText },
  { to: "/portal/corporate/approvals", label: "Approvals", icon: CheckSquare },
  { to: "/portal/corporate/bookings", label: "Bookings", icon: Briefcase },
  { to: "/portal/corporate/finance", label: "Invoices / Payments", icon: Landmark },
  { to: "/portal/corporate/communications", label: "Communications", icon: MessageSquare },
  { to: "/portal/corporate/reports", label: "Reports", icon: BarChart2 },
];

export default function CorporatePortalLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Corporate user");
  const [companyName, setCompanyName] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void corporatePortalApi
      .me()
      .then((m) => {
        setName(String(m.user?.name || m.user?.email || "Corporate user"));
        setCompanyName(String(m.company?.companyName || ""));
        setMustChange(!!m.user?.mustChangePassword);
      })
      .catch(() => nav("/portal/corporate/login"));
  }, [nav]);

  async function logout() {
    await corporatePortalApi.logout().catch(() => null);
    nav("/portal/corporate/login");
  }

  async function changePw() {
    try {
      await corporatePortalApi.changePassword(current, next);
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
      brandSubtitle="Corporate Portal"
      nav={NAV}
      userName={name}
      userMeta={companyName}
      journey="Company → Employee → Request → Approval → Booking → Invoice → Payment → Reports"
      onLogout={() => void logout()}
      searchHits={corporatePortalSearchHits}
      searchPlaceholder="Search employees, bookings, passport…"
    >
      <Outlet />
    </PortalShell>
  );
}
