import { Injectable, Logger } from "@nestjs/common";
import { OcrProvider, OcrExtract, OcrFields } from "./gemini.provider";
import { parseMrz } from "./mrz";
import { parseViz } from "./viz";
import { mergePassportFields, MergeReport } from "./merge";
import { preprocessPassportImage, shouldRetryMrzBand, PreprocessMeta } from "./preprocess";
import { classifyDocument, DocClass } from "./classify";
import {
  extractNationalId,
  extractVisa,
  extractAirTicket,
  extractDrivingLicense,
  extractBirthCertificate,
  extractTradeLicense,
  extractBankStatement,
} from "./extractors";

type WordConf = { text: string; confidence: number };

@Injectable()
export class VisionOcrProvider extends OcrProvider {
  readonly name = "vision";
  private readonly log = new Logger("VisionOcr");

  private key(): string | null {
    return process.env.GOOGLE_VISION_API_KEY?.trim() || null;
  }
  enabled(): boolean {
    return !!this.key();
  }

  async extract(image: Buffer, mimeType: string, docTypeHint: string): Promise<OcrExtract> {
    const key = this.key();
    if (!key) throw new Error("Vision key not configured");
    if (mimeType === "application/pdf")
      throw new Error("PDF is not supported for OCR yet — upload a photo (JPG/PNG/WEBP) of the document page.");

    const t0 = Date.now();
    let preMeta: PreprocessMeta | undefined;
    let work = image;
    let workMime =
      mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/jpeg" ? mimeType : "image/jpeg";

    try {
      const pre = await preprocessPassportImage(image);
      work = pre.buffer;
      workMime = pre.mimeType;
      preMeta = pre.meta;
    } catch (e: any) {
      this.log.warn(`preprocess skipped: ${String(e?.message || e).slice(0, 120)}`);
    }

    let { rawText, words } = await this.annotate(work, workMime, key);
    const classified = classifyDocument(rawText, docTypeHint === "auto" ? undefined : docTypeHint);
    const docType: DocClass = classified.docType;

    let merged: MergeReport;
    let mrz = parseMrz(rawText);

    if (docType === "passport" || (docTypeHint === "passport" && mrz.ok)) {
      if (!mrz.ok) {
        try {
          if (await shouldRetryMrzBand(work)) {
            const band = await preprocessPassportImage(image, { mrzBandOnly: true });
            const second = await this.annotate(band.buffer, band.mimeType, key);
            const mrz2 = parseMrz(second.rawText);
            if (mrz2.ok || mrz2.checkScore > mrz.checkScore) {
              mrz = mrz2;
              rawText = `${rawText}\n${second.rawText}`;
              words = [...words, ...second.words];
              preMeta = { ...(preMeta || ({} as PreprocessMeta)), ...band.meta, mrzBandCrop: true };
            }
          }
        } catch (e: any) {
          this.log.warn(`MRZ band retry skipped: ${String(e?.message || e).slice(0, 120)}`);
        }
      }
      const viz = parseViz(rawText);
      merged = mergePassportFields(mrz, viz, words);
    } else if (docType === "national_id") {
      merged = extractNationalId(rawText);
    } else if (docType === "visa") {
      merged = extractVisa(rawText);
    } else if (docType === "air_ticket") {
      merged = extractAirTicket(rawText);
    } else if (docType === "driving_license") {
      merged = extractDrivingLicense(rawText);
    } else if (docType === "birth_certificate") {
      merged = extractBirthCertificate(rawText);
    } else if (docType === "trade_license") {
      merged = extractTradeLicense(rawText);
    } else if (docType === "bank_statement") {
      merged = extractBankStatement(rawText);
    } else {
      // Unknown — try passport MRZ then generic viz
      if (mrz.ok) {
        merged = mergePassportFields(mrz, parseViz(rawText), words);
      } else {
        const viz = parseViz(rawText);
        merged = mergePassportFields(mrz, viz, words);
        merged.fieldMap.docType = "other";
      }
    }

    merged.processingMs = Date.now() - t0;

    const fields: OcrFields = {
      docType,
      surname: merged.fieldMap.surname,
      givenNames: merged.fieldMap.givenNames,
      fullName: merged.fieldMap.fullName,
      passportNo: merged.fieldMap.passportNo,
      nationality: merged.fieldMap.nationality,
      dateOfBirth: merged.fieldMap.dateOfBirth,
      sex: merged.fieldMap.gender || merged.fieldMap.sex,
      dateOfExpiry: merged.fieldMap.dateOfExpiry,
      issuingCountry: merged.fieldMap.issuingCountry,
      mrzLine1: merged.fieldMap.mrzLine1,
      mrzLine2: merged.fieldMap.mrzLine2,
      gender: merged.fieldMap.gender,
      dateOfIssue: merged.fieldMap.dateOfIssue,
      passportType: merged.fieldMap.passportType,
      ...( {
        placeOfBirth: merged.fieldMap.placeOfBirth,
        fieldResults: merged.fields,
        mismatches: merged.mismatches,
        validation: mrz.ok ? mrz.checks : undefined,
        mrzParsed: mrz.ok || mrz.checkScore > 0 ? mrz : undefined,
        classification: classified,
        preprocess: preMeta,
        ...merged.fieldMap,
        report: {
          extractionRate: merged.extractionRate,
          averageConfidence: merged.averageConfidence,
          failedFields: merged.failedFields,
          mismatches: merged.mismatches,
          mrzValid: merged.mrzValid,
          processingMs: merged.processingMs,
          docType,
          classificationConfidence: Math.round(classified.confidence * 100),
        },
      } as any),
    };

    return {
      provider: this.name,
      rawText,
      fields,
      confidence: merged.averageConfidence / 100,
    };
  }

  private async annotate(
    image: Buffer,
    mimeType: string,
    key: string,
  ): Promise<{ rawText: string; words: WordConf[] }> {
    const host = (process.env.GOOGLE_VISION_ENDPOINT || "vision.googleapis.com").replace(/^https?:\/\//, "");
    const url = `https://${host}/v1/images:annotate?key=${encodeURIComponent(key)}`;
    const body = {
      requests: [
        {
          image: { content: image.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["en", "bn", "hi", "ar", "ms"] },
        },
      ],
    };
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 45_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) {
      const snippet = (await res.text().catch(() => "")).slice(0, 300);
      this.log.error(`Vision ${res.status}: ${snippet}`);
      throw new Error(`Vision API ${res.status}`);
    }
    const data: any = await res.json();
    const r0 = data?.responses?.[0] || {};
    if (r0.error) throw new Error(`Vision: ${r0.error.message || "annotation error"}`);
    const rawText: string = r0.fullTextAnnotation?.text || r0.textAnnotations?.[0]?.description || "";
    const words: WordConf[] = [];
    for (const page of r0.fullTextAnnotation?.pages || []) {
      for (const block of page.blocks || []) {
        for (const para of block.paragraphs || []) {
          for (const word of para.words || []) {
            const text = (word.symbols || []).map((s: any) => s.text || "").join("");
            const confidence = typeof word.confidence === "number" ? word.confidence : 0.7;
            if (text) words.push({ text, confidence });
          }
        }
      }
    }
    return { rawText, words };
  }
}
