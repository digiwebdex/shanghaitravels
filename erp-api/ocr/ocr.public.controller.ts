import {
  Controller, Post, UploadedFile, UseInterceptors, Body, Req, BadRequestException, HttpException, HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Public } from "../rbac";
import { OcrService } from "./ocr.service";
import { clientIp } from "../util/client-ip";

interface UploadedImage { buffer: Buffer; mimetype: string; originalname: string; size: number }
const DOC_TYPES = new Set([
  "passport", "national_id", "visa", "air_ticket", "driving_license",
  "birth_certificate", "trade_license", "bank_statement", "other", "auto",
]);

/**
 * Public/customer OCR: applicant uploads their own document to prefill forms.
 * Rate-limited; never returns raw text to anonymous callers via includeRaw=false.
 */
@Controller("public/ocr")
export class OcrPublicController {
  constructor(private ocr: OcrService) {}

  private hits = new Map<string, { n: number; ts: number }>();
  private rateLimit(ip: string) {
    const now = Date.now(), rec = this.hits.get(ip) || { n: 0, ts: now };
    if (now - rec.ts > 10 * 60 * 1000) { rec.n = 0; rec.ts = now; }
    rec.n++; this.hits.set(ip, rec);
    if (rec.n > 5) throw new HttpException("Too many requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS);
  }

  @Public() @Post("scan")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  async scan(@UploadedFile() file: UploadedImage, @Body() body: any, @Req() req: any) {
    this.rateLimit(clientIp(req));
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    const docType = DOC_TYPES.has(body?.docType) ? body.docType : "auto";
    return this.ocr.scan({
      buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname, size: file.size,
      docType, source: "public", requestedBy: "public", branchId: null,
    }, false);
  }
}
