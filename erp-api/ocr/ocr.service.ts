import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma.service";
import { StorageService } from "../storage/storage";
import { OcrProvider } from "./gemini.provider";
import { parseMrz } from "./mrz";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]);
const MAX_BYTES = 20 * 1024 * 1024;

export interface ScanInput {
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
  size: number;
  docType: string;
  source: string;
  requestedBy: string;
  branchId?: string | null;
  applicationId?: string | null;
  customerId?: string | null;
}

type JournalEntry = {
  id: string;
  status: string;
  docType: string;
  source: string;
  provider?: string;
  customerId?: string | null;
  applicationId?: string | null;
  confidence?: number | null;
  averageConfidence?: number;
  processingMs?: number;
  failed?: boolean;
  error?: string | null;
  passportNo?: string | null;
  nidNumber?: string | null;
  visaNumber?: string | null;
  createdAt: string;
};

@Injectable()
export class OcrService {
  /** In-memory Document Intelligence journal (no PII images; no schema change). */
  private journal: JournalEntry[] = [];
  private readonly journalMax = 300;

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private provider: OcrProvider,
  ) {}

  private assertApproved() {
    if (process.env.OCR_APPROVED !== "true")
      throw new ServiceUnavailableException("OCR is disabled pending data-privacy approval (OCR_APPROVED not set).");
  }

  private pushJournal(e: JournalEntry) {
    this.journal.unshift(e);
    if (this.journal.length > this.journalMax) this.journal.length = this.journalMax;
  }

  async scan(p: ScanInput, _includeRaw: boolean) {
    this.assertApproved();
    if (!ALLOWED.has(p.mimeType)) throw new BadRequestException("Unsupported file type (jpeg/png/webp/heic/pdf)");
    if (!p.buffer?.length) throw new BadRequestException("Empty file");
    if (p.size > MAX_BYTES) throw new BadRequestException("File too large (max 20MB)");
    if (!this.provider.enabled()) throw new ServiceUnavailableException("OCR provider is not configured.");

    const id = randomUUID();
    const t0 = Date.now();
    try {
      const ex = await this.provider.extract(p.buffer, p.mimeType, p.docType);
      const mrz = parseMrz([ex.fields.mrzLine1, ex.fields.mrzLine2].filter(Boolean).join("\n") || ex.rawText);
      const fields = {
        ...ex.fields,
        validation: (ex.fields as any).validation ?? (mrz.ok ? mrz.checks : undefined),
        mrzParsed: (ex.fields as any).mrzParsed ?? (mrz.ok || mrz.checkScore > 0 ? mrz : undefined),
      };
      const report = {
        ...((ex.fields as any).report || {}),
        processingMs: (ex.fields as any)?.report?.processingMs ?? Date.now() - t0,
      };
      const resolvedType = (fields as any).docType || p.docType;
      const result = {
        id,
        status: "completed" as const,
        source: p.source,
        docType: resolvedType,
        provider: ex.provider,
        applicationId: p.applicationId ?? null,
        customerId: p.customerId ?? null,
        fields: { ...fields, report },
        confidence: ex.confidence,
        error: null,
        reviewedBy: null,
        appliedAt: null,
        createdAt: new Date(),
        report,
      };
      this.pushJournal({
        id,
        status: "completed",
        docType: String(resolvedType),
        source: p.source,
        provider: ex.provider,
        customerId: p.customerId,
        applicationId: p.applicationId,
        confidence: ex.confidence,
        averageConfidence: report.averageConfidence,
        processingMs: report.processingMs,
        passportNo: (fields as any).passportNo || null,
        nidNumber: (fields as any).nidNumber || null,
        visaNumber: (fields as any).visaNumber || null,
        createdAt: new Date().toISOString(),
      });
      return result;
    } catch (e: any) {
      this.pushJournal({
        id,
        status: "failed",
        docType: p.docType,
        source: p.source,
        failed: true,
        error: String(e?.message || e).slice(0, 200),
        createdAt: new Date().toISOString(),
        processingMs: Date.now() - t0,
      });
      throw new ServiceUnavailableException(
        `Could not read the document (OCR error): ${String(e?.message || e).slice(0, 160)}`,
      );
    }
  }

  /** Document Intelligence dashboard aggregates from in-memory journal. */
  stats() {
    const today = new Date().toISOString().slice(0, 10);
    const todays = this.journal.filter((j) => j.createdAt.startsWith(today));
    const byType: Record<string, number> = {};
    let confSum = 0;
    let confN = 0;
    let timeSum = 0;
    let timeN = 0;
    let failures = 0;
    for (const j of todays) {
      byType[j.docType] = (byType[j.docType] || 0) + 1;
      if (j.status === "failed") failures++;
      if (j.averageConfidence != null) {
        confSum += j.averageConfidence;
        confN++;
      }
      if (j.processingMs != null) {
        timeSum += j.processingMs;
        timeN++;
      }
    }
    return {
      scannedToday: todays.length,
      byType,
      failures,
      averageConfidence: confN ? Math.round((confSum / confN) * 10) / 10 : null,
      averageProcessingMs: timeN ? Math.round(timeSum / timeN) : null,
      journalSize: this.journal.length,
    };
  }

  recent(take = 50) {
    return this.journal.slice(0, Math.min(200, Math.max(1, take)));
  }

  failed(take = 50) {
    return this.journal.filter((j) => j.status === "failed").slice(0, Math.min(100, take));
  }

  /**
   * Duplicate detection against Passport + Customer records (no schema change).
   */
  async checkDuplicate(body: {
    passportNo?: string;
    nidNumber?: string;
    visaNumber?: string;
    customerId?: string;
  }) {
    const hits: { type: string; customerId: string; customerCode?: string; customerName?: string; detail?: string }[] = [];
    const passportNo = body.passportNo?.trim();
    if (passportNo) {
      const rows = await this.prisma.passport.findMany({
        where: { passportNo: { equals: passportNo, mode: "insensitive" } },
        take: 10,
        include: { customer: { select: { id: true, code: true, fullName: true, deletedAt: true } } },
      });
      for (const r of rows) {
        if (r.customer?.deletedAt) continue;
        if (body.customerId && r.customerId === body.customerId) continue;
        hits.push({
          type: "passport",
          customerId: r.customerId,
          customerCode: r.customer?.code,
          customerName: r.customer?.fullName,
          detail: r.passportNo,
        });
      }
    }
    // NID / visa: search customer notes/tags is not available without schema —
    // fall back to journal matches for same process lifetime.
    const nid = body.nidNumber?.trim();
    if (nid) {
      for (const j of this.journal) {
        if (j.nidNumber && j.nidNumber === nid && j.customerId && j.customerId !== body.customerId) {
          hits.push({ type: "national_id", customerId: j.customerId, detail: nid });
        }
      }
    }
    const visa = body.visaNumber?.trim();
    if (visa) {
      for (const j of this.journal) {
        if (j.visaNumber && j.visaNumber === visa && j.customerId && j.customerId !== body.customerId) {
          hits.push({ type: "visa", customerId: j.customerId, detail: visa });
        }
      }
    }
    return { duplicate: hits.length > 0, hits };
  }

  async process(scanId: string, includeRaw = false) {
    this.assertApproved();
    const scan = await this.prisma.ocrScan.findFirst({ where: { id: scanId, deletedAt: null } });
    if (!scan) throw new NotFoundException("Scan not found");
    if (!this.provider.enabled()) throw new BadRequestException("No OCR provider configured");
    await this.prisma.ocrScan.update({ where: { id: scanId }, data: { status: "processing" } });
    try {
      const buffer = await this.storage.get(scan.storageKey);
      const ex = await this.provider.extract(buffer, scan.mimeType || "image/jpeg", scan.docType);
      const mrz = parseMrz([ex.fields.mrzLine1, ex.fields.mrzLine2].filter(Boolean).join("\n") || ex.rawText);
      const fields = { ...ex.fields, validation: mrz.ok ? mrz.checks : undefined, mrzParsed: mrz.ok ? mrz : undefined };
      const updated = await this.prisma.ocrScan.update({
        where: { id: scanId },
        data: { status: "completed", provider: ex.provider, rawText: ex.rawText, fields: fields as any, confidence: ex.confidence },
      });
      return this.view(updated, includeRaw);
    } catch (e: any) {
      const failed = await this.prisma.ocrScan.update({
        where: { id: scanId },
        data: { status: "failed", error: String(e?.message || e).slice(0, 300) },
      });
      return this.view(failed, includeRaw);
    }
  }

  async get(id: string, opts: { includeRaw: boolean; ownerId?: string; branchId?: string | null; hq?: boolean }) {
    const where: any = { id, deletedAt: null };
    if (!opts.hq && opts.branchId) where.branchId = opts.branchId;
    const scan = await this.prisma.ocrScan.findFirst({ where });
    if (!scan) throw new NotFoundException("Scan not found");
    if (opts.ownerId && scan.requestedBy !== opts.ownerId) throw new NotFoundException("Scan not found");
    return this.view(scan, opts.includeRaw);
  }

  async list(query: { status?: string; take?: number; branchId?: string | null; hq?: boolean }) {
    const where: any = { deletedAt: null, ...(query.status ? { status: query.status as any } : {}) };
    if (!query.hq) where.branchId = query.branchId ?? "__none__";
    const scans = await this.prisma.ocrScan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(query.take || 50, 200),
    });
    return scans.map((s) => this.view(s, false));
  }

  async apply(
    id: string,
    body: { customerId?: string; fields?: Record<string, any>; isPrimary?: boolean },
    actorId: string,
    opts?: { branchId?: string | null; hq?: boolean },
  ) {
    const where: any = { id, deletedAt: null };
    if (!opts?.hq && opts?.branchId) where.branchId = opts.branchId;
    const scan = await this.prisma.ocrScan.findFirst({ where });
    if (!scan) throw new NotFoundException("Scan not found");
    const customerId = body.customerId || scan.customerId || undefined;
    const f = body.fields || {};
    let passport: any = null;

    if (scan.docType === "passport") {
      if (!customerId) throw new BadRequestException("customerId required to save a passport");
      if (!f.passportNo) throw new BadRequestException("passportNo required");
      const custWhere: any = { id: customerId, deletedAt: null };
      if (!opts?.hq) custWhere.branchId = opts?.branchId ?? "__none__";
      const customer = await this.prisma.customer.findFirst({ where: custWhere, select: { id: true } });
      if (!customer) throw new BadRequestException("customerId not in your branch");
      passport = await this.prisma.passport.create({
        data: {
          customerId: customer.id,
          passportNo: String(f.passportNo),
          issuingCountry: f.issuingCountry ? String(f.issuingCountry) : undefined,
          expiryDate: f.dateOfExpiry ? new Date(f.dateOfExpiry) : undefined,
          issueDate: f.dateOfIssue ? new Date(f.dateOfIssue) : undefined,
          documentId: scan.documentId || undefined,
          isPrimary: !!body.isPrimary,
        },
      });
    }
    await this.prisma.ocrScan.update({
      where: { id },
      data: { reviewedBy: actorId, appliedAt: new Date(), customerId: customerId ?? undefined },
    });
    return { ok: true, applied: scan.docType, passport };
  }

  async processPending(limit = 25) {
    if (!this.provider.enabled()) throw new BadRequestException("No OCR provider configured");
    const pending = await this.prisma.ocrScan.findMany({
      where: { status: "pending", deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: Math.min(limit, 100),
    });
    const results: { id: string; status: string }[] = [];
    for (const s of pending) {
      const r = await this.process(s.id, false).catch((e) => ({ id: s.id, status: "failed", error: String(e) }));
      results.push({ id: s.id, status: (r as any).status });
    }
    return { processed: results.length, results };
  }

  private view(s: any, includeRaw: boolean) {
    const base = {
      id: s.id,
      status: s.status,
      source: s.source,
      docType: s.docType,
      provider: s.provider,
      fields: s.fields ?? null,
      confidence: s.confidence ?? null,
      error: s.error ?? null,
      applicationId: s.applicationId ?? null,
      customerId: s.customerId ?? null,
      reviewedBy: s.reviewedBy ?? null,
      appliedAt: s.appliedAt ?? null,
      createdAt: s.createdAt,
    };
    return includeRaw ? { ...base, rawText: s.rawText ?? null, storageKey: s.storageKey, documentId: s.documentId } : base;
  }
}
