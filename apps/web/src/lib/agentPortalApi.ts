import { ERP } from "@/config/env";
import { ApiError } from "@/lib/api";

type Opts = { method?: string; body?: unknown; form?: FormData; skipRefresh?: boolean };

async function agentRefresh(): Promise<boolean> {
  try {
    const r = await fetch(`${ERP}/portal/agent/refresh`, { method: "POST", credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function agentFetch<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = { method: opts.method || "GET", credentials: "include", headers };
  if (opts.form) init.body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  const url = `${ERP}${path.startsWith("/") ? path : `/${path}`}`;
  let res = await fetch(url, init);
  if (res.status === 401 && !opts.skipRefresh) {
    if (await agentRefresh()) res = await fetch(url, init);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(", ")
          : String((data as { message: string }).message)
        : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export const agentPortalApi = {
  login: (email: string, password: string) =>
    agentFetch<{ ok: boolean; mustChangePassword: boolean }>("/portal/agent/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    }),
  logout: () => agentFetch("/portal/agent/logout", { method: "POST", skipRefresh: true }),
  forgot: (email: string) =>
    agentFetch<{ ok: boolean; devCode?: string }>("/portal/agent/forgot-password", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  reset: (email: string, code: string, newPassword: string) =>
    agentFetch("/portal/agent/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
      skipRefresh: true,
    }),
  requestOtp: (email: string) =>
    agentFetch<{ ok: boolean; devCode?: string }>("/portal/agent/otp/request", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  verifyOtp: (email: string, code: string) =>
    agentFetch("/portal/agent/otp/verify", { method: "POST", body: { email, code }, skipRefresh: true }),
  changePassword: (currentPassword: string, newPassword: string) =>
    agentFetch("/portal/agent/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  me: () => agentFetch<Record<string, any>>("/portal/agent/me"),
  dashboard: () => agentFetch<Record<string, any>>("/portal/agent/dashboard"),
  cases: (q?: { serviceType?: string }) => {
    const qs = q?.serviceType ? `?serviceType=${encodeURIComponent(q.serviceType)}` : "";
    return agentFetch<Record<string, any>[]>(`/portal/agent/cases${qs}`);
  },
  caseGet: (id: string) => agentFetch<Record<string, any>>(`/portal/agent/cases/${id}`),
  createCase: (body: Record<string, unknown>) =>
    agentFetch<{ ok: boolean; id: string; reference: string }>("/portal/agent/cases", { method: "POST", body }),
  customers: () => agentFetch<Record<string, any>[]>("/portal/agent/customers"),
  customer: (id: string) => agentFetch<Record<string, any>>(`/portal/agent/customers/${id}`),
  createCustomer: (body: Record<string, unknown>) =>
    agentFetch("/portal/agent/customers", { method: "POST", body }),
  upsertPassport: (customerId: string, body: Record<string, unknown>) =>
    agentFetch(`/portal/agent/customers/${customerId}/passports`, { method: "POST", body }),
  addTraveller: (customerId: string, body: Record<string, unknown>) =>
    agentFetch(`/portal/agent/customers/${customerId}/travellers`, { method: "POST", body }),
  finance: () => agentFetch<Record<string, any>>("/portal/agent/finance"),
  documents: () => agentFetch<Record<string, any>[]>("/portal/agent/documents"),
  documentVersions: (id: string) => agentFetch<Record<string, any>[]>(`/portal/agent/documents/${id}/versions`),
  uploadDocument: (form: FormData) => agentFetch("/portal/agent/documents", { method: "POST", form }),
  downloadUrl: (id: string) => `${ERP}/portal/agent/documents/${id}/download`,
  communications: () =>
    agentFetch<{ messages: Record<string, any>[]; support: Record<string, any>[] }>("/portal/agent/communications"),
  support: (body: Record<string, unknown>) =>
    agentFetch("/portal/agent/support", { method: "POST", body }),
  reports: () => agentFetch<Record<string, any>>("/portal/agent/reports"),

  listPackages: (q?: { q?: string }) => {
    const qs = q?.q ? `?q=${encodeURIComponent(q.q)}` : "";
    return agentFetch<Record<string, any>[]>(`/portal/agent/packages${qs}`);
  },
  getPackage: (id: string) => agentFetch<Record<string, any>>(`/portal/agent/packages/${id}`),
  bookPackage: (body: Record<string, unknown>) =>
    agentFetch<{ ok: boolean; id?: string; reference?: string }>("/portal/agent/packages/book", {
      method: "POST",
      body,
    }),
};
