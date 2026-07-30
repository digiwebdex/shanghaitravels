export const WORKFLOW_STAGES = [
  { key: "inquiry",    label: "Inquiry",           short: "Inquiry" },
  { key: "ocr",        label: "Passport OCR",       short: "Passport" },
  { key: "checklist",  label: "Checklist",          short: "Checklist" },
  { key: "docs",       label: "Document Upload",    short: "Documents" },
  { key: "payment",    label: "Payment",            short: "Payment" },
  { key: "submission", label: "Submission",         short: "Submit" },
  { key: "processing", label: "Processing",         short: "Processing" },
  { key: "interview",  label: "Interview / Biometric", short: "Interview" },
  { key: "approval",   label: "Approval",           short: "Approval" },
  { key: "delivery",   label: "Delivery",           short: "Delivery" },
];

export type DocStatus = "pending" | "uploaded" | "verified" | "rejected";
export type AppStatus = "draft" | "submitted" | "processing" | "action_required" | "interview" | "approved" | "rejected" | "delivered";

export interface AppDocument {
  name: string;
  status: DocStatus;
  required: boolean;
  note?: string;
}

export interface ApplicationRecord {
  id: string;
  ref: string;
  type: "Visa" | "Flight" | "Hotel" | "Tour" | "Hajj";
  service: string;
  destination: string;
  status: AppStatus;
  stage: number;
  submittedDate: string;
  expectedDate: string;
  travelDate: string;
  travellers: number;
  totalFee: string;
  feePaid: boolean;
  docs: AppDocument[];
  timeline: { stage: number; date: string; note: string }[];
}

export const MOCK_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "app-001", ref: "TRV-38241",
    type: "Visa", service: "UK Standard Visitor Visa",
    destination: "United Kingdom", status: "processing", stage: 6,
    submittedDate: "02 Jan 2025", expectedDate: "20 Jan 2025", travelDate: "15 Feb 2025",
    travellers: 2, totalFee: "AED 1,020", feePaid: true,
    docs: [
      { name: "Passport Copy",         status: "verified",  required: true },
      { name: "Bank Statement (3 mo)", status: "verified",  required: true },
      { name: "Employment Letter",     status: "verified",  required: true },
      { name: "Hotel Bookings",        status: "uploaded",  required: true },
      { name: "Return Flights",        status: "uploaded",  required: true },
      { name: "Travel Insurance",      status: "pending",   required: false },
      { name: "Salary Certificate",    status: "rejected",  required: true, note: "Please reupload — document expired" },
    ],
    timeline: [
      { stage: 0, date: "28 Dec 2024", note: "Inquiry submitted" },
      { stage: 1, date: "29 Dec 2024", note: "Passport data verified via OCR" },
      { stage: 2, date: "29 Dec 2024", note: "Document checklist reviewed" },
      { stage: 3, date: "31 Dec 2024", note: "Documents uploaded (6/7 verified)" },
      { stage: 4, date: "01 Jan 2025", note: "Application fee paid — AED 1,020" },
      { stage: 5, date: "02 Jan 2025", note: "Application submitted to UKVI" },
      { stage: 6, date: "03 Jan 2025", note: "Under review at UK embassy" },
    ],
  },
  {
    id: "app-002", ref: "TRV-38105",
    type: "Visa", service: "Schengen Visa (France)",
    destination: "France / Schengen", status: "action_required", stage: 3,
    submittedDate: "", expectedDate: "25 Jan 2025", travelDate: "10 Feb 2025",
    travellers: 1, totalFee: "AED 580", feePaid: false,
    docs: [
      { name: "Passport Copy",         status: "verified",  required: true },
      { name: "Bank Statement (3 mo)", status: "uploaded",  required: true },
      { name: "Employment Letter",     status: "pending",   required: true },
      { name: "Travel Insurance (€30k)",status: "pending",  required: true },
      { name: "Hotel Bookings",        status: "pending",   required: true },
      { name: "Return Flights",        status: "pending",   required: true },
    ],
    timeline: [
      { stage: 0, date: "05 Jan 2025", note: "Inquiry submitted" },
      { stage: 1, date: "05 Jan 2025", note: "Passport data verified" },
      { stage: 2, date: "06 Jan 2025", note: "Document checklist reviewed" },
      { stage: 3, date: "06 Jan 2025", note: "Awaiting document uploads" },
    ],
  },
  {
    id: "app-003", ref: "TRV-37902",
    type: "Tour", service: "Bali Tropical Escape Package",
    destination: "Bali, Indonesia", status: "approved", stage: 8,
    submittedDate: "10 Dec 2024", expectedDate: "15 Dec 2024", travelDate: "05 Jan 2025",
    travellers: 2, totalFee: "AED 9,600", feePaid: true,
    docs: [
      { name: "Passport Copy",   status: "verified", required: true },
      { name: "Passport Photos", status: "verified", required: true },
    ],
    timeline: [
      { stage: 0, date: "08 Dec 2024", note: "Package inquiry submitted" },
      { stage: 1, date: "08 Dec 2024", note: "Passports verified" },
      { stage: 2, date: "09 Dec 2024", note: "Checklist completed" },
      { stage: 3, date: "09 Dec 2024", note: "Documents verified" },
      { stage: 4, date: "10 Dec 2024", note: "Payment received — AED 9,600" },
      { stage: 5, date: "10 Dec 2024", note: "Booking confirmed with partner" },
      { stage: 6, date: "11 Dec 2024", note: "Itinerary processing" },
      { stage: 7, date: "13 Dec 2024", note: "No interview required" },
      { stage: 8, date: "15 Dec 2024", note: "Booking confirmed — vouchers ready" },
    ],
  },
];

export const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string }> = {
  draft:           { label: "Draft",            color: "text-muted-foreground", bg: "bg-muted" },
  submitted:       { label: "Submitted",        color: "text-[#1E40AF]",        bg: "bg-[#DBEAFE]" },
  processing:      { label: "Processing",       color: "text-[#0369A1]",        bg: "bg-[#E0F2FE]" },
  action_required: { label: "Action Required",  color: "text-orange-700",       bg: "bg-orange-100" },
  interview:       { label: "Interview Scheduled", color: "text-purple-700",    bg: "bg-purple-100" },
  approved:        { label: "Approved",         color: "text-green-700",        bg: "bg-green-100" },
  rejected:        { label: "Rejected",         color: "text-red-700",          bg: "bg-red-100" },
  delivered:       { label: "Delivered",        color: "text-emerald-700",      bg: "bg-emerald-100" },
};
