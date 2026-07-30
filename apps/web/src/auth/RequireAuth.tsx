import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/auth/AuthProvider";
import { FullPageSpinner } from "@/components/FullPageSpinner";

export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageSpinner />;
  if (status === "anon") {
    return <Navigate to="/login" state={{ returnTo: location.pathname }} replace />;
  }
  if (user?.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
