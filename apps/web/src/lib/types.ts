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
  tour?: TourDetail | null;
  transport?: TransportDetail | null;
  hajjUmrah?: HajjDetail | null;
  createdAt?: string;
  completedAt?: string | null;
};

export type HajjDetail = {
  id?: string;
  applicationId?: string;
  packageType?: string | null;
  year?: string | null;
  pilgrimName?: string | null;
  passportNo?: string | null;
  mahramName?: string | null;
  packageName?: string | null;
  packageCode?: string | null;
  packageCategory?: string | null;
  groupCode?: string | null;
  groupName?: string | null;
  leaderName?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  mahramRelation?: string | null;
  healthNotes?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  visaStatus?: string | null;
  visaNo?: string | null;
  passportStatus?: string | null;
  flightNo?: string | null;
  airline?: string | null;
  transportNote?: string | null;
  roomAllocation?: string | null;
  occupancyNote?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  paymentPlanNote?: string | null;
  supplierCostPoisha?: number | null;
  sellingPricePoisha?: number | null;
  paidPoisha?: number | null;
  confirmationNo?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  hotelMakkah?: string | null;
  hotelMadinah?: string | null;
  roomType?: string | null;
  notes?: string | null;
};

export type HajjUmrahPackageProduct = {
  id: string;
  code: string;
  name: string;
  kind: string;
  category: string;
  season?: string | null;
  year?: string | null;
  durationDays?: number | null;
  departureCity?: string | null;
  hotelMakkah?: string | null;
  hotelMadinah?: string | null;
  roomType?: string | null;
  occupancyNote?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  capacity?: number | null;
  supplierCostPoisha?: number | null;
  sellingPricePoisha?: number | null;
  notes?: string | null;
  isActive?: boolean;
  _count?: { groups?: number };
};

export type HajjPilgrim = {
  id: string;
  code: string;
  fullName: string;
  passportNo?: string | null;
  nationality?: string | null;
  gender?: string | null;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  mahramName?: string | null;
  mahramRelation?: string | null;
  healthNotes?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  visaStatus?: string | null;
  visaNo?: string | null;
  passportStatus?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type HajjGroup = {
  id: string;
  code: string;
  name: string;
  kind: string;
  packageId?: string | null;
  season?: string | null;
  year?: string | null;
  leaderName?: string | null;
  leaderPhone?: string | null;
  capacity?: number | null;
  enrolled?: number | null;
  flightNo?: string | null;
  airline?: string | null;
  transportNote?: string | null;
  hotelMakkah?: string | null;
  hotelMadinah?: string | null;
  roomingNote?: string | null;
  status: string;
  departAt?: string | null;
  returnAt?: string | null;
  notes?: string | null;
  isActive?: boolean;
  package?: { id: string; code: string; name: string } | null;
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

export type TransportDetail = {
  id?: string;
  applicationId?: string;
  vehicleType?: string | null;
  serviceKind?: string | null;
  pickupLocation?: string | null;
  dropLocation?: string | null;
  routeName?: string | null;
  scheduledAt?: string | null;
  passengers?: number | null;
  driverName?: string | null;
  vehicleNo?: string | null;
  confirmationNo?: string | null;
  notes?: string | null;
};

/** Supplier vehicle offer (not owned fleet). */
export type TransportVehicleType = {
  id: string;
  name: string;
  category: string;
  capacity?: number | null;
  notes?: string | null;
  isActive?: boolean;
};

export type TransportRoute = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  kind: string;
  notes?: string | null;
  isActive?: boolean;
};

export type TourDetail = {
  id?: string;
  applicationId?: string;
  packageName?: string | null;
  packageCode?: string | null;
  packageType?: string | null;
  category?: string | null;
  destination?: string | null;
  season?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  pax?: number | null;
  itinerary?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  activities?: string | null;
  hotelsNote?: string | null;
  transportNote?: string | null;
  flightsNote?: string | null;
  visaRequirements?: string | null;
  insuranceNote?: string | null;
  occupancyNote?: string | null;
  childPolicy?: string | null;
  seasonalPricingNote?: string | null;
  costBreakdown?: string | null;
  supplierCostPoisha?: number | null;
  sellingPricePoisha?: number | null;
  confirmationNo?: string | null;
  notes?: string | null;
};

export type TourPackageProduct = {
  id: string;
  code: string;
  name: string;
  packageType: string;
  category: string;
  destination?: string | null;
  country?: string | null;
  city?: string | null;
  season?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  itinerary?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  activities?: string | null;
  hotelsNote?: string | null;
  transportNote?: string | null;
  flightsNote?: string | null;
  visaRequirements?: string | null;
  insuranceNote?: string | null;
  occupancyNote?: string | null;
  childPolicy?: string | null;
  seasonalPricingNote?: string | null;
  costBreakdown?: string | null;
  supplierCostPoisha?: number | null;
  sellingPricePoisha?: number | null;
  notes?: string | null;
  isActive?: boolean;
  _count?: { departures?: number };
};

export type TourDeparture = {
  id: string;
  packageId: string;
  departAt: string;
  returnAt?: string | null;
  seats?: number | null;
  status: string;
  notes?: string | null;
  package?: { id: string; code: string; name: string };
};

export type TourDestination = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  season?: string | null;
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

export type GlAccountGroup = {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { accounts?: number };
};

export type GlAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  groupId?: string | null;
  parentId?: string | null;
  isHeader?: boolean;
  isPostable?: boolean;
  currencyCode?: string | null;
  branchId?: string | null;
  taxCode?: string | null;
  costCenterRequired?: boolean;
  description?: string | null;
  isActive?: boolean;
  group?: { id: string; code: string; name: string } | null;
};

