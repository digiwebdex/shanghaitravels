/**
 * Heuristic extractors for non-passport document types (Vision text → fields).
 */
import { FieldResult } from "./merge";

function after(text: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim().split(/\n/)[0].trim();
  }
  return null;
}

function normDate(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim().replace(/[./]/g, "-");
  let m = s.match(/\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/\b(\d{2})[-\s](\d{2})[-\s]((?:19|20)\d{2})\b/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

function field(
  key: string,
  label: string,
  value: string | null,
  confidence: number,
  source = "viz",
): FieldResult {
  const conf = Math.round(Math.max(0, Math.min(100, confidence)));
  return {
    key,
    label,
    value,
    confidence: conf,
    source: source as FieldResult["source"],
    mismatch: false,
    lowConfidence: conf < 90,
  };
}

function pack(fields: FieldResult[]) {
  const fieldMap: Record<string, string | null> = {};
  for (const f of fields) fieldMap[f.key] = f.value;
  const extracted = fields.filter((f) => f.value);
  const averageConfidence = extracted.length
    ? extracted.reduce((a, f) => a + f.confidence, 0) / extracted.length
    : 0;
  const failedFields = fields.filter((f) => !f.value).map((f) => f.key);
  return {
    fields,
    fieldMap,
    averageConfidence: Math.round(averageConfidence * 10) / 10,
    extractionRate: fields.length ? extracted.length / fields.length : 0,
    failedFields,
    mismatches: [] as string[],
    mrzValid: false,
  };
}

export function extractNationalId(raw: string) {
  const t = raw;
  const u = raw.toUpperCase();
  const nid =
    after(u, [
      /NID\s*(?:NO|NUMBER|#)?\s*[:.]?\s*(\d{10,17})/,
      /IDENTITY\s*(?:NO|NUMBER)\s*[:.]?\s*(\d{10,17})/,
      /\b(\d{10}|\d{13}|\d{17})\b/,
    ]) || null;
  const fullName = after(t, [/(?:NAME|নাম)\s*[:.]?\s*([A-Za-z\u0980-\u09FF][^\n]{2,60})/i]);
  const father = after(t, [/(?:FATHER|FATHER'?S\s*NAME|পিতা)\s*[:.]?\s*([^\n]{2,60})/i]);
  const mother = after(t, [/(?:MOTHER|MOTHER'?S\s*NAME|মাতা)\s*[:.]?\s*([^\n]{2,60})/i]);
  const dob = normDate(after(u, [/(?:DATE\s*OF\s*BIRTH|DOB|জন্ম)\s*[:.]?\s*([0-9/\-. ]{6,20})/i]));
  const genderRaw = after(u, [/(?:SEX|GENDER|লিঙ্গ)\s*[:.]?\s*(M|F|MALE|FEMALE|পুরুষ|মহিলা)/i]);
  let gender: string | null = null;
  if (genderRaw) {
    if (/^M|পুরুষ/i.test(genderRaw)) gender = "M";
    else if (/^F|মহিলা/i.test(genderRaw)) gender = "F";
  }
  const address = after(t, [/(?:ADDRESS|ঠিকানা)\s*[:.]?\s*([^\n]{5,120})/i]);
  const issueDate = normDate(after(u, [/(?:ISSUE|ISSUED)\s*[:.]?\s*([0-9/\-. ]{6,20})/i]));

  const nidOk = !!nid && (nid.length === 10 || nid.length === 13 || nid.length === 17);
  return pack([
    field("nidNumber", "NID Number", nid, nidOk ? 92 : nid ? 70 : 0),
    field("fullName", "Full Name", fullName, fullName ? 85 : 0),
    field("fatherName", "Father's Name", father, father ? 80 : 0),
    field("motherName", "Mother's Name", mother, mother ? 80 : 0),
    field("dateOfBirth", "Date of Birth", dob, dob ? 88 : 0),
    field("gender", "Gender", gender, gender ? 90 : 0),
    field("address", "Address", address, address ? 75 : 0),
    field("dateOfIssue", "Issue Date", issueDate, issueDate ? 70 : 0),
    field("docType", "Document Type", "national_id", 95),
  ]);
}

export function extractVisa(raw: string) {
  const u = raw.toUpperCase();
  const visaNo = after(u, [/VISA\s*(?:NO|NUMBER|#)\s*[:.]?\s*([A-Z0-9]{5,20})/, /PERMIT\s*NO\s*[:.]?\s*([A-Z0-9]{5,20})/]);
  const country = after(u, [/(?:ISSUING\s*COUNTRY|COUNTRY|VALID\s*FOR)\s*[:.]?\s*([A-Z][A-Z ]{1,30})/]);
  const visaType = after(u, [/VISA\s*TYPE\s*[:.]?\s*([A-Z0-9/ -]{1,20})/, /TYPE\s*[:.]?\s*([A-Z]\d?)\b/]);
  const entries = after(u, [/(?:NUMBER\s*OF\s*)?ENTRIES\s*[:.]?\s*(SINGLE|DOUBLE|MULTIPLE|\d+)/]);
  const issue = normDate(after(u, [/(?:DATE\s*OF\s*ISSUE|ISSUED)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  const expiry = normDate(after(u, [/(?:DATE\s*OF\s*EXPIR|VALID\s*UNTIL|EXPIRY)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  const passportNo = after(u, [/PASSPORT\s*(?:NO|NUMBER)\s*[:.]?\s*([A-Z0-9]{6,12})/]);
  return pack([
    field("visaNumber", "Visa Number", visaNo, visaNo ? 90 : 0),
    field("country", "Country", country, country ? 85 : 0),
    field("visaType", "Visa Type", visaType, visaType ? 85 : 0),
    field("entries", "Entries", entries, entries ? 88 : 0),
    field("dateOfIssue", "Issue Date", issue, issue ? 85 : 0),
    field("dateOfExpiry", "Expiry Date", expiry, expiry ? 88 : 0),
    field("passportNo", "Passport Number", passportNo, passportNo ? 90 : 0),
    field("docType", "Document Type", "visa", 95),
  ]);
}

export function extractAirTicket(raw: string) {
  const u = raw.toUpperCase();
  const passenger = after(raw, [/(?:PASSENGER|NAME\s*OF\s*PASSENGER|PAX)\s*[:.]?\s*([A-Za-z /]{3,60})/i]);
  const ticketNo = after(u, [/TICKET\s*(?:NO|NUMBER)\s*[:.]?\s*(\d{10,14})/, /\b(\d{3}[- ]?\d{10})\b/]);
  const pnr = after(u, [/\bPNR\s*[:.]?\s*([A-Z0-9]{5,8})\b/, /BOOKING\s*REF(?:ERENCE)?\s*[:.]?\s*([A-Z0-9]{5,8})/]);
  const flight = after(u, [/FLIGHT\s*(?:NO|NUMBER)?\s*[:.]?\s*([A-Z]{2}\s?\d{1,4})/]);
  const depart = normDate(after(u, [/(?:DEPARTURE|DEPART|DEP)\s*(?:DATE)?\s*[:.]?\s*([0-9A-Z/\-. ]{6,24})/]));
  const arrive = normDate(after(u, [/(?:ARRIVAL|ARRIVE|ARR)\s*(?:DATE)?\s*[:.]?\s*([0-9A-Z/\-. ]{6,24})/]));
  return pack([
    field("passengerName", "Passenger Name", passenger?.toUpperCase() || null, passenger ? 88 : 0),
    field("ticketNumber", "Ticket Number", ticketNo, ticketNo ? 90 : 0),
    field("pnr", "PNR", pnr, pnr ? 92 : 0),
    field("flightNumber", "Flight Number", flight, flight ? 90 : 0),
    field("departureDate", "Departure Date", depart, depart ? 80 : 0),
    field("arrivalDate", "Arrival Date", arrive, arrive ? 80 : 0),
    field("docType", "Document Type", "air_ticket", 95),
  ]);
}

export function extractDrivingLicense(raw: string) {
  const u = raw.toUpperCase();
  const licenseNo = after(u, [/LICEN[CS]E\s*(?:NO|NUMBER)\s*[:.]?\s*([A-Z0-9\-/]{5,20})/, /DL\s*NO\s*[:.]?\s*([A-Z0-9\-/]{5,20})/]);
  const name = after(raw, [/(?:NAME|HOLDER)\s*[:.]?\s*([A-Za-z .]{3,60})/i]);
  const dob = normDate(after(u, [/(?:DATE\s*OF\s*BIRTH|DOB)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  const expiry = normDate(after(u, [/(?:VALID\s*(?:TILL|UNTIL)|EXPIRY|EXPIRES)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  return pack([
    field("licenseNumber", "License Number", licenseNo, licenseNo ? 90 : 0),
    field("fullName", "Name", name?.toUpperCase() || null, name ? 85 : 0),
    field("dateOfBirth", "DOB", dob, dob ? 85 : 0),
    field("dateOfExpiry", "Expiry", expiry, expiry ? 88 : 0),
    field("docType", "Document Type", "driving_license", 95),
  ]);
}

export function extractBirthCertificate(raw: string) {
  const u = raw.toUpperCase();
  const reg = after(u, [/REGISTRATION\s*(?:NO|NUMBER)\s*[:.]?\s*([A-Z0-9\-/]{5,30})/, /CERTIFICATE\s*NO\s*[:.]?\s*([A-Z0-9\-/]{5,30})/]);
  const name = after(raw, [/(?:NAME\s*OF\s*(?:THE\s*)?CHILD|NAME)\s*[:.]?\s*([A-Za-z .]{3,60})/i]);
  const dob = normDate(after(u, [/(?:DATE\s*OF\s*BIRTH|DOB)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  const father = after(raw, [/(?:FATHER|FATHER'?S\s*NAME)\s*[:.]?\s*([^\n]{2,60})/i]);
  const mother = after(raw, [/(?:MOTHER|MOTHER'?S\s*NAME)\s*[:.]?\s*([^\n]{2,60})/i]);
  return pack([
    field("registrationNumber", "Registration Number", reg, reg ? 88 : 0),
    field("fullName", "Name", name?.toUpperCase() || null, name ? 85 : 0),
    field("dateOfBirth", "DOB", dob, dob ? 88 : 0),
    field("fatherName", "Father", father, father ? 80 : 0),
    field("motherName", "Mother", mother, mother ? 80 : 0),
    field("docType", "Document Type", "birth_certificate", 95),
  ]);
}

export function extractTradeLicense(raw: string) {
  const u = raw.toUpperCase();
  const licenseNo = after(u, [/LICEN[CS]E\s*(?:NO|NUMBER)\s*[:.]?\s*([A-Z0-9\-/]{4,30})/, /TRADE\s*NO\s*[:.]?\s*([A-Z0-9\-/]{4,30})/]);
  const company = after(raw, [/(?:COMPANY|BUSINESS|FIRM)\s*NAME\s*[:.]?\s*([^\n]{3,80})/i, /NAME\s*OF\s*(?:THE\s*)?ESTABLISHMENT\s*[:.]?\s*([^\n]{3,80})/i]);
  const issue = normDate(after(u, [/(?:DATE\s*OF\s*ISSUE|ISSUED)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  const expiry = normDate(after(u, [/(?:VALID\s*(?:TILL|UNTIL)|EXPIRY)\s*[:.]?\s*([0-9/\-. ]{6,20})/]));
  return pack([
    field("licenseNumber", "License Number", licenseNo, licenseNo ? 90 : 0),
    field("companyName", "Company Name", company, company ? 85 : 0),
    field("dateOfIssue", "Issue Date", issue, issue ? 80 : 0),
    field("dateOfExpiry", "Expiry", expiry, expiry ? 80 : 0),
    field("docType", "Document Type", "trade_license", 95),
  ]);
}

export function extractBankStatement(raw: string) {
  return pack([
    field("docType", "Document Type", "bank_statement", 90),
    field("classification", "Classification", "bank_statement", 90),
    field("note", "Note", "Classification only — no field extraction for bank statements.", 100),
  ]);
}
