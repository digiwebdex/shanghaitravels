import { ApiError, apiFetch, listOf } from "@/lib/api";
import type {
  PackageAvailability,
  PackageCategory,
  PackageFaq,
  PackageGalleryItem,
  PackageListFilters,
  PackageMaster,
  PackageReportSummary,
  PackageSearchFilters,
} from "@/lib/packages";
import { buildPackageListQuery, buildPackageSearchQuery } from "@/lib/packages";
import {
  buildDestinationBrowseQuery,
  buildDestinationListQuery,
  type DestinationBrowseFilters,
  type DestinationGalleryItem,
  type DestinationListFilters,
  type DestinationMaster,
  type DestinationShowcaseSettings,
} from "@/lib/destinations";
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
  OwnershipAssignment,
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

export type IntelligenceHit = {
  kind:
    | "passport"
    | "nid"
    | "customer_id"
    | "booking"
    | "visa_file"
    | "mobile"
    | "email"
    | "customer_name"
    | "agent"
    | "corporate";
  priority: number;
  customerId?: string;
  applicationId?: string;
  agentId?: string;
  corporateId?: string;
  label: string;
  subtitle: string;
  matchedField: string;
  matchValue: string;
  duplicateHint?: boolean;
};

export type IntelligenceProfile = {
  customer: {
    id: string;
    code: string;
    fullName: string;
    passportNo: string | null;
    nationality?: string | null;
    dob?: string | null;
    gender?: string | null;
    mobile?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    status?: string | null;
    tier: string;
    type?: string | null;
    photoDocumentId?: string | null;
    passports?: Passport[];
  };
  bookings: {
    total: number;
    current: {
      id: string;
      referenceNo: string;
      status: string;
      serviceType: string;
      currentStage?: number | null;
      totalStages?: number | null;
      assignedTo?: string | null;
    } | null;
    visaStatus: string | null;
    ticketStatus: string | null;
    hotelStatus: string | null;
    tourStatus: string | null;
    transportStatus: string | null;
    hajjStatus: string | null;
    studentStatus: string | null;
    manpowerStatus: string | null;
    upcoming: { id: string; referenceNo: string; serviceType: string; status: string }[];
    history: { id: string; referenceNo: string; serviceType: string; status: string }[];
    list: {
      id: string;
      referenceNo: string;
      serviceType: string;
      status: string;
      currentStage?: number | null;
      totalStages?: number | null;
    }[];
  };
  finance: {
    outstandingDue: number;
    paidAmount: number;
    refundAmount: number;
    invoices: { id: string; invoiceNo: string; status: string; total: number; dueAt?: string | null }[];
    payments: { id: string; amount: number; kind?: string | null; method?: string | null; receivedAt: string }[];
  } | null;
  documents: {
    items: {
      id: string;
      category?: string | null;
      fileName?: string | null;
      status?: string | null;
      isPassport?: boolean;
      createdAt: string;
    }[];
    ocr: {
      id: string;
      docType?: string | null;
      status?: string | null;
      confidence?: number | null;
      createdAt: string;
      appliedAt?: string | null;
    }[];
  } | null;
  crm: {
    leads: { id: string; name?: string | null; status?: string | null; priority?: string | null; assignedTo?: string | null; updatedAt?: string }[];
    opportunities: { id: string; title?: string; stage?: string; assignedTo?: string | null }[];
    salesExecutive?: string | null;
    lastContact?: string | null;
  } | null;
  operations: {
    currentStage?: number | null;
    stageName?: string | null;
    assignedOfficer?: string | null;
    pendingTasks: { id: string; title: string; priority?: string; applicationId: string; referenceNo: string; dueAt?: string | null }[];
    urgent?: boolean;
    workflow: { stageNo: number; name: string; status?: string }[];
  };
  agent: {
    id: string;
    name: string;
    code?: string | null;
    commissionRateBps?: number | null;
    branchId?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  corporate: {
    id: string;
    companyName: string;
    contactPerson?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  communications: { id: string; channel?: string; summary?: string | null; createdAt: string; status?: string | null }[];
  timeline: { at: string; type: string; title: string; meta?: string }[];
  permissions: { finance: boolean; applications: boolean; crm: boolean; documents: boolean };
  duplicate: { passportExists: boolean; passportCount: number; bookingCount: number; documentCount: number };
};

export const customersApi = {
  list: (q?: { page?: number; limit?: number; q?: string; agentId?: string }) => {
    const p = new URLSearchParams();
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    if (q?.q) p.set("q", q.q);
    if (q?.agentId) p.set("agentId", q.agentId);
    const qs = p.toString();
    return apiFetch<Paginated<Customer> | Customer[]>(`/customers${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Customer>(`/customers/${id}`),
  create: (body: Partial<Customer>) => apiFetch<Customer>("/customers", { method: "POST", body }),
  update: (id: string, body: Partial<Customer>) =>
    apiFetch<Customer>(`/customers/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),
  // V6 Wave 1 — customer ownership
  ownershipHistory: (id: string) => apiFetch<OwnershipAssignment[]>(`/customers/${id}/ownership`),
  assignOwner: (id: string, body: { agentId: string; reason?: string }) =>
    apiFetch<Customer>(`/customers/${id}/ownership/assign`, { method: "POST", body }),
  releaseOwner: (id: string, body?: { reason?: string }) =>
    apiFetch<Customer>(`/customers/${id}/ownership/release`, { method: "POST", body: body ?? {} }),
  setSecondaryOwner: (id: string, body: { agentId: string | null; reason?: string }) =>
    apiFetch<Customer>(`/customers/${id}/ownership/secondary`, { method: "POST", body }),
  /** Priority-ranked global intelligence search (passport → NID → booking → …). */
  intelligenceSearch: (q: string) =>
    apiFetch<{ query: string; hits: IntelligenceHit[]; tookMs: number }>(
      `/customers/intelligence/search?q=${encodeURIComponent(q)}`,
    ),
  /** 360° profile for search result dashboard. */
  intelligenceProfile: (id: string) => apiFetch<IntelligenceProfile>(`/customers/${id}/intelligence`),
  intelligenceReports: () =>
    apiFetch<{
      duplicatePassports: { passportNo: string; count: number; customers: { id: string; name: string; code: string }[] }[];
      expiredPassports: { passportNo: string; expiryDate: string; customerId: string; customerName: string; code: string }[];
      expiringSoonPassports: { passportNo: string; expiryDate: string; customerId: string; customerName: string; code: string }[];
      pendingPassports: number;
      pendingOcrScans: number;
      totals: { passportsIndexed: number; duplicateGroups: number; expired: number; expiringSoon: number };
    }>("/customers/intelligence/reports"),
};

export const applicationsApi = {
  list: (q?: { page?: number; limit?: number; q?: string; serviceType?: string; status?: string; agentId?: string }) => {
    const p = new URLSearchParams();
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    if (q?.q) p.set("q", q.q);
    if (q?.serviceType) p.set("serviceType", q.serviceType);
    if (q?.status) p.set("status", q.status);
    if (q?.agentId) p.set("agentId", q.agentId);
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
  scan: (
    file: File,
    extra?: { customerId?: string; applicationId?: string; docType?: string },
  ) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", extra?.docType || "auto");
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
  stats: () =>
    apiFetch<{
      scannedToday: number;
      byType: Record<string, number>;
      failures: number;
      averageConfidence: number | null;
      averageProcessingMs: number | null;
      journalSize: number;
    }>("/ocr/intelligence/stats"),
  recent: (take = 50) => apiFetch<Record<string, unknown>[]>(`/ocr/intelligence/recent?take=${take}`),
  failed: (take = 50) => apiFetch<Record<string, unknown>[]>(`/ocr/intelligence/failed?take=${take}`),
  checkDuplicate: (body: {
    passportNo?: string;
    nidNumber?: string;
    visaNumber?: string;
    customerId?: string;
  }) =>
    apiFetch<{
      duplicate: boolean;
      hits: { type: string; customerId: string; customerCode?: string; customerName?: string; detail?: string }[];
    }>("/ocr/intelligence/check-duplicate", { method: "POST", body }),
};

export const financeApi = {
  listInvoices: (q?: { applicationId?: string; customerId?: string; limit?: number; agentId?: string }) => {
    const p = new URLSearchParams();
    if (q?.customerId) p.set("customerId", q.customerId);
    if (q?.agentId) p.set("agentId", q.agentId);
    if (q?.limit) p.set("limit", String(q.limit ?? 50));
    const qs = p.toString();
    return apiFetch<Paginated<Invoice> | Invoice[]>(`/invoices${qs ? `?${qs}` : ""}`);
  },
  getInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}`),
  createInvoice: (body: Record<string, unknown>) =>
    apiFetch<Invoice>("/invoices", { method: "POST", body }),
  issueInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/issue`, { method: "POST" }),
  approveInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/approve`, { method: "POST" }),
  sendInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/send`, { method: "POST" }),
  markInvoiceViewed: (id: string) => apiFetch<Invoice>(`/invoices/${id}/viewed`, { method: "POST" }),
  cancelInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/cancel`, { method: "POST" }),
  voidInvoice: (id: string) => apiFetch<Invoice>(`/invoices/${id}/void`, { method: "POST" }),
  markInvoiceRefunded: (id: string) => apiFetch<Invoice>(`/invoices/${id}/refunded`, { method: "POST" }),
  invoiceAudit: (id: string) =>
    apiFetch<{ id: string; action: string; userId: string; before?: unknown; after?: unknown; createdAt: string }[]>(
      `/invoices/${id}/audit`,
    ),
  recordPayment: (body: Record<string, unknown>) =>
    apiFetch<{ id: string }>("/payments", { method: "POST", body }),
  /** Separate permission: payment:refund */
  recordRefund: (body: Record<string, unknown>) =>
    apiFetch<{ id: string }>("/payments/refund", { method: "POST", body }),
  accounts: () => apiFetch<Account[]>("/accounts"),
  report: (type: string, q?: { from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    const qs = p.toString();
    return apiFetch<{ type: string; period: { from: string; to: string }; rows: Record<string, unknown>[]; total: number; count: number }>(
      `/finance/reports/${type}${qs ? `?${qs}` : ""}`,
    );
  },
};

export const automationApi = {
  status: () =>
    apiFetch<{
      config: { enabled: boolean; channelPriority: string[] };
      jobs: Record<string, { cron: string; lastRun?: string; runs: number; failures: number }>;
      recent: { id: string; action: string; entityType: string; entityId: string; createdAt: string }[];
    }>("/automation/status"),
  settings: () => apiFetch<{ enabled: boolean; channelPriority: string[] }>("/automation/settings"),
  saveSettings: (body: Record<string, unknown>) => apiFetch("/automation/settings", { method: "PUT", body }),
  run: (job: string) => apiFetch(`/automation/run/${job}`, { method: "POST" }),
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

export type SalesStage = {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  defaultProbabilityBps: number;
  isWon: boolean;
  isLost: boolean;
  isConverted: boolean;
};

export type LostReason = { id: string; code: string; label: string; sortOrder: number };

export type SalesQuotation = CrmQuotation & {
  version: number;
  rootQuoteId?: string | null;
  discountPoisha?: number;
  discountBps?: number;
  taxPoisha?: number;
  subtotalPoisha?: number;
  validUntil?: string | null;
  applicationId?: string | null;
  lines?: {
    id?: string;
    lineNo: number;
    productCode?: string | null;
    description: string;
    quantity: number;
    unitPricePoisha: number;
    discountPoisha?: number;
    amountPoisha: number;
  }[];
};

export type PriceTemplate = {
  id: string;
  code: string;
  name: string;
  serviceType: string;
  lines?: { lineNo: number; productCode?: string | null; description: string; unitPricePoisha: number }[];
};

export type PriceBook = {
  id: string;
  code: string;
  name: string;
  kind: string;
  serviceType?: string | null;
  discountBps: number;
  unitPricePoisha?: number | null;
};

export type SalesTask = {
  id: string;
  title: string;
  type: string;
  status: string;
  dueAt?: string | null;
  slaDueAt?: string | null;
  opportunityId?: string | null;
  opportunity?: { id: string; opportunityNo: string; title: string } | null;
};

export const salesApi = {
  bootstrap: () => apiFetch("/sales/bootstrap", { method: "POST", body: {} }),
  listStages: () => apiFetch<SalesStage[]>("/sales/stages"),
  listLostReasons: () => apiFetch<LostReason[]>("/sales/lost-reasons"),
  setOpportunityStage: (id: string, body: Record<string, unknown>) =>
    apiFetch(`/sales/opportunities/${id}/stage`, { method: "POST", body }),
  opportunityHistory: (id: string) => apiFetch(`/sales/opportunities/${id}/history`),
  listQuotations: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<SalesQuotation[]>(`/sales/quotations${qs ? `?${qs}` : ""}`);
  },
  getQuotation: (id: string) => apiFetch<SalesQuotation>(`/sales/quotations/${id}`),
  createQuotation: (body: Record<string, unknown>) =>
    apiFetch<SalesQuotation>("/sales/quotations", { method: "POST", body }),
  submitQuotation: (id: string) => apiFetch(`/sales/quotations/${id}/submit`, { method: "POST", body: {} }),
  approveQuotation: (id: string) => apiFetch(`/sales/quotations/${id}/approve`, { method: "POST", body: {} }),
  rejectQuotation: (id: string, reason: string) =>
    apiFetch(`/sales/quotations/${id}/reject`, { method: "POST", body: { reason } }),
  sendQuotation: (id: string) =>
    apiFetch<{ quotation: SalesQuotation; emailReady: { subject: string; html: string } }>(
      `/sales/quotations/${id}/send`,
      { method: "POST", body: {} },
    ),
  reviseQuotation: (id: string, body?: Record<string, unknown>) =>
    apiFetch<SalesQuotation>(`/sales/quotations/${id}/revise`, { method: "POST", body: body || {} }),
  exportQuotationUrl: (id: string) => `/sales/quotations/${id}/export`,
  listPriceTemplates: () => apiFetch<PriceTemplate[]>("/sales/price-templates"),
  createPriceTemplate: (body: Record<string, unknown>) =>
    apiFetch<PriceTemplate>("/sales/price-templates", { method: "POST", body }),
  listPriceBooks: () => apiFetch<PriceBook[]>("/sales/price-books"),
  createPriceBook: (body: Record<string, unknown>) =>
    apiFetch<PriceBook>("/sales/price-books", { method: "POST", body }),
  resolvePricing: (body: Record<string, unknown>) => apiFetch("/sales/pricing/resolve", { method: "POST", body }),
  listTasks: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<SalesTask[]>(`/sales/tasks${qs ? `?${qs}` : ""}`);
  },
  createTask: (body: Record<string, unknown>) => apiFetch<SalesTask>("/sales/tasks", { method: "POST", body }),
  completeTask: (id: string) => apiFetch(`/sales/tasks/${id}/complete`, { method: "POST", body: {} }),
  escalateTask: (id: string) => apiFetch(`/sales/tasks/${id}/escalate`, { method: "POST", body: {} }),
  convert: (body: Record<string, unknown>) =>
    apiFetch<{ application: { id: string; referenceNo: string; serviceType: string }; quotationId: string }>(
      "/sales/convert",
      { method: "POST", body },
    ),
  reportQuoteStatus: () =>
    apiFetch<{ rows: { status: string; count: number; totalPoisha: number }[] }>("/sales/reports/quote-status"),
  reportWinLoss: () => apiFetch<{ won: number; lost: number; open: number; winRate: number }>("/sales/reports/win-loss"),
  reportFunnel: () =>
    apiFetch<{ rows: { stage: string; name: string; count: number; expectedRevenuePoisha: number }[] }>(
      "/sales/reports/funnel",
    ),
  reportByExecutive: () => apiFetch<{ rows: Record<string, unknown>[] }>("/sales/reports/by-executive"),
  reportConversionTime: () => apiFetch<{ sampleSize: number; avgDays: number }>("/sales/reports/conversion-time"),
  reportForecastAccuracy: () =>
    apiFetch<{ sampleSize: number; forecastedPoisha: number; actualPoisha: number; accuracyPct: number | null }>(
      "/sales/reports/forecast-accuracy",
    ),
};

export type CommTemplate = {
  id: string;
  code: string;
  name: string;
  channel: string;
  category: string;
  subject?: string | null;
  body: string;
  mergeFields?: string[] | null;
};

export type CommThread = {
  id: string;
  channel: string;
  subject?: string | null;
  relatedType: string;
  relatedId: string;
  partyKind: string;
  partyLabel?: string | null;
  status: string;
  messages?: CommMessage[];
};

export type CommMessage = {
  id: string;
  threadId: string;
  channel: string;
  direction: string;
  subject?: string | null;
  body: string;
  status: string;
  provider?: string | null;
  createdAt: string;
};

export type CommTimelineItem = {
  kind: string;
  id: string;
  channel: string;
  direction: string;
  summary: string;
  subject?: string | null;
  body?: string | null;
  status: string;
  createdAt: string;
};

export type CommActivity = {
  id: string;
  type: string;
  subject: string;
  status: string;
  dueAt?: string | null;
  slaDueAt?: string | null;
  recurrenceRule?: string | null;
  assignedTo?: string | null;
};

export const commsApi = {
  bootstrap: () => apiFetch("/comms/bootstrap", { method: "POST", body: {} }),
  timeline: (relatedType: string, relatedId: string) =>
    apiFetch<{ relatedType: string; relatedId: string; items: CommTimelineItem[] }>(
      `/comms/timeline?relatedType=${encodeURIComponent(relatedType)}&relatedId=${encodeURIComponent(relatedId)}`,
    ),
  log: (body: Record<string, unknown>) => apiFetch("/comms/log", { method: "POST", body }),
  listTemplates: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CommTemplate[]>(`/comms/templates${qs ? `?${qs}` : ""}`);
  },
  createTemplate: (body: Record<string, unknown>) =>
    apiFetch<CommTemplate>("/comms/templates", { method: "POST", body }),
  renderTemplate: (id: string, vars: Record<string, string>) =>
    apiFetch(`/comms/templates/${id}/render`, { method: "POST", body: { vars } }),
  listThreads: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CommThread[]>(`/comms/threads${qs ? `?${qs}` : ""}`);
  },
  getThread: (id: string) => apiFetch<CommThread>(`/comms/threads/${id}`),
  createThread: (body: Record<string, unknown>) => apiFetch<CommThread>("/comms/threads", { method: "POST", body }),
  send: (body: Record<string, unknown>) =>
    apiFetch<{ message: CommMessage; delivery: Record<string, unknown>; threadId: string }>("/comms/send", {
      method: "POST",
      body,
    }),
  listDelivery: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CommMessage[]>(`/comms/delivery${qs ? `?${qs}` : ""}`);
  },
  processOutbox: () => apiFetch("/comms/process-outbox", { method: "POST", body: {} }),
  listActivities: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CommActivity[]>(`/comms/activities${qs ? `?${qs}` : ""}`);
  },
  createActivity: (body: Record<string, unknown>) =>
    apiFetch<CommActivity>("/comms/activities", { method: "POST", body }),
  completeActivity: (id: string) => apiFetch(`/comms/activities/${id}/complete`, { method: "POST", body: {} }),
  escalateActivity: (id: string) => apiFetch(`/comms/activities/${id}/escalate`, { method: "POST", body: {} }),
  calendar: (q?: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q || {})) if (v) p.set(k, v);
    const qs = p.toString();
    return apiFetch<CommActivity[]>(`/comms/calendar${qs ? `?${qs}` : ""}`);
  },
  sla: () =>
    apiFetch<{ open: number; overdue: number; escalated: number; done: number; compliancePct: number }>("/comms/sla"),
  portalTimeline: (partyKind: string, partyId: string) =>
    apiFetch(`/comms/portal/${encodeURIComponent(partyKind)}/${encodeURIComponent(partyId)}/timeline`),
  reportVolume: () => apiFetch<{ messages: { channel: string; count: number }[]; timeline: { channel: string; count: number }[] }>("/comms/reports/volume"),
  reportResponseTime: () => apiFetch<{ sampleSize: number; avgResponseHours: number }>("/comms/reports/response-time"),
  reportSlaCompliance: () => apiFetch<Record<string, number>>("/comms/reports/sla-compliance"),
  reportActivityCompletion: () =>
    apiFetch<{ rows: { status: string; count: number }[] }>("/comms/reports/activity-completion"),
  reportExecutiveProductivity: () =>
    apiFetch<{ rows: Record<string, unknown>[] }>("/comms/reports/executive-productivity"),
};

export type AnalyticsFilters = { from?: string; to?: string; branchId?: string };

export type AnalyticsTemplate = {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  definition: Record<string, unknown>;
};

export type AnalyticsSchedule = {
  id: string;
  name: string;
  cronExpr: string;
  format: string;
  isActive: boolean;
  template?: { id: string; code: string; name: string; category: string };
};

function analyticsQs(q?: AnalyticsFilters) {
  const p = new URLSearchParams();
  if (q?.from) p.set("from", q.from);
  if (q?.to) p.set("to", q.to);
  if (q?.branchId) p.set("branchId", q.branchId);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

export const analyticsApi = {
  bootstrap: () => apiFetch("/analytics/bootstrap", { method: "POST", body: {} }),
  executive: (q?: AnalyticsFilters) => apiFetch<Record<string, unknown>>(`/analytics/executive${analyticsQs(q)}`),
  customer: (q?: AnalyticsFilters) => apiFetch<Record<string, unknown>>(`/analytics/customer${analyticsQs(q)}`),
  sales: (q?: AnalyticsFilters) => apiFetch<Record<string, unknown>>(`/analytics/sales${analyticsQs(q)}`),
  comms: (q?: AnalyticsFilters) => apiFetch<Record<string, unknown>>(`/analytics/comms${analyticsQs(q)}`),
  finance: (q?: AnalyticsFilters) => apiFetch<Record<string, unknown>>(`/analytics/finance${analyticsQs(q)}`),
  exportUrl: (report: string, format: string, q?: AnalyticsFilters) => {
    const p = new URLSearchParams();
    p.set("format", format);
    if (q?.from) p.set("from", q.from);
    if (q?.to) p.set("to", q.to);
    if (q?.branchId) p.set("branchId", q.branchId);
    return `/analytics/export/${encodeURIComponent(report)}?${p}`;
  },
  listTemplates: () => apiFetch<AnalyticsTemplate[]>("/analytics/templates"),
  createTemplate: (body: Record<string, unknown>) =>
    apiFetch<AnalyticsTemplate>("/analytics/templates", { method: "POST", body }),
  listSchedules: () => apiFetch<AnalyticsSchedule[]>("/analytics/schedules"),
  createSchedule: (body: Record<string, unknown>) =>
    apiFetch<AnalyticsSchedule>("/analytics/schedules", { method: "POST", body }),
  patchSchedule: (id: string, body: Record<string, unknown>) =>
    apiFetch(`/analytics/schedules/${id}`, { method: "PATCH", body }),
};

/* ---------- Phase E1 Website & CMS ---------- */

export type CmsPage = {
  id: string;
  slug: string;
  title: string;
  body?: string | null;
  blocks?: unknown;
  status: string;
  published: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  structuredData?: unknown;
  branchId?: string | null;
  publishedAt?: string | null;
  updatedAt?: string;
  versions?: { id: string; version: number; createdAt: string; createdBy: string }[];
};

export type CmsMenu = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  items?: { id: string; label: string; href: string; sortOrder: number; isActive: boolean }[];
};

export type CmsMedia = {
  id: string;
  fileName: string;
  storageKey: string;
  mimeType?: string | null;
  altText?: string | null;
  folder?: string | null;
  branchId?: string | null;
};

export type CmsBanner = {
  id: string;
  code: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkHref?: string | null;
  placement: string;
  sortOrder: number;
  isActive: boolean;
};

export type CmsRedirect = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  isActive: boolean;
};

export type CmsContent = {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary?: string | null;
  body?: string | null;
  coverUrl?: string | null;
  meta?: Record<string, unknown> | null;
  sortOrder?: number;
  status: string;
  publishedAt?: string | null;
};

export type CmsTravelOffer = {
  id: string;
  serviceType: string;
  slug: string;
  title: string;
  summary?: string | null;
  destination?: string | null;
  priceFromPoisha?: number | null;
  currencyCode?: string | null;
  status: string;
};

export type CmsFormSubmission = {
  id: string;
  formType: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  pageSlug?: string | null;
  leadId?: string | null;
  status: string;
  createdAt: string;
};

export type CmsReports = {
  pageViews: { path: string; count: number }[];
  formSubmissions: { formType: string; count: number }[];
  leadGenerationByPage: { pageSlug: string; count: number }[];
  publishing: { publishedPages: number; publishedContent: number; leadsFromForms: number };
};

export const cmsApi = {
  bootstrap: () => apiFetch<{ ok: boolean; createdPages: number }>("/cms/bootstrap", { method: "POST", body: {} }),
  listPages: (q?: { status?: string; branchId?: string }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.branchId) p.set("branchId", q.branchId);
    const qs = p.toString();
    return apiFetch<CmsPage[]>(`/cms/pages${qs ? `?${qs}` : ""}`);
  },
  getPage: (id: string) => apiFetch<CmsPage>(`/cms/pages/${id}`),
  upsertPage: (body: Record<string, unknown>) => apiFetch<CmsPage>("/cms/pages", { method: "POST", body }),
  submitReview: (id: string) => apiFetch(`/cms/pages/${id}/submit-review`, { method: "POST", body: {} }),
  publishPage: (id: string) => apiFetch(`/cms/pages/${id}/publish`, { method: "POST", body: {} }),
  unpublishPage: (id: string) => apiFetch(`/cms/pages/${id}/unpublish`, { method: "POST", body: {} }),
  deletePage: (id: string) => apiFetch(`/cms/pages/${id}`, { method: "DELETE" }),
  listMenus: () => apiFetch<CmsMenu[]>("/cms/menus"),
  upsertMenu: (body: Record<string, unknown>) => apiFetch<CmsMenu>("/cms/menus", { method: "POST", body }),
  listMedia: () => apiFetch<CmsMedia[]>("/cms/media"),
  createMedia: (body: Record<string, unknown>) => apiFetch<CmsMedia>("/cms/media", { method: "POST", body }),
  listBanners: () => apiFetch<CmsBanner[]>("/cms/banners"),
  createBanner: (body: Record<string, unknown>) => apiFetch<CmsBanner>("/cms/banners", { method: "POST", body }),
  listRedirects: () => apiFetch<CmsRedirect[]>("/cms/redirects"),
  createRedirect: (body: Record<string, unknown>) =>
    apiFetch<CmsRedirect>("/cms/redirects", { method: "POST", body }),
  listContent: (q?: { type?: string }) => {
    const qs = q?.type ? `?type=${encodeURIComponent(q.type)}` : "";
    return apiFetch<CmsContent[]>(`/cms/content${qs}`);
  },
  createContent: (body: Record<string, unknown>) => apiFetch<CmsContent>("/cms/content", { method: "POST", body }),
  updateContent: (id: string, body: Record<string, unknown>) =>
    apiFetch<CmsContent>(`/cms/content/${id}`, { method: "POST", body }),
  publishContent: (id: string) => apiFetch(`/cms/content/${id}/publish`, { method: "POST", body: {} }),
  unpublishContent: (id: string) => apiFetch(`/cms/content/${id}/unpublish`, { method: "POST", body: {} }),
  listTravel: (q?: { serviceType?: string }) => {
    const qs = q?.serviceType ? `?serviceType=${encodeURIComponent(q.serviceType)}` : "";
    return apiFetch<CmsTravelOffer[]>(`/cms/travel${qs}`);
  },
  createTravel: (body: Record<string, unknown>) =>
    apiFetch<CmsTravelOffer>("/cms/travel", { method: "POST", body }),
  listForms: (q?: { formType?: string }) => {
    const qs = q?.formType ? `?formType=${encodeURIComponent(q.formType)}` : "";
    return apiFetch<CmsFormSubmission[]>(`/cms/forms${qs}`);
  },
  reports: () => apiFetch<CmsReports>("/cms/reports"),
};

export const siteApi = {
  page: (slug: string) =>
    apiFetch<{ page?: Record<string, unknown>; redirect?: { to: string; statusCode: number } }>(
      `/site/pages/${encodeURIComponent(slug)}`,
      { skipRefresh: true, quietAuth: true },
    ),
  menu: (code: string) =>
    apiFetch<CmsMenu | null>(`/site/menus/${encodeURIComponent(code)}`, { skipRefresh: true, quietAuth: true }),
  banners: (placement?: string) => {
    const qs = placement ? `?placement=${encodeURIComponent(placement)}` : "";
    return apiFetch<CmsBanner[]>(`/site/banners${qs}`, { skipRefresh: true, quietAuth: true });
  },
  content: (type?: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    return apiFetch<CmsContent[]>(`/site/content${qs}`, { skipRefresh: true, quietAuth: true });
  },
  travel: (serviceType?: string) => {
    const qs = serviceType ? `?serviceType=${encodeURIComponent(serviceType)}` : "";
    return apiFetch<CmsTravelOffer[]>(`/site/travel${qs}`, { skipRefresh: true, quietAuth: true });
  },
  search: (q: string) =>
    apiFetch<{
      query: string;
      pages: Record<string, unknown>[];
      content: Record<string, unknown>[];
      packages: Record<string, unknown>[];
      services: Record<string, unknown>[];
    }>(`/site/search?q=${encodeURIComponent(q)}`, { skipRefresh: true, quietAuth: true }),
  submitForm: (body: Record<string, unknown>) =>
    apiFetch<{ ok: boolean; submissionId: string; leadId: string | null }>("/site/forms", {
      method: "POST",
      body,
      skipRefresh: true,
      quietAuth: true,
    }),
};

/** Phase E3 — Package Engine (staff). PackageID is SoT for bookings/leads. */
export const packagesApi = {
  listCategories: (q?: { q?: string; active?: string }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.active) p.set("active", q.active);
    const qs = p.toString();
    return apiFetch<{ data: PackageCategory[]; total: number } | PackageCategory[]>(
      `/packages/categories${qs ? `?${qs}` : ""}`,
    );
  },
  getCategory: (id: string) => apiFetch<PackageCategory>(`/packages/categories/${id}`),
  createCategory: (body: Partial<PackageCategory> & { code: string; name: string }) =>
    apiFetch<PackageCategory>("/packages/categories", { method: "POST", body }),
  updateCategory: (id: string, body: Partial<PackageCategory>) =>
    apiFetch<PackageCategory>(`/packages/categories/${id}`, { method: "PATCH", body }),
  removeCategory: (id: string) => apiFetch(`/packages/categories/${id}`, { method: "DELETE" }),

  list: (q?: PackageListFilters) => {
    const qs = buildPackageListQuery(q || {}).toString();
    return apiFetch<{ data: PackageMaster[]; total: number } | PackageMaster[]>(
      `/packages${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => apiFetch<PackageMaster>(`/packages/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch<PackageMaster>("/packages", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<PackageMaster>(`/packages/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/packages/${id}`, { method: "DELETE" }),

  publish: (id: string) => apiFetch<PackageMaster>(`/packages/${id}/publish`, { method: "POST", body: {} }),
  unpublish: (id: string) => apiFetch<PackageMaster>(`/packages/${id}/unpublish`, { method: "POST", body: {} }),
  archive: (id: string) => apiFetch<PackageMaster>(`/packages/${id}/archive`, { method: "POST", body: {} }),
  clone: (id: string) => apiFetch<PackageMaster>(`/packages/${id}/clone`, { method: "POST", body: {} }),
  schedule: (id: string, publishAt: string, expireAt?: string) =>
    apiFetch<PackageMaster>(`/packages/${id}/schedule`, {
      method: "POST",
      body: { publishAt, ...(expireAt ? { expireAt } : {}) },
    }),

  listGallery: (packageId: string) =>
    apiFetch<PackageGalleryItem[] | { data: PackageGalleryItem[] }>(`/packages/${packageId}/gallery`),
  addGalleryItem: (packageId: string, body: Partial<PackageGalleryItem> & { url: string }) =>
    apiFetch<PackageGalleryItem>(`/packages/${packageId}/gallery`, { method: "POST", body }),
  updateGalleryItem: (packageId: string, itemId: string, body: Partial<PackageGalleryItem>) =>
    apiFetch<PackageGalleryItem>(`/packages/${packageId}/gallery/${itemId}`, { method: "PATCH", body }),
  removeGalleryItem: (packageId: string, itemId: string) =>
    apiFetch(`/packages/${packageId}/gallery/${itemId}`, { method: "DELETE" }),

  listAvailability: (packageId: string) =>
    apiFetch<PackageAvailability[] | { data: PackageAvailability[] }>(`/packages/${packageId}/availability`),
  upsertAvailability: (packageId: string, body: Partial<PackageAvailability>) =>
    apiFetch<PackageAvailability>(`/packages/${packageId}/availability`, { method: "POST", body }),
  removeAvailability: (packageId: string, slotId: string) =>
    apiFetch(`/packages/${packageId}/availability/${slotId}`, { method: "DELETE" }),

  listFaqs: (packageId: string) =>
    apiFetch<PackageFaq[] | { data: PackageFaq[] }>(`/packages/${packageId}/faqs`),
  upsertFaq: (packageId: string, body: Partial<PackageFaq> & { question: string; answer: string }) =>
    apiFetch<PackageFaq>(`/packages/${packageId}/faqs`, { method: "POST", body }),
  removeFaq: (packageId: string, faqId: string) =>
    apiFetch(`/packages/${packageId}/faqs/${faqId}`, { method: "DELETE" }),

  reports: () => apiFetch<PackageReportSummary>("/packages/reports/summary"),
  exportCsv: () => apiFetch<string>("/packages/export.csv"),
  importCsv: (body: { csv?: string; rows?: Record<string, unknown>[] }) =>
    apiFetch<{ imported: number; skipped: number }>("/packages/import.csv", { method: "POST", body }),
};

export const sitePackagesApi = {
  list: (q?: PackageListFilters) => {
    const qs = buildPackageListQuery(q || {}).toString();
    return apiFetch<{ data: PackageMaster[]; total: number } | PackageMaster[]>(
      `/site/packages${qs ? `?${qs}` : ""}`,
      { skipRefresh: true, quietAuth: true },
    );
  },
  search: (q: PackageSearchFilters) => {
    const qs = buildPackageSearchQuery(q).toString();
    return apiFetch<{ data: PackageMaster[]; total: number }>(
      `/site/packages/search${qs ? `?${qs}` : ""}`,
      { skipRefresh: true, quietAuth: true },
    );
  },
  getBySlug: (slug: string) =>
    apiFetch<PackageMaster & { gallery?: PackageGalleryItem[]; faqs?: PackageFaq[]; related?: PackageMaster[] }>(
      `/site/packages/${encodeURIComponent(slug)}`,
      { skipRefresh: true, quietAuth: true },
    ),
  enquire: (slug: string, body: Record<string, unknown>) =>
    apiFetch<{ ok: boolean; leadId?: string | null; enquiryId?: string }>(
      `/site/packages/${encodeURIComponent(slug)}/enquire`,
      {
        method: "POST",
        body,
        skipRefresh: true,
        quietAuth: true,
      },
    ),
};

export const destinationsApi = {
  list: (q?: DestinationListFilters) => {
    const qs = buildDestinationListQuery(q || {}).toString();
    return apiFetch<{ data: DestinationMaster[]; total: number } | DestinationMaster[]>(
      `/destinations${qs ? `?${qs}` : ""}`,
    );
  },
  get: (id: string) => apiFetch<DestinationMaster>(`/destinations/${id}`),
  create: (body: Record<string, unknown>) =>
    apiFetch<DestinationMaster>("/destinations", { method: "POST", body }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<DestinationMaster>(`/destinations/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/destinations/${id}`, { method: "DELETE" }),
  publish: (id: string) =>
    apiFetch<DestinationMaster>(`/destinations/${id}/publish`, { method: "POST", body: {} }),
  unpublish: (id: string) =>
    apiFetch<DestinationMaster>(`/destinations/${id}/unpublish`, { method: "POST", body: {} }),
  archive: (id: string) =>
    apiFetch<DestinationMaster>(`/destinations/${id}/archive`, { method: "POST", body: {} }),
  getShowcaseSettings: () => apiFetch<DestinationShowcaseSettings>("/destinations/showcase-settings"),
  updateShowcaseSettings: (body: Partial<DestinationShowcaseSettings>) =>
    apiFetch<DestinationShowcaseSettings>("/destinations/showcase-settings", { method: "PUT", body }),
};

export const siteDestinationsApi = {
  list: (q?: DestinationListFilters) => {
    const qs = buildDestinationListQuery(q || {}).toString();
    return apiFetch<{ data: DestinationMaster[]; total: number } | DestinationMaster[]>(
      `/site/destinations${qs ? `?${qs}` : ""}`,
      { skipRefresh: true, quietAuth: true },
    );
  },
  browse: (q?: DestinationBrowseFilters) => {
    const qs = buildDestinationBrowseQuery(q || {}).toString();
    return apiFetch<{ data: DestinationMaster[]; total: number }>(
      `/site/destinations/browse${qs ? `?${qs}` : ""}`,
      { skipRefresh: true, quietAuth: true },
    );
  },
  getBySlug: (slug: string) =>
    apiFetch<
      DestinationMaster & {
        gallery?: DestinationGalleryItem[];
        packages?: PackageMaster[];
        related?: DestinationMaster[];
      }
    >(`/site/destinations/${encodeURIComponent(slug)}`, { skipRefresh: true, quietAuth: true }),
  settings: () =>
    apiFetch<DestinationShowcaseSettings>("/site/destinations/settings", {
      skipRefresh: true,
      quietAuth: true,
    }),
};

/* ---------- Enterprise UI (v4) — business partners, operations, admin ---------- */

export type AgentTier = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
};

export type Agent = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  /** Basis points — 250 = 2.5%. */
  commissionRateBps?: number;
  /** Minor units (poisha). */
  walletBalance?: number;
  /** pending | active | suspended | rejected */
  status?: string;
  // V6 Phase 1 — onboarding (all optional)
  tierId?: string | null;
  tier?: AgentTier | null;
  companyName?: string | null;
  contactPerson?: string | null;
  tradeLicenseNo?: string | null;
  nationalId?: string | null;
  kycStatus?: string | null;
  kycNotes?: string | null;
  appliedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  // V6.x — commercial onboarding profile (all optional)
  ownerName?: string | null;
  passportNo?: string | null;
  dob?: string | null;
  gender?: string | null;
  nationality?: string | null;
  businessType?: string | null;
  businessStartDate?: string | null;
  yearsExperience?: number | null;
  website?: string | null;
  facebookPage?: string | null;
  googleBusiness?: string | null;
  officeAddress?: string | null;
  city?: string | null;
  district?: string | null;
  country?: string | null;
  postalCode?: string | null;
  googleMapLocation?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankRoutingNumber?: string | null;
  bkash?: string | null;
  nagad?: string | null;
  rocket?: string | null;
  upay?: string | null;
  openingBalanceType?: string | null;
  openingBalance?: number | null;
  currency?: string | null;
  emergencyName?: string | null;
  emergencyRelationship?: string | null;
  emergencyPhone?: string | null;
  internalNotes?: string | null;
};

export type AgentDocument = {
  id: string;
  category: string;
  fileName: string;
  status: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
};

/** Agent onboarding audit entry (reuses AuditLog). */
export type AgentAuditRow = {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  createdAt: string;
};

export type CorporateClient = {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  billingAddress?: string | null;
  preferredServices?: string | null;
  /** Minor units (poisha). */
  creditLimit?: number;
  paymentTermsDays?: number;
  isActive?: boolean;
  notes?: string | null;
};

export const agentsApi = {
  list: (q?: { q?: string; status?: string; page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.status) p.set("status", q.status);
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<Paginated<Agent>>(`/agents${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<Agent>(`/agents/${id}`),
  create: (body: Partial<Agent> & { name: string; onboarding?: boolean; commissionRateBps?: number }) =>
    apiFetch<Agent>("/agents", { method: "POST", body }),
  update: (id: string, body: Partial<Agent> & { commissionRateBps?: number }) =>
    apiFetch<Agent>(`/agents/${id}`, { method: "PATCH", body }),
  // V6 Wave 1 — wallet ledger + funding rails
  walletLedger: (id: string) => apiFetch<WalletTxnRow[]>(`/agents/${id}/wallet/ledger`),
  walletReconcile: (id: string) => apiFetch<{ cachedBalance: number; ledgerSum: number; drift: number; reconciled: boolean }>(`/agents/${id}/wallet/reconcile`),
  walletRequests: (id: string) => apiFetch<{ topups: WalletRequest[]; withdrawals: WalletRequest[] }>(`/agents/${id}/wallet/requests`),
  walletTopup: (id: string, body: { amount: number; memo?: string }) => apiFetch<WalletRequest>(`/agents/${id}/wallet/topup`, { method: "POST", body }),
  walletWithdraw: (id: string, body: { amount: number; method?: string; bankRef?: string }) => apiFetch<WalletRequest>(`/agents/${id}/wallet/withdraw`, { method: "POST", body }),
  // V6.x — onboarding documents (reuse generic Document store; ownerType=agent)
  listDocuments: (id: string) => apiFetch<AgentDocument[]>(`/agents/${id}/documents`),
  uploadDocument: (id: string, file: File, category: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    return apiFetch<AgentDocument>(`/agents/${id}/documents`, { method: "POST", form: fd });
  },
  // V6 Phase 1 — onboarding lifecycle
  timeline: (id: string) => apiFetch<AgentAuditRow[]>(`/agents/${id}/timeline`),
  reviewKyc: (id: string, body: { kycStatus: string; kycNotes?: string }) =>
    apiFetch<Agent>(`/agents/${id}/kyc`, { method: "POST", body }),
  approve: (id: string) => apiFetch<Agent>(`/agents/${id}/approve`, { method: "POST" }),
  reject: (id: string, body: { reason: string }) => apiFetch<Agent>(`/agents/${id}/reject`, { method: "POST", body }),
  suspend: (id: string) => apiFetch<Agent>(`/agents/${id}/suspend`, { method: "POST" }),
  reinstate: (id: string) => apiFetch<Agent>(`/agents/${id}/reinstate`, { method: "POST" }),
};

export type WalletTxnRow = {
  id: string;
  type: string;
  amount: number;
  runningBalance?: number | null;
  memo?: string | null;
  createdAt: string;
};
export type WalletRequest = {
  id: string;
  agentId: string;
  amount: number;
  method?: string;
  bankRef?: string | null;
  status: string;
  memo?: string | null;
  createdAt: string;
};

export const walletRequestsApi = {
  list: (status?: string) => apiFetch<{ topups: WalletRequest[]; withdrawals: WalletRequest[] }>(`/wallet-requests${status ? `?status=${status}` : ""}`),
  decideTopup: (id: string, decision: "approve" | "reject") => apiFetch<WalletRequest>(`/wallet-requests/topup/${id}/${decision}`, { method: "POST" }),
  decideWithdrawal: (id: string, decision: "approve" | "reject") => apiFetch<WalletRequest>(`/wallet-requests/withdrawal/${id}/${decision}`, { method: "POST" }),
};

export const agentTiersApi = {
  list: () => apiFetch<AgentTier[]>("/agent-tiers"),
  create: (body: { name: string; description?: string; sortOrder?: number }) =>
    apiFetch<AgentTier>("/agent-tiers", { method: "POST", body }),
  update: (id: string, body: Partial<AgentTier>) => apiFetch<AgentTier>(`/agent-tiers/${id}`, { method: "PATCH", body }),
};

// V6 Wave 1 — commission engine
export type CommissionRule = {
  id: string;
  name: string;
  active: boolean;
  priority: number;
  basis: string; // fixed | percentage
  value: number; // poisha (fixed) | bps (percentage)
  agentId?: string | null;
  serviceType?: string | null;
  packageId?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
};
export type CommissionPreview = {
  invoiceId: string;
  agentId: string | null;
  agentName?: string;
  baseAmount: number;
  basis?: string;
  value?: number;
  computedAmount: number;
  source: "rule" | "agent_rate" | "none";
  ruleId?: string;
  ruleName?: string;
};
export type CommissionLedgerRow = {
  id: string;
  agentId: string;
  entryType: string;
  amount: number;
  runningBalance: number;
  memo?: string | null;
  createdAt: string;
};

export const commissionRulesApi = {
  list: (q?: { active?: boolean }) => apiFetch<CommissionRule[]>(`/commission-rules${q?.active != null ? `?active=${q.active}` : ""}`),
  create: (body: Partial<CommissionRule> & { name: string; basis: string; value: number }) =>
    apiFetch<CommissionRule>("/commission-rules", { method: "POST", body }),
  update: (id: string, body: Partial<CommissionRule>) => apiFetch<CommissionRule>(`/commission-rules/${id}`, { method: "PATCH", body }),
  remove: (id: string) => apiFetch(`/commission-rules/${id}`, { method: "DELETE" }),
};
export const commissionApi = {
  previewInvoice: (invoiceId: string) => apiFetch<CommissionPreview>(`/commissions/preview/invoice/${invoiceId}`),
  generateInvoice: (invoiceId: string) => apiFetch<{ id: string; amount: number; status: string }>(`/commissions/generate/invoice/${invoiceId}`, { method: "POST" }),
  ledger: (agentId: string) => apiFetch<CommissionLedgerRow[]>(`/commissions/ledger/${agentId}`),
};

export const corporateClientsApi = {
  list: (q?: { q?: string; page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.q) p.set("q", q.q);
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<Paginated<CorporateClient>>(`/corporate-clients${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => apiFetch<CorporateClient>(`/corporate-clients/${id}`),
  create: (body: Partial<CorporateClient> & { companyName: string }) =>
    apiFetch<CorporateClient>("/corporate-clients", { method: "POST", body }),
  update: (id: string, body: Partial<CorporateClient>) =>
    apiFetch<CorporateClient>(`/corporate-clients/${id}`, { method: "PATCH", body }),
};

/** Outbox row. Delivery adapters are not configured, so rows stay `pending`. */
export type NotificationRow = {
  id: string;
  channel: string;
  recipient: string;
  subject?: string | null;
  body: string;
  status: string;
  relatedType?: string | null;
  relatedId?: string | null;
  error?: string | null;
  createdAt: string;
  sentAt?: string | null;
};

export const notificationsApi = {
  list: (q?: { status?: string; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<NotificationRow[]>(`/notifications${qs ? `?${qs}` : ""}`);
  },
  process: () =>
    apiFetch<{ pending: number; delivered: number; note: string }>("/notifications/process", {
      method: "POST",
      body: {},
    }),
};

export type OpsTask = {
  id: string;
  title: string;
  description?: string | null;
  applicationId?: string | null;
  assignedTo?: string | null;
  createdBy: string;
  priority: string;
  status: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

export const tasksApi = {
  list: (q?: { status?: string; mine?: boolean; applicationId?: string; page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.status) p.set("status", q.status);
    if (q?.mine) p.set("mine", "true");
    if (q?.applicationId) p.set("applicationId", q.applicationId);
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<Paginated<OpsTask>>(`/tasks${qs ? `?${qs}` : ""}`);
  },
  update: (id: string, body: Record<string, unknown>) => apiFetch(`/tasks/${id}`, { method: "PATCH", body }),
};

export type WorkflowTemplateStage = {
  id: string;
  templateId: string;
  stageNo: number;
  name: string;
  slaHours?: number | null;
};

export type WorkflowTemplate = {
  id: string;
  serviceType: string;
  name: string;
  version: number;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  stages: WorkflowTemplateStage[];
};

export const workflowApi = {
  list: (serviceType?: string) =>
    apiFetch<WorkflowTemplate[]>(
      `/workflow/templates${serviceType ? `?serviceType=${encodeURIComponent(serviceType)}` : ""}`,
    ),
  get: (id: string) => apiFetch<WorkflowTemplate>(`/workflow/templates/${id}`),
  activate: (id: string) =>
    apiFetch<WorkflowTemplate>(`/workflow/templates/${id}/activate`, { method: "POST", body: {} }),
};

export type ExpenseRow = {
  id: string;
  category: string;
  description?: string | null;
  amount: number;
  vendorName?: string | null;
  supplierId?: string | null;
  accountId: string;
  method: string;
  reference?: string | null;
  paidAt: string;
  recordedBy: string;
};

export const expensesApi = {
  list: (q?: { category?: string; page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (q?.category) p.set("category", q.category);
    if (q?.page) p.set("page", String(q.page));
    if (q?.limit) p.set("limit", String(q.limit));
    const qs = p.toString();
    return apiFetch<Paginated<ExpenseRow>>(`/expenses${qs ? `?${qs}` : ""}`);
  },
  create: (body: Record<string, unknown>) => apiFetch<ExpenseRow>("/expenses", { method: "POST", body }),
};

export type FinanceSummary = {
  currency: string;
  note: string;
  invoiced: number;
  collected: number;
  receivable: number;
  refunds: number;
  expenses: number;
  netCash: number;
  cashPosition: number;
  accounts: { name: string; type: string; currentBalance: number }[];
};

export type OperationalReport = {
  casesByStatus: Record<string, number>;
  casesByService: Record<string, number>;
  leadsByStatus: Record<string, number>;
  openTasks: number;
  unassignedWebEnquiries: number;
};

export const reportsApi = {
  financeSummary: () => apiFetch<FinanceSummary>("/finance/summary"),
  operational: () => apiFetch<OperationalReport>("/reports/operational"),
};

export const adminApi = {
  listSettings: () => apiFetch<{ key: string; value: unknown }[]>("/settings"),
  setSetting: (key: string, value: unknown) =>
    apiFetch(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: { value } }),
  listUsers: () => apiFetch<StaffUser[] | Paginated<StaffUser>>("/users"),
  createUser: (body: Record<string, unknown>) => apiFetch<StaffUser>("/users", { method: "POST", body }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    apiFetch<StaffUser>(`/users/${id}`, { method: "PATCH", body }),
};
