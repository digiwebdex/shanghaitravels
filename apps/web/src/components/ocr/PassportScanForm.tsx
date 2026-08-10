/**
 * Passport "Document Scanner" — owner-approved reference format.
 *
 * Layout (mirrors the approved screenshot exactly):
 *   left  — dashed image preview with a remove (✕) control
 *   right — "EXTRACTED DATA" heading, red provider-error banner when OCR
 *           fails, then the field grid:
 *             Title | Given/First Name
 *             Surname/Last Name | Country
 *             Country Code | Passport No. | Birth Date
 *             Birth Place | Gender
 *             Nationality | Phone
 *             Issuance Date | Expiry Date
 *           and a full-width green CONFIRM button.
 *
 * CRITICAL behaviour from the reference: when the provider errors (e.g.
 * "Google Vision API error") the form STAYS fully editable with sensible BD
 * defaults, so staff can finish by manual entry — a failed scan never blocks
 * the journey.
 *
 * This is presentation only. It reuses the EXISTING engine end to end:
 * ocrApi.scan → ocrApi.checkDuplicate → ocrApi.apply (scan present) or
 * passportsApi.create (manual entry). No second OCR engine, no new endpoint.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, UploadCloud, X } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { ocrApi, passportsApi } from "@/lib/services";
import { ApiError, validateUploadFile } from "@/lib/api";
import { fieldsToFormMap, type OcrScanResult } from "@/lib/documentIntelligence";

export type PassportScanFields = {
  title: string;
  givenNames: string;
  surname: string;
  country: string;
  countryCode: string;
  passportNo: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  nationality: string;
  phone: string;
  dateOfIssue: string;
  dateOfExpiry: string;
};

/** Reference defaults — shown even when OCR fails, exactly like the approved design. */
const DEFAULTS: PassportScanFields = {
  title: "MR",
  givenNames: "",
  surname: "",
  country: "Bangladesh",
  countryCode: "BGD",
  passportNo: "",
  dateOfBirth: "",
  placeOfBirth: "",
  gender: "Male",
  nationality: "Bangladeshi",
  phone: "",
  dateOfIssue: "",
  dateOfExpiry: "",
};

/** Minimal demonym mapping for the codes the MRZ actually yields here. */
const NATIONALITY_BY_CODE: Record<string, string> = {
  BGD: "Bangladeshi", IND: "Indian", PAK: "Pakistani", NPL: "Nepali", LKA: "Sri Lankan",
  SAU: "Saudi Arabian", ARE: "Emirati", MYS: "Malaysian", CHN: "Chinese", USA: "American", GBR: "British",
};

function mapScanToFields(scan: OcrScanResult): Partial<PassportScanFields> {
  const m = fieldsToFormMap(scan);
  const out: Partial<PassportScanFields> = {};
  if (m.givenNames) out.givenNames = m.givenNames;
  if (m.surname) out.surname = m.surname;
  if (!m.givenNames && !m.surname && m.fullName) {
    const parts = m.fullName.trim().split(/\s+/);
    out.surname = parts.length > 1 ? (parts.pop() as string) : "";
    out.givenNames = parts.join(" ");
  }
  if (m.passportNo) out.passportNo = m.passportNo;
  if (m.issuingCountry) out.country = m.issuingCountry;
  // The 3-letter code lives in MRZ line 1 (positions 3–5); merge.ts converts the
  // display name, so recover the raw code from the line itself.
  if (m.mrzLine1 && m.mrzLine1.length >= 5) {
    const code = m.mrzLine1.slice(2, 5).replace(/</g, "");
    if (code) out.countryCode = code;
  }
  if (m.dateOfBirth) out.dateOfBirth = m.dateOfBirth;
  if (m.placeOfBirth) out.placeOfBirth = m.placeOfBirth;
  if (m.gender) {
    const g = m.gender.toUpperCase();
    out.gender = g === "M" || g === "MALE" ? "Male" : g === "F" || g === "FEMALE" ? "Female" : "Other";
    out.title = out.gender === "Female" ? "MRS" : "MR";
  }
  if (m.nationality) {
    const n = m.nationality.toUpperCase();
    out.nationality = NATIONALITY_BY_CODE[n] || m.nationality;
  }
  if (m.dateOfIssue) out.dateOfIssue = m.dateOfIssue;
  if (m.dateOfExpiry) out.dateOfExpiry = m.dateOfExpiry;
  return out;
}

