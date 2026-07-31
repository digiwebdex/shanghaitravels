import { ApiError, apiFetch, listOf } from "@/lib/api";
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
  AgingRow,
  ApDocument,
  ArDocument,
  BankAccountRow,
  BankMaster,
  BankMovement,
  ChequeRow,
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
    apiFetch<{ id: string }>("/payments", { method: "POST", body }),
  /** Separate permission: payment:refund */
  recordRefund: (body: Record<string, unknown>) =>
    apiFetch<{ id: string }>("/payments/refund", { method: "POST", body }),
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

export const arApi = {
  listCustomers: () => apiFetch<{ id: string; code: string; fullName: string; outstandingPoisha: number; invoiceCount: number }[]>("/ar/customers"),
  listDocuments: (q?: { status?: string; type?: string; customerId?: string; applicationId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.type) p.set("type", q.type);
    if (q?.customerId) p.set("customerId", q.customerId);
    if (q?.applicationId) p.set("applicationId", q.applicationId);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<ArDocument[]>(`/ar/documents${qs ? `?${qs}` : ""}`);
  },
  getDocument: (id: string) => apiFetch<ArDocument>(`/ar/documents/${id}`),
  createDocument: (body: Record<string, unknown>) =>
    apiFetch<ArDocument>("/ar/documents", { method: "POST", body }),
  submit: (id: string) => apiFetch<ArDocument>(`/ar/documents/${id}/submit`, { method: "POST", body: {} }),
  approve: (id: string) => apiFetch<ArDocument>(`/ar/documents/${id}/approve`, { method: "POST", body: {} }),
  reject: (id: string, reason?: string) =>
    apiFetch<ArDocument>(`/ar/documents/${id}/reject`, { method: "POST", body: { reason } }),
  post: (id: string) => apiFetch<ArDocument>(`/ar/documents/${id}/post`, { method: "POST", body: {} }),
  void: (id: string, reason?: string) =>
    apiFetch<ArDocument>(`/ar/documents/${id}/void`, { method: "POST", body: { reason } }),
  allocate: (body: Record<string, unknown>) => apiFetch("/ar/allocations", { method: "POST", body }),
  bridgeInvoice: (invoiceId: string) =>
    apiFetch<ArDocument>(`/ar/bridge/invoice/${invoiceId}`, { method: "POST", body: {} }),
  bridgePayment: (paymentId: string) =>
    apiFetch<ArDocument>(`/ar/bridge/payment/${paymentId}`, { method: "POST", body: {} }),
  reportAging: (asOf?: string) =>
    apiFetch<{ asOf: string; data: AgingRow[]; totals: Record<string, number> }>(
      `/ar/reports/aging${asOf ? `?asOf=${encodeURIComponent(asOf)}` : ""}`,
    ),
  reportCustomerLedger: (customerId: string) =>
    apiFetch<{ customerId: string; entries: unknown[]; closingPoisha: number }>(
      `/ar/reports/customer-ledger?customerId=${encodeURIComponent(customerId)}`,
    ),
  reportOutstanding: () => apiFetch<Record<string, unknown>>("/ar/reports/outstanding"),
};

export const apApi = {
  listSuppliers: () =>
    apiFetch<{ id: string; code: string; name: string; type?: string; outstandingPoisha: number }[]>("/ap/suppliers"),
  listDocuments: (q?: { status?: string; type?: string; supplierId?: string; applicationId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.type) p.set("type", q.type);
    if (q?.supplierId) p.set("supplierId", q.supplierId);
    if (q?.applicationId) p.set("applicationId", q.applicationId);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<ApDocument[]>(`/ap/documents${qs ? `?${qs}` : ""}`);
  },
  getDocument: (id: string) => apiFetch<ApDocument>(`/ap/documents/${id}`),
  createDocument: (body: Record<string, unknown>) =>
    apiFetch<ApDocument>("/ap/documents", { method: "POST", body }),
  submit: (id: string) => apiFetch<ApDocument>(`/ap/documents/${id}/submit`, { method: "POST", body: {} }),
  approve: (id: string) => apiFetch<ApDocument>(`/ap/documents/${id}/approve`, { method: "POST", body: {} }),
  reject: (id: string, reason?: string) =>
    apiFetch<ApDocument>(`/ap/documents/${id}/reject`, { method: "POST", body: { reason } }),
  post: (id: string) => apiFetch<ApDocument>(`/ap/documents/${id}/post`, { method: "POST", body: {} }),
  void: (id: string, reason?: string) =>
    apiFetch<ApDocument>(`/ap/documents/${id}/void`, { method: "POST", body: { reason } }),
  allocate: (body: Record<string, unknown>) => apiFetch("/ap/allocations", { method: "POST", body }),
  reportAging: (asOf?: string) =>
    apiFetch<{ asOf: string; data: AgingRow[]; totals: Record<string, number> }>(
      `/ap/reports/aging${asOf ? `?asOf=${encodeURIComponent(asOf)}` : ""}`,
    ),
  reportSupplierLedger: (supplierId: string) =>
    apiFetch<{ supplierId: string; entries: unknown[]; closingPoisha: number }>(
      `/ap/reports/supplier-ledger?supplierId=${encodeURIComponent(supplierId)}`,
    ),
  reportOutstanding: () => apiFetch<Record<string, unknown>>("/ap/reports/outstanding"),
};


