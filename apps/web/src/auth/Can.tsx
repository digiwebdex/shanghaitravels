import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";

/** Hide children unless the user has the permission (super_admin always passes). */
export function Can({ perm, children }: { perm: string; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(perm)) return null;
  return <>{children}</>;
}