export type FiscalYear = {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  periods?: AccountingPeriod[];
};

export type AccountingPeriod = {
  id: string;
  fiscalYearId: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  closedAt?: string | null;
};

export type CostCenter = {
  id: string;
  code: string;
  name: string;
  branchId?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type CurrencyRow = {
  id: string;
  code: string;
  name: string;
  symbol?: string | null;
  decimalPlaces?: number;
  isBase?: boolean;
  isActive?: boolean;
};

export type ExchangeRateRow = {
  id: string;
  fromCode: string;
  toCode: string;
  rateScaled: string;
  rate?: number;
  rateDate: string;
  source?: string | null;
};

export type JournalLine = {
  id?: string;
  lineNo: number;
  glAccountId: string;
  costCenterId?: string | null;
  debitPoisha: number;
  creditPoisha: number;
  currencyCode?: string;
  debitBasePoisha?: number;
  creditBasePoisha?: number;
  memo?: string | null;
  glAccount?: { id: string; code: string; name: string; type?: string };
  costCenter?: { id: string; code: string; name: string } | null;
};

export type JournalEntry = {
  id: string;
  journalNo: string;
  entryDate: string;
  periodId: string;
  branchId?: string | null;
  currencyCode: string;
  type: string;
  status: string;
  memo?: string | null;
  reference?: string | null;
  totalDebitPoisha: number;
  totalCreditPoisha: number;
  approvedBy?: string | null;
  postedAt?: string | null;
  period?: { id?: string; code: string; name: string; status?: string };
  lines?: JournalLine[];
  _count?: { lines?: number };
};

export type ArDocument = {
  id: string;
  docNo: string;
  type: string;
  status: string;
  customerId: string;
  applicationId?: string | null;
  invoiceId?: string | null;
  currencyCode: string;
  issueDate: string;
  dueDate?: string | null;
  subtotalPoisha: number;
  taxPoisha: number;
  totalPoisha: number;
  balancePoisha: number;
  memo?: string | null;
  reference?: string | null;
  journalId?: string | null;
  approvedBy?: string | null;
  postedAt?: string | null;
  customer?: { id: string; code: string; fullName: string; phone?: string | null };
  application?: { id: string; referenceNo: string; serviceType: string; title?: string | null } | null;
  invoice?: { id: string; invoiceNo: string; status: string; total: number } | null;
  journal?: { id: string; journalNo: string; status: string } | null;
  lines?: ArDocumentLine[];
  _count?: { lines?: number };
};

export type ArDocumentLine = {
  id?: string;
  lineNo: number;
  description: string;
  quantity: number;
  unitPricePoisha: number;
  amountPoisha: number;
  glAccountCode?: string | null;
};

export type ApDocument = {
  id: string;
  docNo: string;
  type: string;
  status: string;
  supplierId: string;
  applicationId?: string | null;
  currencyCode: string;
  issueDate: string;
  dueDate?: string | null;
  subtotalPoisha: number;
  taxPoisha: number;
  totalPoisha: number;
  balancePoisha: number;
  memo?: string | null;
  reference?: string | null;
  journalId?: string | null;
  approvedBy?: string | null;
  postedAt?: string | null;
  supplier?: { id: string; code: string; name: string; type?: string; phone?: string | null };
  application?: { id: string; referenceNo: string; serviceType: string; title?: string | null } | null;
  journal?: { id: string; journalNo: string; status: string } | null;
  lines?: ApDocumentLine[];
  _count?: { lines?: number };
};

export type ApDocumentLine = {
  id?: string;
  lineNo: number;
  description: string;
  quantity: number;
  unitPricePoisha: number;
  amountPoisha: number;
  glAccountCode?: string | null;
};

export type AgingRow = {
  customerId?: string;
  supplierId?: string;
  code: string;
  name: string;
  current: number;
  "1-30": number;
  "31-60": number;
  "61-90": number;
  "90+": number;
  total: number;
};

export type BankMaster = {
  id: string;
  code: string;
  name: string;
  swiftBic?: string | null;
  countryCode?: string | null;
  isActive?: boolean;
  _count?: { accounts?: number };
};

export type BankAccountRow = {
  id: string;
  branchId?: string | null;
  bankMasterId?: string | null;
  kind: string;
  name: string;
  accountNo?: string | null;
  iban?: string | null;
  currencyCode: string;
  glAccountId: string;
  cashAccountId?: string | null;
  openingBalancePoisha: number;
  isActive?: boolean;
  bankMaster?: { id: string; code: string; name: string } | null;
  glAccount?: { id: string; code: string; name: string };
  cashAccount?: { id: string; name: string; type?: string; currentBalance?: number } | null;
};

export type BankMovement = {
  id: string;
  movementNo: string;
  type: string;
  status: string;
  fromBankAccountId?: string | null;
  toBankAccountId?: string | null;
  amountPoisha: number;
  movementDate: string;
  memo?: string | null;
  reference?: string | null;
  journalId?: string | null;
  fromBankAccount?: { id: string; name: string; kind: string; accountNo?: string | null } | null;
  toBankAccount?: { id: string; name: string; kind: string; accountNo?: string | null } | null;
  journal?: { id: string; journalNo: string; status: string } | null;
};

export type ChequeRow = {
  id: string;
  bankAccountId: string;
  direction: string;
  chequeNo: string;
  chequeDate: string;
  amountPoisha: number;
  payeeOrDrawer?: string | null;
  status: string;
  printedAt?: string | null;
  bankAccount?: { id: string; name: string; accountNo?: string | null };
};