export const fsApi = {
  ledger: (q?: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v != null && v !== "") p.set(k, String(v));
    const qs = p.toString();
    return apiFetch<{ entries: unknown[]; closingPoisha: number; total: number }>(`/fs/ledger${qs ? `?${qs}` : ""}`);
  },
  ledgerDrilldown: (glAccountId: string, q?: { periodId?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch<{ account: unknown; entries: unknown[]; closingPoisha: number }>(
      `/fs/ledger/${encodeURIComponent(glAccountId)}${qs ? `?${qs}` : ""}`,
    );
  },
  trialBalance: (q?: { periodId?: string; asOf?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.asOf) p.set("asOf", q.asOf);
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/trial-balance${qs ? `?${qs}` : ""}`);
  },
  balanceSheet: (q?: { asOf?: string; periodId?: string; compareAsOf?: string }) => {
    const p = new URLSearchParams();
    if (q?.asOf) p.set("asOf", q.asOf);
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.compareAsOf) p.set("compareAsOf", q.compareAsOf);
    const qs = p.toString();
    return apiFetch(`/fs/balance-sheet${qs ? `?${qs}` : ""}`);
  },
  profitLoss: (q?: { from?: string; to?: string; periodId?: string; compareFrom?: string; compareTo?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    if (q?.periodId) p.set("periodId", q.periodId);
    if (q?.compareFrom) p.set("compareFrom", q.compareFrom);
    if (q?.compareTo) p.set("compareTo", q.compareTo);
    const qs = p.toString();
    return apiFetch(`/fs/profit-loss${qs ? `?${qs}` : ""}`);
  },
  cashFlow: (q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/cash-flow${qs ? `?${qs}` : ""}`);
  },
  equity: (q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/equity${qs ? `?${qs}` : ""}`);
  },
  comparative: (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
    return apiFetch(`/fs/comparative?${p}`);
  },
  multiPeriod: (q: { report: string; periodIds: string }) =>
    apiFetch(`/fs/multi-period?report=${encodeURIComponent(q.report)}&periodIds=${encodeURIComponent(q.periodIds)}`),
  analysisAccount: (glAccountId: string, q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams({ glAccountId });
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    return apiFetch(`/fs/analysis/account?${p}`);
  },
  analysisCostCenter: (q?: { costCenterId?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.costCenterId) p.set("costCenterId", q.costCenterId);
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/analysis/cost-center${qs ? `?${qs}` : ""}`);
  },
  analysisBranch: (q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/analysis/branch${qs ? `?${qs}` : ""}`);
  },
  analysisCurrency: (q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch(`/fs/analysis/currency${qs ? `?${qs}` : ""}`);
  },
  travelValidation: () => apiFetch("/fs/travel-validation"),
  lockPeriod: (id: string) => apiFetch(`/fs/periods/${id}/lock`, { method: "POST", body: {} }),
  reopenRequest: (id: string, reason: string) =>
    apiFetch(`/fs/periods/${id}/reopen-request`, { method: "POST", body: { reason } }),
  reopenApprove: (id: string, note?: string) =>
    apiFetch(`/fs/periods/${id}/reopen-approve`, { method: "POST", body: { note } }),
  reopenReject: (id: string, note?: string) =>
    apiFetch(`/fs/periods/${id}/reopen-reject`, { method: "POST", body: { note } }),
  listReopenRequests: (status?: string) =>
    apiFetch(`/fs/reopen-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  reverseJournal: (id: string, memo?: string) =>
    apiFetch(`/fs/journals/${id}/reverse`, { method: "POST", body: { memo } }),
  yearEndClose: (fiscalYearId: string) =>
    apiFetch("/fs/year-end/close", { method: "POST", body: { fiscalYearId } }),
  rollForward: (fiscalYearId: string) =>
    apiFetch("/fs/year-end/roll-forward", { method: "POST", body: { fiscalYearId } }),
  closingRuns: () => apiFetch("/fs/closing-runs"),
  exportRaw: async (report: string, q: Record<string, string>) => {
    const p = new URLSearchParams(q);
    const { ERP } = await import("@/config/env");
    const res = await fetch(`${ERP}/fs/export/${encodeURIComponent(report)}?${p}`, { credentials: "include" });
    if (!res.ok) throw new ApiError(`Export failed (${res.status})`, res.status);
    return res.text();
  },
};