const fieldCls =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-[13px] text-[var(--foreground)] outline-none transition-colors focus:border-emerald-500/70 disabled:bg-[var(--muted)]/40";
const lblCls = "mb-1 block text-[12px] font-medium text-[var(--muted-foreground)]";

export function PassportScanForm({
  customerId,
  initialPhone,
  onConfirm,
  confirmLabel = "CONFIRM",
}: {
  /** When set, CONFIRM also saves the passport onto this customer. */
  customerId?: string;
  initialPhone?: string;
  /** Receives the verified fields after any save succeeds. */
  onConfirm: (fields: PassportScanFields, meta: { scanId: string | null; passportSaved: boolean }) => void;
  confirmLabel?: string;
}) {
  const { can } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState("");
  const [dupWarning, setDupWarning] = useState("");
  const [saveError, setSaveError] = useState("");
  const [f, setF] = useState<PassportScanFields>({ ...DEFAULTS, phone: initialPhone || "" });

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const set = (k: keyof PassportScanFields) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function choose(nextFile: File) {
    setScanError(""); setDupWarning(""); setSaveError("");
    const bad = validateUploadFile(nextFile);
    if (bad) { setScanError(bad); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(nextFile));
    setScanId(null);
    if (!can("ocr:use")) { setScanError("You do not have OCR permission (ocr:use) — enter the details manually."); return; }
    setScanning(true);
    try {
      const scan = (await ocrApi.scan(nextFile, { docType: "passport", customerId })) as OcrScanResult;
      setScanId(scan.id || null);
      const mapped = mapScanToFields(scan);
      setF((s) => ({ ...s, ...mapped }));
      if (mapped.passportNo) {
        const dup = await ocrApi.checkDuplicate({ passportNo: mapped.passportNo, customerId }).catch(() => null);
        if (dup?.duplicate) {
          setDupWarning(
            `This passport already exists on ${dup.hits.map((h) => h.customerName || h.customerCode).filter(Boolean).join(", ")}.`,
          );
        }
      }
    } catch (e) {
      // The approved reference behaviour: show the provider error, keep the
      // form editable so the operator can finish manually.
      setScanError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "OCR failed");
    } finally {
      setScanning(false);
    }
  }

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setScanId(null);
    setScanError(""); setDupWarning("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSavePassport = !!customerId && can("ocr:apply");

  const confirmDisabled = useMemo(() => {
    if (saving || scanning) return true;
    if (customerId && dupWarning) return true; // duplicate protection stays active
    return false;
  }, [saving, scanning, customerId, dupWarning]);

  async function confirm() {
    setSaveError("");
    const passportNo = f.passportNo.trim();
    // Re-check duplicates when the number was typed/edited by hand.
    if (customerId && passportNo && can("ocr:use")) {
      const dup = await ocrApi.checkDuplicate({ passportNo, customerId }).catch(() => null);
      if (dup?.duplicate) {
        setDupWarning(
          `This passport already exists on ${dup.hits.map((h) => h.customerName || h.customerCode).filter(Boolean).join(", ")}.`,
        );
        return;
      }
    }
    setSaving(true);
    let passportSaved = false;
    try {
      if (canSavePassport && passportNo) {
        const saveFields = {
          passportNo,
          issuingCountry: f.countryCode.trim() || f.country.trim() || undefined,
          dateOfIssue: f.dateOfIssue || undefined,
          dateOfExpiry: f.dateOfExpiry || undefined,
        };
        // Always the proven persistence path. (POST /ocr/:id/apply looks up an
        // OcrScan row, but /ocr/scan never persists one — no ocrScan.create
        // exists anywhere in the backend — so apply() can only 404. Every
        // mature panel saves through POST /passports; this form does too.)
        await passportsApi.create({ customerId: customerId as string, isPrimary: true, ...saveFields });
        passportSaved = true;
      }
      onConfirm({ ...f, passportNo }, { scanId, passportSaved });
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ───────── left · image ───────── */}
      <div className="rounded-2xl border-2 border-dashed border-emerald-400/50 p-3">
        {preview ? (
          <div className="relative">
            <button
              type="button"
              onClick={clearImage}
              aria-label="Remove image"
              className="absolute -right-1 -top-1 z-10 rounded-full border border-[var(--border)] bg-white p-1 text-[var(--muted-foreground)] shadow hover:text-red-500"
            >
              <X size={14} />
            </button>
            <img src={preview} alt="Passport preview" className="max-h-[520px] w-full rounded-lg object-contain" />
            {scanning && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-[var(--muted-foreground)]">
                <Loader2 size={13} className="animate-spin" /> Reading the document…
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[320px] w-full flex-col items-center justify-center gap-2 rounded-lg text-[var(--muted-foreground)] transition-colors hover:text-emerald-600"
          >
            <UploadCloud size={34} />
            <span className="text-[13px] font-semibold">Upload passport image</span>
            <span className="text-[11px]">JPG, PNG or PDF · the photo page with both MRZ lines visible</span>
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          aria-label="Passport image file"
          onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])}
        />
      </div>

      {/* ───────── right · extracted data ───────── */}
      <div>
        <h3 className="mb-3 text-[15px] font-bold tracking-wide text-[var(--foreground)]">EXTRACTED DATA</h3>

        {scanError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <p className="text-[12.5px] font-medium text-red-600">{scanError}</p>
          </div>
        )}
        {dupWarning && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
            <p className="text-[12.5px] font-medium text-amber-700">{dupWarning}</p>
          </div>
        )}

        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-title">Title</label>
            <select id="ps-title" className={fieldCls} value={f.title} onChange={(e) => set("title")(e.target.value)}>
              {["MR", "MRS", "MS", "MSTR", "MISS"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-given">Given/First Name</label>
            <input id="ps-given" className={fieldCls} value={f.givenNames} onChange={(e) => set("givenNames")(e.target.value)} />
          </div>

          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-surname">Surname/Last Name</label>
            <input id="ps-surname" className={fieldCls} value={f.surname} onChange={(e) => set("surname")(e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-country">Country</label>
            <input id="ps-country" className={fieldCls} value={f.country} onChange={(e) => set("country")(e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className={lblCls} htmlFor="ps-ccode">Country Code</label>
            <input id="ps-ccode" className={fieldCls} value={f.countryCode} onChange={(e) => set("countryCode")(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className={lblCls} htmlFor="ps-passport">Passport No.</label>
            <input id="ps-passport" className={fieldCls} value={f.passportNo} onChange={(e) => { set("passportNo")(e.target.value); setDupWarning(""); }} />
          </div>
          <div className="col-span-2">
            <label className={lblCls} htmlFor="ps-dob">Birth Date</label>
            <input id="ps-dob" type="date" className={fieldCls} value={f.dateOfBirth} onChange={(e) => set("dateOfBirth")(e.target.value)} />
          </div>

          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-bplace">Birth Place</label>
            <input id="ps-bplace" className={fieldCls} value={f.placeOfBirth} onChange={(e) => set("placeOfBirth")(e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-gender">Gender</label>
            <select id="ps-gender" className={fieldCls} value={f.gender} onChange={(e) => set("gender")(e.target.value)}>
              {["Male", "Female", "Other"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-nat">Nationality</label>
            <input id="ps-nat" className={fieldCls} value={f.nationality} onChange={(e) => set("nationality")(e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-phone">Phone</label>
            <input id="ps-phone" className={fieldCls} placeholder="01XXXXXXXXX" value={f.phone} onChange={(e) => set("phone")(e.target.value)} />
          </div>

          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-issue">Issuance Date</label>
            <input id="ps-issue" type="date" className={fieldCls} value={f.dateOfIssue} onChange={(e) => set("dateOfIssue")(e.target.value)} />
          </div>
          <div className="col-span-3">
            <label className={lblCls} htmlFor="ps-expiry">Expiry Date</label>
            <input id="ps-expiry" type="date" className={fieldCls} value={f.dateOfExpiry} onChange={(e) => set("dateOfExpiry")(e.target.value)} />
          </div>
        </div>

        {saveError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2.5">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <p className="text-[12.5px] font-medium text-red-600">{saveError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={confirmDisabled}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-[13.5px] font-bold tracking-wide text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {confirmLabel}
        </button>
        {customerId && !can("ocr:apply") && (
          <p className="mt-1.5 text-center text-[10.5px] text-[var(--muted-foreground)]">
            Saving the passport needs <code>ocr:apply</code> — CONFIRM will only copy the fields.
          </p>
        )}
      </div>
    </div>
  );
}
