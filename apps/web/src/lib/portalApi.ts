import { ERP } from "@/config/env";
import { ApiError } from "@/lib/api";

type Opts = { method?: string; body?: unknown; form?: FormData; skipRefresh?: boolean };

async function portalRefresh(): Promise<boolean> {
  try {
    const r = await fetch(`${ERP}/portal/customer/refresh`, { method: "POST", credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

/** Customer-portal fetch — uses st_customer cookies; refreshes via /portal/customer/refresh. */
export async function portalFetch<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const init: RequestInit = {
    method: opts.method || "GET",
    credentials: "include",
    headers,
  };
  if (opts.form) init.body = opts.form;
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }
  const url = `${ERP}${path.startsWith("/") ? path : `/${path}`}`;
  let res = await fetch(url, init);
  if (res.status === 401 && !opts.skipRefresh) {
    if (await portalRefresh()) res = await fetch(url, init);
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

export const customerPortalApi = {
  register: (body: Record<string, unknown>) =>
    portalFetch<{ ok: boolean; email: string; devCode?: string }>("/portal/customer/register", {
      method: "POST",
      body,
      skipRefresh: true,
    }),
  verifyEmail: (email: string, code: string) =>
    portalFetch("/portal/customer/verify-email", { method: "POST", body: { email, code }, skipRefresh: true }),
  login: (email: string, password: string) =>
    portalFetch<{ ok: boolean; mustChangePassword: boolean }>("/portal/customer/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    }),
  logout: () => portalFetch("/portal/customer/logout", { method: "POST", skipRefresh: true }),
  forgot: (email: string) =>
    portalFetch<{ ok: boolean; devCode?: string }>("/portal/customer/forgot-password", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  reset: (email: string, code: string, newPassword: string) =>
    portalFetch("/portal/customer/reset-password", {
      method: "POST",
      body: { email, code, newPassword },
      skipRefresh: true,
    }),
  requestOtp: (email: string) =>
    portalFetch<{ ok: boolean; devCode?: string }>("/portal/customer/otp/request", {
      method: "POST",
      body: { email },
      skipRefresh: true,
    }),
  verifyOtp: (email: string, code: string) =>
    portalFetch("/portal/customer/otp/verify", { method: "POST", body: { email, code }, skipRefresh: true }),
  me: () => portalFetch<{ customer: Record<string, unknown>; user: Record<string, unknown> }>("/portal/customer/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    portalFetch("/portal/customer/change-password", { method: "POST", body: { currentPassword, newPassword } }),
  updateProfile: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/profile", { method: "PATCH", body }),
  dashboard: () => portalFetch<Record<string, unknown>>("/portal/customer/dashboard"),
  applications: (q?: { serviceType?: string }) => {
    const qs = q?.serviceType ? `?serviceType=${encodeURIComponent(q.serviceType)}` : "";
    return portalFetch<Record<string, unknown>[]>(`/portal/customer/applications${qs}`);
  },
  application: (id: string) => portalFetch<Record<string, unknown>>(`/portal/customer/applications/${id}`),
  createApplication: (body: Record<string, unknown>) =>
    portalFetch<{ ok: boolean; id: string; referenceNo: string }>("/portal/customer/applications", {
      method: "POST",
      body,
    }),
  documents: () => portalFetch<Record<string, unknown>[]>("/portal/customer/documents"),
  documentVersions: (id: string) =>
    portalFetch<Record<string, unknown>[]>(`/portal/customer/documents/${id}/versions`),
  uploadDocument: (form: FormData) =>
    portalFetch("/portal/customer/documents", { method: "POST", form }),
  downloadUrl: (id: string) => `${ERP}/portal/customer/documents/${id}/download`,
  /** Public OCR endpoint (rate-limited) for document intelligence in the customer portal. */
  ocrScan: async (file: File, docType = "auto") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    const res = await fetch(`${ERP}/public/ocr/scan`, { method: "POST", body: fd, credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: string }).message)
          : `HTTP ${res.status}`;
      throw new ApiError(msg, res.status, data);
    }
    return data as Record<string, unknown>;
  },
  finance: () => portalFetch<Record<string, unknown>>("/portal/customer/finance"),
  communications: () => portalFetch<{ messages: Record<string, unknown>[]; support: Record<string, unknown>[] }>(
    "/portal/customer/communications",
  ),
  support: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/support", { method: "POST", body }),
  passports: () => portalFetch<Record<string, unknown>[]>("/portal/customer/profile/passports"),
  upsertPassport: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/profile/passports", { method: "POST", body }),
  family: () => portalFetch<Record<string, unknown>[]>("/portal/customer/profile/family"),
  addFamily: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/profile/family", { method: "POST", body }),
  travellers: () => portalFetch<Record<string, unknown>[]>("/portal/customer/profile/travellers"),
  addTraveller: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/profile/travellers", { method: "POST", body }),
  emergency: () => portalFetch<Record<string, unknown>[]>("/portal/customer/profile/emergency"),
  addEmergency: (body: Record<string, unknown>) =>
    portalFetch("/portal/customer/profile/emergency", { method: "POST", body }),
  reports: () => portalFetch<Record<string, unknown>>("/portal/customer/reports"),

  listPackages: (q?: { q?: string; collection?: string }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.collection) p.set("collection", q.collection);
    const qs = p.toString();
    return portalFetch<Record<string, unknown>[]>(`/portal/customer/packages${qs ? `?${qs}` : ""}`);
  },
  getPackage: (id: string) => portalFetch<Record<string, unknown>>(`/portal/customer/packages/${id}`),
  wishlist: () => portalFetch<Record<string, unknown>[]>("/portal/customer/packages/wishlist"),
  addWishlist: (packageId: string) =>
    portalFetch("/portal/customer/packages/wishlist", { method: "POST", body: { packageId } }),
  removeWishlist: (packageId: string) =>
    portalFetch(`/portal/customer/packages/wishlist/${packageId}`, { method: "DELETE" }),
  enquirePackage: (body: Record<string, unknown>) =>
    portalFetch<{ ok: boolean; id?: string }>("/portal/customer/packages/enquire", { method: "POST", body }),
  packageApplications: () =>
    portalFetch<Record<string, unknown>[]>("/portal/customer/packages/applications"),
  packageHistory: () => portalFetch<Record<string, unknown>[]>("/portal/customer/packages/history"),
};
