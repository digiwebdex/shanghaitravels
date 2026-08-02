import {
  Controller, Post, Get, Param, Body, Query, UploadedFile, UseInterceptors, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { OcrService } from "./ocr.service";

interface UploadedImage { buffer: Buffer; mimetype: string; originalname: string; size: number }

const DOC_TYPES = new Set([
  "passport",
  "national_id",
  "visa",
  "air_ticket",
  "driving_license",
  "birth_certificate",
  "trade_license",
  "bank_statement",
  "photo",
  "other",
  "auto",
]);
const canRaw = (u: AuthedUser) => u.role === "super_admin" || u.permissions.has("ocr:read-raw");

@Controller("ocr")
export class OcrController {
  constructor(private ocr: OcrService) {}

  @Post("scan") @Permissions("ocr:use")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  async scan(@UploadedFile() file: UploadedImage, @Body() body: any, @CurrentUser() u: AuthedUser) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    const docType = DOC_TYPES.has(body?.docType) ? body.docType : "auto";
    const source = u.role === "agent" ? "agent" : "staff";
    return this.ocr.scan({
      buffer: file.buffer, mimeType: file.mimetype, originalName: file.originalname, size: file.size,
      docType, source, requestedBy: u.id,
      branchId: body?.branchId || u.branchId || null,
      applicationId: body?.applicationId || null,
      customerId: body?.customerId || null,
    }, canRaw(u));
  }

  /** Additive Document Intelligence endpoints (do not alter existing scan contract). */
  @Get("intelligence/stats") @Permissions("ocr:use")
  stats() {
    return this.ocr.stats();
  }

  @Get("intelligence/recent") @Permissions("ocr:use")
  recent(@Query("take") take?: string) {
    return this.ocr.recent(take ? +take : 50);
  }

  @Get("intelligence/failed") @Permissions("ocr:use")
  failed(@Query("take") take?: string) {
    return this.ocr.failed(take ? +take : 50);
  }

  @Post("intelligence/check-duplicate") @Permissions("ocr:use")
  checkDuplicate(@Body() body: any) {
    return this.ocr.checkDuplicate({
      passportNo: body?.passportNo,
      nidNumber: body?.nidNumber,
      visaNumber: body?.visaNumber,
      customerId: body?.customerId,
    });
  }

  @Get() @Permissions("ocr:use")
  list(@CurrentUser() u: AuthedUser, @Query("status") status?: string, @Query("take") take?: string) {
    const hq = u.role === "super_admin" || u.role === "general_manager";
    return this.ocr.list({ status, take: take ? +take : undefined, branchId: u.branchId, hq });
  }

  @Get(":id") @Permissions("ocr:use")
  get(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    const hq = u.role === "super_admin" || u.role === "general_manager";
    return this.ocr.get(id, { includeRaw: canRaw(u), branchId: u.branchId, hq });
  }

  @Post(":id/apply") @Permissions("ocr:apply")
  apply(@Param("id") id: string, @Body() body: any, @CurrentUser() u: AuthedUser) {
    const hq = u.role === "super_admin" || u.role === "general_manager";
    return this.ocr.apply(
      id,
      { customerId: body?.customerId, fields: body?.fields, isPrimary: body?.isPrimary },
      u.id,
      { branchId: u.branchId, hq },
    );
  }

  @Post("process-pending") @Permissions("ocr:apply")
  processPending(@Body() body: any) {
    return this.ocr.processPending(body?.limit ? +body.limit : 25);
  }
}
