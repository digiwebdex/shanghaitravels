import { Injectable, Logger } from "@nestjs/common";
import { readFileSync } from "fs";

export interface OcrFields {
  docType?: string | null;
  surname?: string | null;
  givenNames?: string | null;
  fullName?: string | null;
  passportNo?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  sex?: string | null;
  dateOfExpiry?: string | null;
  dateOfIssue?: string | null;
  issuingCountry?: string | null;
  passportType?: string | null;
  gender?: string | null;
  mrzLine1?: string | null;
  mrzLine2?: string | null;
  /** Per-field confidence / mismatch rows (additive). */
  fieldResults?: unknown;
  validation?: unknown;
  mrzParsed?: unknown;
  viz?: unknown;
  preprocess?: unknown;
  report?: unknown;
  mismatches?: unknown;
}

export interface OcrExtract {
  provider: string;
  rawText: string;
  fields: OcrFields;
  confidence: number | null;
}

export abstract class OcrProvider {
  abstract readonly name: string;
  abstract enabled(): boolean;
  abstract extract(image: Buffer, mimeType: string, docType: string): Promise<OcrExtract>;
}

const PROMPT = `You are a passport / identity-document data extractor for a travel agency.
Read the attached document image and return ONLY a JSON object with these keys:
docType (one of: passport, national_id, visa, air_ticket, other),
surname, givenNames, fullName, passportNo, nationality (ISO 3166 alpha-3 if shown),
dateOfBirth (YYYY-MM-DD), sex (M, F or X), dateOfExpiry (YYYY-MM-DD),
issuingCountry, mrzLine1, mrzLine2, confidence (0..1).
Rules: transcribe EXACTLY what is printed. Use null for any field that is not clearly
legible. NEVER guess or invent a value. If it is not a document, set docType "other"
and all other fields null.`;

/** Google Gemini (generateContent) provider. Reads the key from GEMINI_KEY_FILE
 *  (default /etc/st-erp/secrets/gemini.key) or GEMINI_API_KEY. Model via GEMINI_MODEL. */
@Injectable()
export class GeminiOcrProvider extends OcrProvider {
  readonly name = "gemini";
  private readonly log = new Logger("GeminiOcr");
  private cachedKey: string | null | undefined;

  private key(): string | null {
    if (this.cachedKey !== undefined) return this.cachedKey;
    let k: string | null = process.env.GEMINI_API_KEY?.trim() || null;
    if (!k) {
      const f = process.env.GEMINI_KEY_FILE || "/etc/st-erp/secrets/gemini.key";
      try { k = readFileSync(f, "utf8").trim() || null; } catch { k = null; }
    }
    this.cachedKey = k;
    return k;
  }

  enabled(): boolean { return !!this.key(); }

  async extract(image: Buffer, mimeType: string, _docType: string): Promise<OcrExtract> {
    const key = this.key();
    if (!key) throw new Error("Gemini key not configured");
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const body = {
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image.toString("base64") } }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": key },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(t); }

    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 300);
      this.log.error(`Gemini ${res.status}: ${snippet}`);
      throw new Error(`Gemini API ${res.status}`);
    }
    const data: any = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
    let fields: OcrFields = {};
    try { fields = JSON.parse(text); } catch { /* leave empty; rawText retained */ }
    const confidence = typeof (fields as any).confidence === "number" ? (fields as any).confidence : null;
    delete (fields as any).confidence;
    return { provider: this.name, rawText: text, fields, confidence };
  }
}
