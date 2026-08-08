import {
  Body, Controller, Get, Post, Param, Query, Res, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Public } from "../rbac";
import { AgentJwtGuard, CurrentAgent, AgentCtx } from "./agent-jwt.guard";
import { AgentAuthService } from "./agent-auth.service";
import { AgentPortalService } from "./agent-portal.service";
import { OcrService } from "../ocr/ocr.service";
import { PackagesService } from "../packages/packages.service";

interface UploadedFileShape { buffer: Buffer; mimetype: string; originalname: string; size: number }

@Public()
@UseGuards(AgentJwtGuard)
@Controller("portal/agent")
export class AgentPortalController {
  constructor(
    private auth: AgentAuthService,
    private portal: AgentPortalService,
    private ocr: OcrService,
    private packagesSvc: PackagesService,
  ) {}

  @Get("me")
  me(@CurrentAgent() a: AgentCtx) {
    return this.portal.me(a.agentId, a.agentUserId);
  }

  @Post("change-password")
  async changePassword(@CurrentAgent() a: AgentCtx, @Body() b: { currentPassword: string; newPassword: string }) {
    await this.auth.changePassword(a.agentUserId, b?.currentPassword, b?.newPassword);
    return { ok: true };
  }

  @Get("dashboard")
  dashboard(@CurrentAgent() a: AgentCtx) {
    return this.portal.dashboard(a.agentId);
  }

  @Get("cases")
  cases(
    @CurrentAgent() a: AgentCtx,
    @Query("status") status?: string,
    @Query("serviceType") serviceType?: string,
    @Query("take") take?: string,
  ) {
    return this.portal.cases(a.agentId, { status, serviceType, take: take ? +take : undefined });
  }

  @Get("cases/:id")
  caseGet(@CurrentAgent() a: AgentCtx, @Param("id") id: string) {
    return this.portal.caseGet(a.agentId, id);
  }

  @Post("cases")
  createCase(@CurrentAgent() a: AgentCtx, @Body() dto: any) {
    return this.portal.createCase(a.agentId, dto);
  }

  @Get("customers")
  customers(@CurrentAgent() a: AgentCtx) {
    return this.portal.listCustomers(a.agentId);
  }

  @Get("customers/:id")
  customerGet(@CurrentAgent() a: AgentCtx, @Param("id") id: string) {
    return this.portal.getCustomer(a.agentId, id);
  }

  @Post("customers")
  customerCreate(@CurrentAgent() a: AgentCtx, @Body() dto: any) {
    return this.portal.createCustomer(a.agentId, dto);
  }

  @Post("customers/:id/passports")
  passportUpsert(@CurrentAgent() a: AgentCtx, @Param("id") id: string, @Body() dto: any) {
    return this.portal.upsertPassport(a.agentId, id, dto);
  }

  @Post("customers/:id/travellers")
  travellerAdd(@CurrentAgent() a: AgentCtx, @Param("id") id: string, @Body() dto: any) {
    return this.portal.addTraveller(a.agentId, id, dto);
  }

  @Get("commissions")
  commissions(@CurrentAgent() a: AgentCtx) {
    return this.portal.commissions(a.agentId);
  }

  @Get("wallet")
  wallet(@CurrentAgent() a: AgentCtx) {
    return this.portal.wallet(a.agentId);
  }

  @Get("finance")
  finance(@CurrentAgent() a: AgentCtx) {
    return this.portal.finance(a.agentId);
  }

  @Get("documents")
  documents(@CurrentAgent() a: AgentCtx) {
    return this.portal.listDocuments(a.agentId);
  }

  @Get("documents/:id/versions")
  documentVersions(@CurrentAgent() a: AgentCtx, @Param("id") id: string) {
    return this.portal.documentVersions(a.agentId, id);
  }

  @Get("documents/:id/download")
  async documentDownload(@CurrentAgent() a: AgentCtx, @Param("id") id: string, @Res() res: Response) {
    const { buf, fileName, mimeType } = await this.portal.downloadDocument(a.agentId, id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
    res.send(buf);
  }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 15 * 1024 * 1024 } }))
  documentUpload(
    @CurrentAgent() a: AgentCtx,
    @UploadedFile() file: UploadedFileShape,
    @Body() body: any,
  ) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    return this.portal.uploadDocument(a.agentId, file, body);
  }

  @Get("communications")
  communications(@CurrentAgent() a: AgentCtx) {
    return this.portal.communications(a.agentId);
  }

  @Post("support")
  support(@CurrentAgent() a: AgentCtx, @Body() dto: any) {
    return this.portal.createSupport(a.agentId, dto);
  }

  @Get("reports")
  reports(@CurrentAgent() a: AgentCtx) {
    return this.portal.reports(a.agentId);
  }

  @Post("ocr/scan")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }))
  ocrScan(@CurrentAgent() a: AgentCtx, @UploadedFile() file: UploadedFileShape, @Body() body: any) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    const allowed = new Set([
      "passport", "national_id", "visa", "air_ticket", "driving_license",
      "birth_certificate", "trade_license", "bank_statement", "other", "auto",
    ]);
    const docType = allowed.has(body?.docType) ? body.docType : "auto";
    return this.ocr.scan(
      {
        buffer: file.buffer,
        mimeType: file.mimetype,
        originalName: file.originalname,
        size: file.size,
        docType,
        source: "agent",
        requestedBy: `agent:${a.agentId}`,
        branchId: a.branchId || null,
      },
      false,
    );
  }

  @Get("packages")
  packages(@Query("limit") limit?: string) {
    return this.packagesSvc.agentListPublished(limit ? +limit : 100);
  }

  @Post("packages/:id/book")
  packageBook(@CurrentAgent() a: AgentCtx, @Param("id") id: string, @Body() dto: any) {
    return this.packagesSvc.agentBook(a.agentId, id, dto);
  }
}
