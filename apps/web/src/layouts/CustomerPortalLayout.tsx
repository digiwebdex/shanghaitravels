import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Landmark,
  MessageSquare,
  User,
  BarChart2,
  Package,
  Heart,
  Briefcase,
  History,
} from "lucide-react";
import { customerPortalApi } from "@/lib/portalApi";
import { customerPortalSearchHits } from "@/lib/portalSmartSearch";
import { PortalPasswordGate, PortalShell } from "@/layouts/portalChrome";

const NAV = [
  { to: "/portal/customer", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/portal/customer/packages", label: "Browse Packages", icon: Package },
  { to: "/portal/customer/packages/wishlist", label: "Wishlist", icon: Heart },
  { to: "/portal/customer/packages/my", label: "My Packages", icon: Briefcase },
  { to: "/portal/customer/packages/history", label: "Travel History", icon: History },
  { to: "/portal/customer/applications", label: "Bookings", icon: FileText },
  { to: "/portal/customer/documents", label: "Documents / OCR", icon: Upload },
  { to: "/portal/customer/finance", label: "Payments & Invoices", icon: Landmark },
  { to: "/portal/customer/communications", label: "Support", icon: MessageSquare },
  { to: "/portal/customer/profile", label: "Travel Profile", icon: User },
  { to: "/portal/customer/reports", label: "Reports", icon: BarChart2 },
];

export default function CustomerPortalLayout() {
  const nav = useNavigate();
  const [name, setName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void customerPortalApi
      .me()
      .then((m) => {
        setName(String(m.customer?.fullName || "Customer"));
        setEmail(String(m.user?.email || m.customer?.email || ""));
        setMustChange(!!m.user?.mustChangePassword);
      })
      .catch(() => nav("/portal/customer/login"));
  }, [nav]);

  async function logout() {
    await customerPortalApi.logout().catch(() => null);
    nav("/portal/customer/login");
  }

  async function changePw() {
    try {
      await customerPortalApi.changePassword(current, next);
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
      brandSubtitle="Customer Portal"
      nav={NAV}
      userName={name}
      userMeta={email}
      journey="Profile → Passport / OCR → Packages → Book → Pay → Track → Documents → Support"
      onLogout={() => void logout()}
      searchHits={customerPortalSearchHits}
      searchPlaceholder="Search your bookings, passport, documents…"
    >
      <Outlet />
    </PortalShell>
  );
}
