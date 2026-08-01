import { Outlet } from "react-router";
import { SiteHeader } from "../home/v4/SiteHeader";
import { SiteFooter } from "../home/v4/SiteFooter";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