export const bankingApi = {
  bootstrap: () => apiFetch<{ bootstrapped: boolean; message?: string }>("/banking/bootstrap", { method: "POST", body: {} }),
  listMasters: () => apiFetch<BankMaster[]>("/banking/masters"),
  createMaster: (body: Record<string, unknown>) => apiFetch<BankMaster>("/banking/masters", { method: "POST", body }),
  listAccounts: (q?: { kind?: string; active?: string }) => {
    const p = new URLSearchParams();
    if (q?.kind) p.set("kind", q.kind);
    if (q?.active) p.set("active", q.active);
    const qs = p.toString();
    return apiFetch<BankAccountRow[]>(`/banking/accounts${qs ? `?${qs}` : ""}`);
  },
  createAccount: (body: Record<string, unknown>) => apiFetch<BankAccountRow>("/banking/accounts", { method: "POST", body }),
  listMovements: (q?: { status?: string; type?: string; bankAccountId?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.type) p.set("type", q.type);
    if (q?.bankAccountId) p.set("bankAccountId", q.bankAccountId);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<BankMovement[]>(`/banking/movements${qs ? `?${qs}` : ""}`);
  },
  createMovement: (body: Record<string, unknown>) => apiFetch<BankMovement>("/banking/movements", { method: "POST", body }),
  postMovement: (id: string) => apiFetch<BankMovement>(`/banking/movements/${id}/post`, { method: "POST", body: {} }),
  listCheques: (q?: { status?: string; bankAccountId?: string }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.bankAccountId) p.set("bankAccountId", q.bankAccountId);
    const qs = p.toString();
    return apiFetch<ChequeRow[]>(`/banking/cheques${qs ? `?${qs}` : ""}`);
  },
  createCheque: (body: Record<string, unknown>) => apiFetch<ChequeRow>("/banking/cheques", { method: "POST", body }),
  printCheque: (id: string) => apiFetch<{ cheque: ChequeRow; print: Record<string, unknown> }>(`/banking/cheques/${id}/print`, { method: "POST", body: {} }),
  chequeStatus: (id: string, status: string) =>
    apiFetch<ChequeRow>(`/banking/cheques/${id}/status`, { method: "POST", body: { status } }),
  importCsv: (body: Record<string, unknown>) => apiFetch("/banking/statements/import-csv", { method: "POST", body }),
  listStatements: (bankAccountId?: string) =>
    apiFetch(`/banking/statements${bankAccountId ? `?bankAccountId=${encodeURIComponent(bankAccountId)}` : ""}`),
  startReconciliation: (body: Record<string, unknown>) => apiFetch("/banking/reconciliations", { method: "POST", body }),
  completeReconciliation: (id: string) => apiFetch(`/banking/reconciliations/${id}/complete`, { method: "POST", body: {} }),
  reportDailyPosition: () => apiFetch<{ asOf: string; rows: { id: string; name: string; kind: string; balancePoisha: number }[]; totalPoisha: number }>("/banking/reports/daily-cash-position"),
  reportBankBook: (bankAccountId: string) =>
    apiFetch(`/banking/reports/bank-book?bankAccountId=${encodeURIComponent(bankAccountId)}`),
  reportCashFlow: () => apiFetch("/banking/reports/cash-flow-summary"),
};

