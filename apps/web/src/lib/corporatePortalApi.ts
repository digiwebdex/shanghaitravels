import { ERP } from "@/config/env";
import { ApiError } from "@/lib/api";

type Opts = { method?: string; body?: unknown; form?: FormData; skipRefresh?: boolean };

async function corporateRefresh(): Promise<boolean> {
  try {
    const r = await fetch(`${ERP}/portal/corporate/refresh`, { method: "POST", credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function corporateFetch<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
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
    if (await corporateRefresh()) res = await fetch(url, init);
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

export const corporatePortalApi = {
  login: (email: string, password: string) =>
    corporateFetch<{ ok: boolean; mustChangePassword: boolean }>("/portal/corporate/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    }),
  logout: () => corporateFetch("/portal/corporate/logout", { method: "POST", skipRefresh: true }),
  forgot: (email: string) =>
    corporateFetch<{ ok: boolean; devCode?: string }>("/portal/corporate/forgot-password", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  reset: (email: string, code: string, newPassword: string) =>
    corporateFetch("/portal/corporate/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
      skipRefresh: true,
    }),
  requestOtp: (email: string) =>
    corporateFetch<{ ok: boolean; devCode?: string }>("/portal/corporate/otp/request", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  verifyOtp: (email: string, code: string) =>
    corporateFetch("/portal/corporate/otp/verify", { method: "POST", body: { email, code }, skipRefresh: true }),
  changePassword: (currentPassword: string, newPassword: string) =>
    corporateFetch("/portal/corporate/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  me: () => corporateFetch<Record<string, any>>("/portal/corporate/me"),
  dashboard: () => corporateFetch<Record<string, any>>("/portal/corporate/dashboard"),
  company: () => corporateFetch<Record<string, any>>("/portal/corporate/company"),
  patchCompany: (body: Record<string, unknown>) =>
    corporateFetch("/portal/corporate/company", { method: "PATCH", body }),
  employees: () => corporateFetch<Record<string, any>[]>("/portal/corporate/employees"),
  createEmployee: (body: Record<string, unknown>) =>
    corporateFetch("/portal/corporate/employees", { method: "POST", body }),
  employee: (id: string) => corporateFetch<Record<string, any>>(`/portal/corporate/employees/${id}`),
  patchEmployee: (id: string, body: Record<string, unknown>) =>
    corporateFetch(`/portal/corporate/employees/${id}`, { method: "PATCH", body }),
  addEmergency: (id: string, body: Record<string, unknown>) =>
    corporateFetch(`/portal/corporate/employees/${id}/emergency`, { method: "POST", body }),
  travelRequests: () => corporateFetch<Record<string, any>[]>("/portal/corporate/travel-requests"),
  createTravelRequest: (body: Record<string, unknown>) =>
    corporateFetch<{ ok: boolean; id: string; reference?: string }>("/portal/corporate/travel-requests", {
      method: "POST",
      body,
    }),
  travelRequest: (id: string) => corporateFetch<Record<string, any>>(`/portal/corporate/travel-requests/${id}`),
  patchTravelRequest: (id: string, body: Record<string, unknown>) =>
    corporateFetch(`/portal/corporate/travel-requests/${id}`, { method: "PATCH", body }),
  submitTravelRequest: (id: string) =>
    corporateFetch(`/portal/corporate/travel-requests/${id}/submit`, { method: "POST" }),
  cancelTravelRequest: (id: string) =>
    corporateFetch(`/portal/corporate/travel-requests/${id}/cancel`, { method: "POST" }),
  approvals: () => corporateFetch<Record<string, any>[]>("/portal/corporate/approvals"),
  decide: (id: string, body: { decision: "approve" | "reject"; comment?: string }) =>
    corporateFetch(`/portal/corporate/approvals/${id}/decide`, { method: "POST", body }),
  bookings: () => corporateFetch<Record<string, any>[]>("/portal/corporate/bookings"),
  booking: (id: string) => corporateFetch<Record<string, any>>(`/portal/corporate/bookings/${id}`),
  finance: () => corporateFetch<Record<string, any>>("/portal/corporate/finance"),
  listDocuments: (applicationId: string) =>
    corporateFetch<Record<string, any>[]>(`/portal/corporate/applications/${applicationId}/documents`),
  uploadDocument: (applicationId: string, form: FormData) =>
    corporateFetch(`/portal/corporate/applications/${applicationId}/documents`, { method: "POST", form }),
  documentVersions: (id: string) =>
    corporateFetch<Record<string, any>[]>(`/portal/corporate/documents/${id}/versions`),
  downloadUrl: (id: string) => `${ERP}/portal/corporate/documents/${id}/download`,
  communications: () =>
    corporateFetch<{ messages: Record<string, any>[]; support: Record<string, any>[]; announcements?: Record<string, any>[] }>(
      "/portal/corporate/communications",
    ),
  support: (body: Record<string, unknown>) => corporateFetch("/portal/corporate/support", { method: "POST", body }),
  announcements: () => corporateFetch<Record<string, any>[]>("/portal/corporate/announcements"),
  postAnnouncement: (body: Record<string, unknown>) =>
    corporateFetch("/portal/corporate/announcements", { method: "POST", body }),
  approvalChain: () => corporateFetch<Record<string, any>>("/portal/corporate/approval-chain"),
  putApprovalChain: (body: Record<string, unknown>) =>
    corporateFetch("/portal/corporate/approval-chain", { method: "PUT", body }),
  reports: () => corporateFetch<Record<string, any>>("/portal/corporate/reports"),

  listPackages: (q?: { q?: string }) => {
    const qs = q?.q ? `?q=${encodeURIComponent(q.q)}` : "";
    return corporateFetch<Record<string, any>[]>(`/portal/corporate/packages${qs}`);
  },
  getPackage: (id: string) => corporateFetch<Record<string, any>>(`/portal/corporate/packages/${id}`),
  requestPackage: (body: Record<string, unknown>) =>
    corporateFetch<{ ok: boolean; id?: string; reference?: string }>("/portal/corporate/packages/request", {
      method: "POST",
      body,
    }),
};
