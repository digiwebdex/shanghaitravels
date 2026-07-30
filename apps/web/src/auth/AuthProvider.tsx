import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/services";
import type { Me } from "@/lib/types";
import { ApiError, onAuthLost } from "@/lib/api";

type AuthStatus = "loading" | "authed" | "anon";

type AuthContextValue = {
  user: Me | null;
  status: AuthStatus;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: Me | null) => void;
  can: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const load = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authed");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        try {
          await authApi.refresh();
          const me = await authApi.me();
          setUser(me);
          setStatus("authed");
          return;
        } catch {
          /* fall through */
        }
      }
      setUser(null);
      setStatus("anon");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    setStatus("anon");
  }, []);

  // Mid-session 401 after failed refresh → force anon (RequireAuth sends to /login)
  useEffect(() => {
    return onAuthLost(() => {
      setUser(null);
      setStatus("anon");
    });
  }, []);

  const can = useCallback(
    (perm: string) => {
      if (!user) return false;
      if (user.role === "super_admin") return true;
      return (user.permissions || []).includes(perm);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, status, refetch: load, logout, setUser, can }),
    [user, status, load, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
