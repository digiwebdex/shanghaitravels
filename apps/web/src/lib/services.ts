import { apiFetch, listOf } from "@/lib/api";
import type {
  Account,
  AppDocument,
  Application,
  Customer,
  HotelProperty,
  Invoice,
  Journey,
  Me,
  OcrScan,
  Paginated,
  Passport,
  StaffUser,
  Supplier,
  TourDeparture,
  TourDestination,
  TourPackageProduct,
  TransportRoute,
  TransportVehicleType,
  HajjGroup,
  HajjPilgrim,
  HajjUmrahPackageProduct,
  AccountingPeriod,
  CostCenter,
  CurrencyRow,
  ExchangeRateRow,
  FiscalYear,
  GlAccount,
  GlAccountGroup,
  JournalEntry,
  VisaDetail,
} from "@/lib/types";

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ ok: boolean; mustChangePassword: boolean }>("/auth/login", {
      method: "POST",
      body: { email, password },
      skipRefresh: true,
    }),
  me: () => apiFetch<Me>("/auth/me", { skipRefresh: true }),
  refresh: () => apiFetch("/auth/refresh", { method: "POST", skipRefresh: true }),
  logout: () => apiFetch("/auth/logout", { method: "POST", skipRefresh: true }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
};

export const customersApi = {
  list: (q?: { page?: number; limit?: number; q?: string }) => {
    const p = new URLSearchParams();
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    if (q?.q) p.set("q", q.q);
    const qs = p.toString();
    return apiFetch<Paginated<Customer> | Customer[]>(`/customers${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Customer>(`/customers/${id}`),
  create: (body: Partial<Customer>) => apiFetch<Customer>("/customers", { method: "POST", body }),
  update: (id: string, body: Partial<Customer>) =>
    apiFetch<Customer>(`/customers/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
};

export const applicationsApi = {
  list: (q?: { page?: number; limit?: number; q?: string; serviceType?: string; status?: string }) => {
    const p = new URLSearchParams();
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    if (q?.q) p.set("q", q.q);
    if (q?.serviceType) p.set("serviceType", q.serviceType);
    if (q?.status) p.set("status", q.status);
    const qs = p.toString();
    return apiFetch<Paginated<Application> | Application[]>(`/applications${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Application>(`/applications/${id}`),
  journey: (id: string) => apiFetch<Journey>(`/applications/${id}/journey`),
  create: (body: Record<string, unknown>) =>
    apiFetch<Application>("/applications", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<Application>(`/applications/${id}`, { method: "PATCH", body }),
  advance: (id: string, note?: string) =>
    apiFetch(`/applications/${id}/advance-stage`, {
      method: "POST",
      body: note ? { note } : {},
    }),
  note: (id: string, message: string) =>
    apiFetch(`/applications/${id}/note`, { method: "POST", body: { message } }),
  assign: (id: string, assignedTo: string | null) =>
    apiFetch(`/applications/${id}/assign`, { method: "POST", body: { assignedTo } }),
  approve: (id: string) => apiFetch(`/applications/${id}/approve`, { method: "POST" }),
  putVisa: (id: string, body: Partial<VisaDetail>) =>
    apiFetch(`/applications/${id}/visa`, { method: "PUT", body }),
  /** Phase 4+ service detail (air_ticket | hotel | tour | transport | …). */
  putDetail: (id: string, serviceType: string, body: Record<string, unknown>) =>
    apiFetch(`/applications/${id}/detail/${serviceType}`, { method: "PUT", body }),
  documents: (id: string) =>
    apiFetch<AppDocument[] | { data: AppDocument[] }>(`/applications/${id}/documents`).then((r) =>
      listOf<AppDocument>(r),
    ),
  uploadDocument: (id: string, file: File, category: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    return apiFetch(`/applications/${id}/documents`, { method: "POST", form: fd });
  },
  getChecklist: (id: string) =>
    apiFetch<{
      items: {
        itemKey: string;
        checked: boolean;
        checkedAt?: string | null;
        checkedBy?: string | null;
        checkedByName?: string | null;
        updatedAt?: string;
      }[];
    }>(`/applications/${id}/checklist`),
  putChecklist: (id: string, updates: { itemKey: string; checked: boolean }[]) =>
    apiFetch<{
      items: {
        itemKey: string;
        checked: boolean;
        checkedAt?: string | null;
        checkedBy?: string | null;
        checkedByName?: string | null;
        updatedAt?: string;
      }[];
    }>(`/applications/${id}/checklist`, { method: "PUT", body: { updates } }),
};

export const passportsApi = {
  create: (body: {
    customerId: string;
    passportNo: string;
    issuingCountry?: string;
    dateOfIssue?: string;
    dateOfExpiry?: string;
    isPrimary?: boolean;
  }) => apiFetch<Passport>("/passports", { method: "POST", body }),
};

export const ocrApi = {
  scan: (file: File, extra?: { customerId?: string; applicationId?: string }) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", "passport");
    if (extra?.customerId) fd.append("customerId", extra.customerId);
    if (extra?.applicationId) fd.append("applicationId", extra.applicationId);
    return apiFetch<OcrScan>("/ocr/scan", { method: "POST", form: fd });
  },
  apply: (
    id: string,
    body: {
      customerId: string;
      fields: Record<string, string | undefined>;
      isPrimary?: boolean;
    },
  ) => apiFetch(`/ocr/${id}/apply`, { method: "POST", body }),
};

export const financeApi = {
  listInvoices: (q?: { applicationId?: string; customerId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.customerId) p.set("customerId", q.customerId);
    if (q?.limit) p.set("limit", String(q.limit ?? 50));
    const qs = p.toString();
    return apiFetch<Paginated<Invoice> | Invoice[]>(`/invoices${qs ? `?${qs}` : ""}`);
  },
  getInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}`),
  createInvoice: (body: Record<string, unknown>) =>
    apiFetch<Invoice>("/invoices", { method: "POST", body }),
  issueInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/issue`, { method: "POST" }),
  recordPayment: (body: Record<string, unknown>) =>
    apiFetch("/payments", { method: "POST", body }),
  /** Separate permission: payment:refund */
  recordRefund: (body: Record<string, unknown>) =>
    apiFetch("/payments/refund", { method: "POST", body }),
  accounts: () => apiFetch<Account[]>("/accounts"),
};

export const usersApi = {
  list: () => apiFetch<StaffUser[]>("/users"),
  /** Staff picker for assignment — requires application:assign, not user:manage. */
  assignable: () => apiFetch<StaffUser[]>("/users/assignable"),
};

export const settingsApi = {
  list: () => apiFetch<{ key: string; value: unknown }[]>("/settings"),
};

/** Hotel master (reference catalog) — not a bed-bank API. */
export const hotelsApi = {
  list: (q?: { q?: string; city?: string; country?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.city) p.set("city", q.city);
    if (q?.country) p.set("country", q.country);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<Paginated<HotelProperty> | { data: HotelProperty[]; total: number }>(
      `/reference/hotels${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Partial<HotelProperty>) =>
    apiFetch<HotelProperty>("/reference/hotels", { method: "POST", body }),
  update: (id: string, body: Partial<HotelProperty>) =>
    apiFetch<HotelProperty>(`/reference/hotels/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/hotels/${id}`, { method: "DELETE" }),
};

export const suppliersApi = {
  list: (q?: { type?: string; q?: string; page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.type) p.set("type", q.type);
    if (q?.q) p.set("q", q.q);
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit ?? 50));
    const qs = p.toString();
    return apiFetch<Paginated<Supplier>>(`/suppliers${qs ? `?${qs}` : ""}`);
  },
  create: (body: Partial<Supplier> & { name: string }) =>
    apiFetch<Supplier>("/suppliers", { method: "POST", body }),
  update: (id: string, body: Partial<Supplier>) =>
    apiFetch<Supplier>(`/suppliers/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/suppliers/${id}`, { method: "DELETE" }),
};

/** Supplier vehicle offer catalog — not fleet inventory. */
export const transportVehiclesApi = {
  list: (q?: { q?: string; category?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.category) p.set("category", q.category);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: TransportVehicleType[]; total: number }>(
      `/reference/transport-vehicles${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Partial<TransportVehicleType> & { name: string; category: string }) =>
    apiFetch<TransportVehicleType>("/reference/transport-vehicles", { method: "POST", body }),
  update: (id: string, body: Partial<TransportVehicleType>) =>
    apiFetch<TransportVehicleType>(`/reference/transport-vehicles/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/transport-vehicles/${id}`, { method: "DELETE" }),
};

export const transportRoutesApi = {
  list: (q?: { q?: string; kind?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.kind) p.set("kind", q.kind);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: TransportRoute[]; total: number }>(
      `/reference/transport-routes${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Partial<TransportRoute> & { name: string; origin: string; destination: string; kind: string }) =>
    apiFetch<TransportRoute>("/reference/transport-routes", { method: "POST", body }),
  update: (id: string, body: Partial<TransportRoute>) =>
    apiFetch<TransportRoute>(`/reference/transport-routes/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/transport-routes/${id}`, { method: "DELETE" }),
};

export const tourPackagesApi = {
  list: (q?: { q?: string; category?: string; packageType?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.category) p.set("category", q.category);
    if (q?.packageType) p.set("packageType", q.packageType);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: TourPackageProduct[]; total: number }>(
      `/reference/tour-packages${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => apiFetch<TourPackageProduct>(`/reference/tour-packages/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch<TourPackageProduct>("/reference/tour-packages", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<TourPackageProduct>(`/reference/tour-packages/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/tour-packages/${id}`, { method: "DELETE" }),
};

export const tourDeparturesApi = {
  list: (q?: { packageId?: string; status?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.packageId) p.set("packageId", q.packageId);
    if (q?.status) p.set("status", q.status);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: TourDeparture[]; total: number }>(
      `/reference/tour-departures${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Record<string, unknown>) =>
    apiFetch<TourDeparture>("/reference/tour-departures", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<TourDeparture>(`/reference/tour-departures/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/tour-departures/${id}`, { method: "DELETE" }),
};

export const tourDestinationsApi = {
  list: (q?: { q?: string; country?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.country) p.set("country", q.country);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: TourDestination[]; total: number }>(
      `/reference/tour-destinations${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Partial<TourDestination> & { name: string }) =>
    apiFetch<TourDestination>("/reference/tour-destinations", { method: "POST", body }),
  update: (id: string, body: Partial<TourDestination>) =>
    apiFetch<TourDestination>(`/reference/tour-destinations/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/tour-destinations/${id}`, { method: "DELETE" }),
};

export const hajjPackagesApi = {
  list: (q?: { q?: string; kind?: string; category?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.kind) p.set("kind", q.kind);
    if (q?.category) p.set("category", q.category);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: HajjUmrahPackageProduct[]; total: number }>(
      `/reference/hajj-packages${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => apiFetch<HajjUmrahPackageProduct>(`/reference/hajj-packages/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch<HajjUmrahPackageProduct>("/reference/hajj-packages", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<HajjUmrahPackageProduct>(`/reference/hajj-packages/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/hajj-packages/${id}`, { method: "DELETE" }),
};

export const hajjPilgrimsApi = {
  list: (q?: { q?: string; visaStatus?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.visaStatus) p.set("visaStatus", q.visaStatus);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: HajjPilgrim[]; total: number }>(
      `/reference/hajj-pilgrims${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Record<string, unknown>) =>
    apiFetch<HajjPilgrim>("/reference/hajj-pilgrims", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<HajjPilgrim>(`/reference/hajj-pilgrims/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/hajj-pilgrims/${id}`, { method: "DELETE" }),
};

export const hajjGroupsApi = {
  list: (q?: { q?: string; kind?: string; status?: string; packageId?: string; active?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.kind) p.set("kind", q.kind);
    if (q?.status) p.set("status", q.status);
    if (q?.packageId) p.set("packageId", q.packageId);
    if (q?.active) p.set("active", q.active);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<{ data: HajjGroup[]; total: number }>(
      `/reference/hajj-groups${qs ? `?${qs}` : ""}`,
    );
  },
  create: (body: Record<string, unknown>) =>
    apiFetch<HajjGroup>("/reference/hajj-groups", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<HajjGroup>(`/reference/hajj-groups/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/reference/hajj-groups/${id}`, { method: "DELETE" }),
};

export const glApi = {
  bootstrap: () => apiFetch<{ bootstrapped: boolean; message?: string }>("/gl/bootstrap", { method: "POST", body: {} }),
  listGroups: () => apiFetch<GlAccountGroup[]>("/gl/account-groups"),
  createGroup: (body: Record<string, unknown>) =>
    apiFetch<GlAccountGroup>("/gl/account-groups", { method: "POST", body }),
  updateGroup: (id: string, body: Record<string, unknown>) =>
    apiFetch<GlAccountGroup>(`/gl/account-groups/${id}`, { method: "PATCH", body }),
  listAccounts: (q?: { q?: string; type?: string; active?: string }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.type) p.set("type", q.type);
    if (q?.active) p.set("active", q.active);
    const qs = p.toString();
    return apiFetch<GlAccount[]>(`/gl/accounts${qs ? `?${qs}` : ""}`);
  },
  createAccount: (body: Record<string, unknown>) =>
    apiFetch<GlAccount>("/gl/accounts", { method: "POST", body }),
  updateAccount: (id: string, body: Record<string, unknown>) =>
    apiFetch<GlAccount>(`/gl/accounts/${id}`, { method: "PATCH", body }),
  listFiscalYears: () => apiFetch<FiscalYear[]>("/gl/fiscal-years"),
  createFiscalYear: (body: Record<string, unknown>) =>
    apiFetch<FiscalYear>("/gl/fiscal-years", { method: "POST", body }),
  createPeriod: (body: Record<string, unknown>) =>
    apiFetch<AccountingPeriod>("/gl/periods", { method: "POST", body }),
  closePeriod: (id: string) => apiFetch<AccountingPeriod>(`/gl/periods/${id}/close`, { method: "POST", body: {} }),
  reopenPeriod: (id: string) => apiFetch<AccountingPeriod>(`/gl/periods/${id}/reopen`, { method: "POST", body: {} }),
  listCostCenters: () => apiFetch<CostCenter[]>("/gl/cost-centers"),
  createCostCenter: (body: Record<string, unknown>) =>
    apiFetch<CostCenter>("/gl/cost-centers", { method: "POST", body }),
  listCurrencies: () => apiFetch<CurrencyRow[]>("/gl/currencies"),
  createCurrency: (body: Record<string, unknown>) =>
    apiFetch<CurrencyRow>("/gl/currencies", { method: "POST", body }),
  listExchangeRates: () => apiFetch<ExchangeRateRow[]>("/gl/exchange-rates"),
  createExchangeRate: (body: Record<string, unknown>) =>
    apiFetch<ExchangeRateRow>("/gl/exchange-rates", { method: "POST", body }),
  listJournals: (q?: { status?: string; periodId?: string; type?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.type) p.set("type", q.type);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<JournalEntry[]>(`/gl/journals${qs ? `?${qs}` : ""}`);
  },
  getJournal: (id: string) => apiFetch<JournalEntry>(`/gl/journals/${id}`),
  createJournal: (body: Record<string, unknown>) =>
    apiFetch<JournalEntry>("/gl/journals", { method: "POST", body }),
  updateJournal: (id: string, body: Record<string, unknown>) =>
    apiFetch<JournalEntry>(`/gl/journals/${id}`, { method: "PATCH", body }),
  submitJournal: (id: string) => apiFetch<JournalEntry>(`/gl/journals/${id}/submit`, { method: "POST", body: {} }),
  approveJournal: (id: string) => apiFetch<JournalEntry>(`/gl/journals/${id}/approve`, { method: "POST", body: {} }),
  rejectJournal: (id: string, reason?: string) =>
    apiFetch<JournalEntry>(`/gl/journals/${id}/reject`, { method: "POST", body: { reason } }),
  postJournal: (id: string) => apiFetch<JournalEntry>(`/gl/journals/${id}/post`, { method: "POST", body: {} }),
  voidJournal: (id: string, reason?: string) =>
    apiFetch<JournalEntry>(`/gl/journals/${id}/void`, { method: "POST", body: { reason } }),
  reportCoa: () => apiFetch<{ groups: GlAccountGroup[]; accounts: GlAccount[] }>("/gl/reports/chart-of-accounts"),
  reportRegister: (q?: { status?: string; periodId?: string }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.periodId) p.set("periodId", q.periodId);
    const qs = p.toString();
    return apiFetch<{ data: JournalEntry[]; total: number }>(
      `/gl/reports/journal-register${qs ? `?${qs}` : ""}`,
    );
  },
  reportTrialBalance: (q?: { periodId?: string; asOf?: string }) => {
    const p = new URLSearchParams();
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.asOf) p.set("asOf", q.asOf);
    const qs = p.toString();
    return apiFetch<{
      rows: { code: string; name: string; type: string; debitPoisha: number; creditPoisha: number; balancePoisha: number }[];
      totalDebitPoisha: number;
      totalCreditPoisha: number;
      balanced: boolean;
    }>(`/gl/reports/trial-balance${qs ? `?${qs}` : ""}`);
  },
};