export const crmApi = {
  listLeads: (q?: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v != null && v !== "") p.set(k, String(v));
    const qs = p.toString();
    return apiFetch<{ data: CrmLead[]; total: number }>(`/crm/leads${qs ? `?${qs}` : ""}`);
  },
  createLead: (body: Record<string, unknown>) => apiFetch<CrmLead>("/crm/leads", { method: "POST", body }),
  updateLead: (id: string, body: Record<string, unknown>) =>
    apiFetch<CrmLead>(`/crm/leads/${id}`, { method: "PATCH", body }),
  listContacts: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CrmContact[]>(`/crm/contacts${qs ? `?${qs}` : ""}`);
  },
  createContact: (body: Record<string, unknown>) => apiFetch<CrmContact>("/crm/contacts", { method: "POST", body }),
  listOrganizations: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CrmOrganization[]>(`/crm/organizations${qs ? `?${qs}` : ""}`);
  },
  createOrganization: (body: Record<string, unknown>) =>
    apiFetch<CrmOrganization>("/crm/organizations", { method: "POST", body }),
  listOpportunities: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CrmOpportunity[]>(`/crm/opportunities${qs ? `?${qs}` : ""}`);
  },
  createOpportunity: (body: Record<string, unknown>) =>
    apiFetch<CrmOpportunity>("/crm/opportunities", { method: "POST", body }),
  setOpportunityStage: (id: string, stage: string, lostReason?: string) =>
    apiFetch(`/crm/opportunities/${id}/stage`, { method: "POST", body: { stage, lostReason } }),
  listActivities: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CrmActivity[]>(`/crm/activities${qs ? `?${qs}` : ""}`);
  },
  createActivity: (body: Record<string, unknown>) => apiFetch<CrmActivity>("/crm/activities", { method: "POST", body }),
  completeActivity: (id: string) => apiFetch(`/crm/activities/${id}/complete`, { method: "POST", body: {} }),
  listQuotations: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CrmQuotation[]>(`/crm/quotations${qs ? `?${qs}` : ""}`);
  },
  createQuotation: (body: Record<string, unknown>) =>
    apiFetch<CrmQuotation>("/crm/quotations", { method: "POST", body }),
  setQuotationStatus: (id: string, status: string) =>
    apiFetch(`/crm/quotations/${id}/status`, { method: "POST", body: { status } }),
  convert: (body: Record<string, unknown>) =>
    apiFetch<{ application: { id: string; referenceNo: string; serviceType: string }; customerId: string }>(
      "/crm/convert",
      { method: "POST", body },
    ),
  reportLeadSources: () => apiFetch<{ rows: { source: string; count: number }[] }>("/crm/reports/lead-sources"),
  reportConversion: () => apiFetch<Record<string, number>>("/crm/reports/conversion"),
  reportPipeline: () =>
    apiFetch<{ rows: { stage: string; count: number; expectedRevenuePoisha: number }[] }>("/crm/reports/pipeline"),
  reportTeam: () => apiFetch<{ rows: Record<string, unknown>[] }>("/crm/reports/team"),
  reportForecast: () => apiFetch<Record<string, unknown>>("/crm/reports/forecast"),
};

export type CrmLead = {
  id: string;
  leadNo?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  serviceInterest?: string | null;
  status: string;
  priority?: string;
  assignedTo?: string | null;
  notes?: string | null;
};

export type CrmContact = {
  id: string;
  kind: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  familyGroup?: string | null;
  organizationId?: string | null;
};

export type CrmOrganization = {
  id: string;
  code: string;
  name: string;
  type: string;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
};

export type CrmOpportunity = {
  id: string;
  opportunityNo: string;
  title: string;
  stage: string;
  status: string;
  probabilityBps: number;
  expectedRevenuePoisha: number;
  serviceType?: string | null;
  leadId?: string | null;
};

export type CrmActivity = {
  id: string;
  type: string;
  subject: string;
  relatedType: string;
  relatedId: string;
  status: string;
  dueAt?: string | null;
};

export type CrmQuotation = {
  id: string;
  quoteNo: string;
  serviceType: string;
  status: string;
  totalPoisha: number;
  opportunityId?: string | null;
  leadId?: string | null;
};
