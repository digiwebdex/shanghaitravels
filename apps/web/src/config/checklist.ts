/** Fallback China visa document checklist (matches seeded Setting when unavailable). */

export type ChinaChecklist = {
  common: string[];
  types: Record<string, string[]>;
};

export const DEFAULT_CHINA_CHECKLIST: ChinaChecklist = {
  common: [
    "Passport (original, 6+ months validity, 2+ blank pages)",
    "Passport bio-page photocopy",
    "1 recent photo 48x33mm, white background",
    "Completed & signed COVA online application form",
    "National ID / birth certificate",
  ],
  types: {
    "L (Tourist)": [
      "Confirmed round-trip flight itinerary",
      "Hotel booking or invitation letter",
      "Bank statement (last 6 months)",
    ],
    "M (Business)": [
      "Invitation letter from Chinese company/partner",
      "Applicant trade licence / employer letter",
      "Bank statement",
    ],
    "X1/X2 (Student)": [
      "Admission notice (JW201/JW202 form)",
      "Enrollment / offer letter from Chinese institution",
      "Financial proof",
    ],
    "Z (Work)": [
      "Foreigner's Work Permit Notification",
      "Invitation/employment letter from Chinese employer",
      "Medical / other embassy-required docs",
    ],
    "Q1/Q2 (Family — Chinese relative)": [
      "Invitation from Chinese relative",
      "Proof of kinship",
      "Relative ID / residence proof",
    ],
    "S1/S2 (Family — foreigner in China)": [
      "Invitation from family member in China",
      "Proof of relationship",
      "Their residence permit copy",
    ],
    "G (Transit)": ["Onward flight ticket", "Visa for the onward destination country"],
  },
};

/** Category drives checklist + API `visaType` (tourist | business | …). */
export const VISA_CATEGORY_OPTIONS = [
  { value: "tourist", label: "Tourist", checklistKey: "L (Tourist)" },
  { value: "business", label: "Business", checklistKey: "M (Business)" },
  { value: "student", label: "Student", checklistKey: "X1/X2 (Student)" },
  { value: "work", label: "Work", checklistKey: "Z (Work)" },
  { value: "family", label: "Family", checklistKey: "Q1/Q2 (Family — Chinese relative)" },
  { value: "transit", label: "Transit", checklistKey: "G (Transit)" },
] as const;

/** Letter / subtype shown as “Visa type”; keyed by category. */
export const VISA_LETTER_BY_CATEGORY: Record<string, { value: string; label: string }[]> = {
  tourist: [{ value: "L", label: "L — Tourist" }],
  business: [{ value: "M", label: "M — Business" }],
  student: [
    { value: "X1", label: "X1 — Long-term study" },
    { value: "X2", label: "X2 — Short-term study" },
  ],
  work: [{ value: "Z", label: "Z — Work" }],
  family: [
    { value: "Q1", label: "Q1 — Family (Chinese relative)" },
    { value: "Q2", label: "Q2 — Family visit (Chinese relative)" },
    { value: "S1", label: "S1 — Family (foreigner in China)" },
    { value: "S2", label: "S2 — Family visit (foreigner in China)" },
  ],
  transit: [{ value: "G", label: "G — Transit" }],
};

/** @deprecated Prefer VISA_CATEGORY_OPTIONS — kept for list/detail pages. */
export const VISA_TYPE_OPTIONS = [
  { value: "tourist", label: "Tourist L", checklistKey: "L (Tourist)" },
  { value: "business", label: "Business M", checklistKey: "M (Business)" },
  { value: "student", label: "Student X", checklistKey: "X1/X2 (Student)" },
  { value: "work", label: "Work Z", checklistKey: "Z (Work)" },
  { value: "family", label: "Family Q/S", checklistKey: "Q1/Q2 (Family — Chinese relative)" },
  { value: "transit", label: "Transit G", checklistKey: "G (Transit)" },
] as const;

export const DEFAULT_VISA_DESTINATIONS = [
  "China",
  "Thailand",
  "Malaysia",
  "Singapore",
  "United Arab Emirates",
  "Saudi Arabia",
  "Schengen",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Japan",
  "South Korea",
  "India",
  "Turkey",
] as const;

export const DOC_CATEGORIES = [
  "passport",
  "photo",
  "bank_statement",
  "invitation_letter",
  "admission_notice",
  "financial_proof",
  "return_ticket",
  "hotel_booking",
  "hotel_voucher",
  "transport_voucher",
  "tour_voucher",
  "hajj_passport",
  "hajj_visa",
  "hajj_ticket",
  "hajj_hotel_voucher",
  "hajj_transport_voucher",
  "hajj_pilgrim_doc",
  "other",
] as const;
