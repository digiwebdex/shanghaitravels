import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Public } from "../rbac";
import { CorporateJwtGuard, CurrentCorporate, CorporateCtx } from "./corporate-jwt.guard";
import { CorporateAuthService } from "./corporate-auth.service";
import { CorporatePortalService } from "./corporate-portal.service";
import { PackagesService } from "../packages/packages.service";

interface UploadedFileShape {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

function ctx(c: CorporateCtx) {
  return {
    corporateClientId: c.corporateClientId,
    corporateUserId: c.corporateUserId,
    role: c.role,
    employeeId: c.employeeId,
  };
}

@Public()
@UseGuards(CorporateJwtGuard)
@Controller("portal/corporate")
export class CorporatePortalController {
  constructor(
    private auth: CorporateAuthService,
    private portal: CorporatePortalService,
    private packagesSvc: PackagesService,
  ) {}

  @Get("me")
  me(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.me(c.corporateClientId, c.corporateUserId);
  }

  @Post("change-password")
  async changePassword(
    @CurrentCorporate() c: CorporateCtx,
    @Body() b: { currentPassword: string; newPassword: string },
  ) {
    await this.auth.changePassword(c.corporateUserId, b?.currentPassword, b?.newPassword);
    return { ok: true };
  }

  @Get("dashboard")
  dashboard(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.dashboard(ctx(c));
  }

  @Get("company")
  getCompany(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.getCompany(ctx(c));
  }

  @Patch("company")
  patchCompany(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.patchCompany(ctx(c), dto);
  }

  @Get("employees")
  listEmployees(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.listEmployees(ctx(c));
  }

  @Post("employees")
  createEmployee(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.createEmployee(ctx(c), dto);
  }

  @Get("employees/:id")
  getEmployee(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.getEmployee(ctx(c), id);
  }

  @Patch("employees/:id")
  patchEmployee(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string, @Body() dto: any) {
    return this.portal.patchEmployee(ctx(c), id, dto);
  }

  @Post("employees/:id/emergency")
  addEmergency(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string, @Body() dto: any) {
    return this.portal.addEmergencyContact(ctx(c), id, dto);
  }

  @Get("travel-requests")
  listTravelRequests(
    @CurrentCorporate() c: CorporateCtx,
    @Query("status") status?: string,
    @Query("take") take?: string,
  ) {
    return this.portal.listTravelRequests(ctx(c), { status, take: take ? +take : undefined });
  }

  @Post("travel-requests")
  createTravelRequest(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.createTravelRequest(ctx(c), dto);
  }

  @Get("travel-requests/:id")
  getTravelRequest(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.getTravelRequest(ctx(c), id);
  }

  @Patch("travel-requests/:id")
  patchTravelRequest(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string, @Body() dto: any) {
    return this.portal.patchTravelRequest(ctx(c), id, dto);
  }

  @Post("travel-requests/:id/submit")
  submitTravelRequest(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.submitTravelRequest(ctx(c), id);
  }

  @Post("travel-requests/:id/cancel")
  cancelTravelRequest(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.cancelTravelRequest(ctx(c), id);
  }

  @Get("approvals")
  listApprovals(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.listApprovals(ctx(c));
  }

  @Post("approvals/:id/decide")
  decideApproval(
    @CurrentCorporate() c: CorporateCtx,
    @Param("id") id: string,
    @Body() dto: { decision: "approved" | "rejected"; note?: string },
  ) {
    return this.portal.decideApproval(ctx(c), id, dto);
  }

  @Get("bookings")
  listBookings(
    @CurrentCorporate() c: CorporateCtx,
    @Query("status") status?: string,
    @Query("take") take?: string,
  ) {
    return this.portal.listBookings(ctx(c), { status, take: take ? +take : undefined });
  }

  @Get("bookings/:id")
  getBooking(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.getBooking(ctx(c), id);
  }

  @Get("finance")
  finance(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.finance(ctx(c));
  }

  @Get("applications/:applicationId/documents")
  listDocuments(@CurrentCorporate() c: CorporateCtx, @Param("applicationId") applicationId: string) {
    return this.portal.listDocuments(ctx(c), applicationId);
  }

  @Post("applications/:applicationId/documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 15 * 1024 * 1024 } }))
  uploadDocument(
    @CurrentCorporate() c: CorporateCtx,
    @Param("applicationId") applicationId: string,
    @UploadedFile() file: UploadedFileShape,
    @Body() body: any,
  ) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    return this.portal.uploadDocument(ctx(c), applicationId, file, body);
  }

  @Get("documents/:id/versions")
  documentVersions(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string) {
    return this.portal.documentVersions(ctx(c), id);
  }

  @Get("documents/:id/download")
  async documentDownload(@CurrentCorporate() c: CorporateCtx, @Param("id") id: string, @Res() res: Response) {
    const { buf, fileName, mimeType } = await this.portal.downloadDocument(ctx(c), id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
    res.send(buf);
  }

  @Get("communications")
  communications(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.communications(ctx(c));
  }

  @Post("support")
  createSupport(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.createSupport(ctx(c), dto);
  }

  @Get("announcements")
  listAnnouncements(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.listAnnouncements(ctx(c));
  }

  @Post("announcements")
  createAnnouncement(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.createAnnouncement(ctx(c), dto);
  }

  @Get("approval-chain")
  getApprovalChain(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.getApprovalChain(ctx(c));
  }

  @Put("approval-chain")
  putApprovalChain(@CurrentCorporate() c: CorporateCtx, @Body() dto: any) {
    return this.portal.putApprovalChain(ctx(c), dto);
  }

  @Get("reports")
  reports(@CurrentCorporate() c: CorporateCtx) {
    return this.portal.reports(ctx(c));
  }

  @Get("packages")
  packages(@Query("limit") limit?: string) {
    return this.packagesSvc.corporateListPublished(limit ? +limit : 100);
  }
}
