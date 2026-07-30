/** Shared domain types matching Nest/Prisma responses (Phase A). */

export type Me = {
  id: string;
  email: string;
  fullName: string | null;
  mustChangePassword: boolean;
  branchId: string | null;
  role: string;
  permissions: string[];
  activeServices?: string[];
};

export type Customer = {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dob?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
  passports?: Passport[];
};

export type Passport = {
  id: string;
  passportNo: string;
  issuingCountry?: string | null;
  /** Nest create DTO aliases (request body). */
  dateOfIssue?: string | null;
  dateOfExpiry?: string | null;
  /** Prisma column names (response body). */
  issueDate?: string | null;
  expiryDate?: string | null;
  isPrimary?: boolean;
};

/** Normalize Nest passport date fields for display. */
export function passportExpiry(p: Passport): string {
  return p.expiryDate || p.dateOfExpiry || "—";
}

export type CaseStatus =
  | "draft"
  | "in_progress"
  | "docs_required"
  | "on_hold"
  | "submitted"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type StageStatus = "pending" | "active" | "done" | "blocked";

export type ApplicationStage = {
  id: string;
  stageNo: number;
  name: string;
  status: StageStatus;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type ApplicationEvent = {
  id: string;
  type: string;
  message: string;
  userId?: string | null;
  createdAt: string;
};

export type VisaDetail = {
  id?: string;
  visaType?: string | null;
  destination?: string | null;
  embassy?: string | null;
  entryType?: string | null;
  durationDays?: number | null;
  applicationNo?: string | null;
  appointmentAt?: string | null;
  submittedAt?: string | null;
  decisionAt?: string | null;
  visaNumber?: string | null;
  outcome?: string | null;
  notes?: string | null;
};

export type Application = {
  id: string;
  referenceNo: string;
  serviceType: string;
  title?: string | null;
  status: CaseStatus;
  currentStage: number;
  totalStages: number;
  priority: string;
  assignedTo?: string | null;
  source?: string;
  direction?: string;
  customerId: string;
  customer?: Customer;
  stages?: ApplicationStage[];
  events?: ApplicationEvent[];
  docs?: unknown[];
  visa?: VisaDetail | null;
  airTicket?: AirTicketDetail | null;
  hotel?: HotelDetail | null;
  tour?: unknown;
  transport?: unknown;
  createdAt?: string;
  completedAt?: string | null;
};

export type AirTicketDetail = {
  id?: string;
  applicationId?: string;
  pnr?: string | null;
  airline?: string | null;
  flightNo?: string | null;
  origin?: string | null;
  destination?: string | null;
  tripType?: string | null;
  departAt?: string | null;
  returnAt?: string | null;
  cabinClass?: string | null;
  passengerName?: string | null;
  ticketNo?: string | null;
  notes?: string | null;
};

export type HotelDetail = {
  id?: string;
  applicationId?: string;
  hotelName?: string | null;
  city?: string | null;
  country?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  nights?: number | null;
  roomType?: string | null;
  mealPlan?: string | null;
  rooms?: number | null;
  guests?: number | null;
  confirmationNo?: string | null;
  notes?: string | null;
};

/** Reference catalog property (Hotel master). */
export type HotelProperty = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  stars?: number | null;
  phone?: string | null;
  notes?: string | null;
  isActive?: boolean;
  isExample?: boolean;
};

export type Supplier = {
  id: string;
  code: string;
  name: string;
  type?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type Journey = {
  stages: ApplicationStage[];
  events: ApplicationEvent[];
};

export type AppDocument = {
  id: string;
  category?: string;
  fileName?: string;
  status?: string;
  isPassport?: boolean;
  createdAt?: string;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  status: string;
  subtotal: number;
  total: number;
  paid?: number;
  due?: number;
  customerId: string;
  applicationId?: string | null;
  items?: { description: string; quantity: number; unitPrice: number; amount: number }[];
  payments?: Payment[];
};

export type Payment = {
  id: string;
  amount: number;
  kind: string;
  method: string;
  reference?: string | null;
  receivedAt?: string;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
};

export type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

export type OcrScan = {
  id: string;
  status: string;
  confidence?: number;
  fields?: Record<string, unknown>;
  provider?: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
