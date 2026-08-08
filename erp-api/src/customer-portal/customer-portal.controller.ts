import {
  Body, Controller, Get, Patch, Post, Param, Query, Res, UseGuards, Delete,
  UseInterceptors, UploadedFile, BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { Public } from "../rbac";
import { CustomerJwtGuard, CurrentCustomer, CustomerCtx } from "./customer-jwt.guard";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomerPortalService } from "./customer-portal.service";
import { PackagesService } from "../packages/packages.service";

interface UploadedFileShape { buffer: Buffer; mimetype: string; originalname: string; size: number }

@Public()
@UseGuards(CustomerJwtGuard)
@Controller("portal/customer")
export class CustomerPortalController {
  constructor(
    private auth: CustomerAuthService,
    private portal: CustomerPortalService,
    private packagesSvc: PackagesService,
  ) {}

  @Get("me")
  me(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.me(c.customerId, c.customerUserId);
  }

  @Post("change-password")
  async changePassword(@CurrentCustomer() c: CustomerCtx, @Body() b: { currentPassword: string; newPassword: string }) {
    await this.auth.changePassword(c.customerUserId, b?.currentPassword, b?.newPassword);
    return { ok: true };
  }

  @Patch("profile")
  updateProfile(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.updateProfile(c.customerId, dto);
  }

  @Get("dashboard")
  dashboard(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.dashboard(c.customerId);
  }

  @Get("applications")
  applications(
    @CurrentCustomer() c: CustomerCtx,
    @Query("serviceType") serviceType?: string,
    @Query("status") status?: string,
  ) {
    return this.portal.listApplications(c.customerId, { serviceType, status });
  }

  @Get("applications/:id")
  applicationGet(@CurrentCustomer() c: CustomerCtx, @Param("id") id: string) {
    return this.portal.getApplication(c.customerId, id);
  }

  @Post("applications")
  applicationCreate(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.createApplication(c.customerId, dto);
  }

  @Get("documents")
  documents(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.listDocuments(c.customerId);
  }

  @Get("documents/:id/versions")
  documentVersions(@CurrentCustomer() c: CustomerCtx, @Param("id") id: string) {
    return this.portal.documentVersions(c.customerId, id);
  }

  @Get("documents/:id/download")
  async documentDownload(@CurrentCustomer() c: CustomerCtx, @Param("id") id: string, @Res() res: Response) {
    const { buf, fileName, mimeType } = await this.portal.downloadDocument(c.customerId, id);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
    res.send(buf);
  }

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 15 * 1024 * 1024 } }))
  documentUpload(
    @CurrentCustomer() c: CustomerCtx,
    @UploadedFile() file: UploadedFileShape,
    @Body() body: any,
  ) {
    if (!file) throw new BadRequestException("file is required (multipart field 'file')");
    return this.portal.uploadDocument(c.customerId, file, body);
  }

  @Get("finance")
  finance(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.finance(c.customerId);
  }

  @Get("communications")
  communications(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.communications(c.customerId);
  }

  @Post("support")
  support(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.createSupport(c.customerId, dto);
  }

  @Get("profile/passports")
  passports(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.listPassports(c.customerId);
  }

  @Post("profile/passports")
  passportUpsert(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.upsertPassport(c.customerId, dto);
  }

  @Get("profile/family")
  family(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.listFamily(c.customerId);
  }

  @Post("profile/family")
  familyAdd(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.addFamily(c.customerId, dto);
  }

  @Get("profile/travellers")
  travellers(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.listTravellers(c.customerId);
  }

  @Post("profile/travellers")
  travellerAdd(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.addTraveller(c.customerId, dto);
  }

  @Get("profile/emergency")
  emergency(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.listEmergency(c.customerId);
  }

  @Post("profile/emergency")
  emergencyAdd(@CurrentCustomer() c: CustomerCtx, @Body() dto: any) {
    return this.portal.addEmergency(c.customerId, dto);
  }

  @Get("reports")
  reports(@CurrentCustomer() c: CustomerCtx) {
    return this.portal.reports(c.customerId);
  }

  @Get("packages")
  packages(@Query("limit") limit?: string) {
    return this.packagesSvc.customerListPublished(limit ? +limit : 50);
  }

  @Get("packages/:id")
  packageGet(@Param("id") id: string) {
    return this.packagesSvc.customerGetPublished(id);
  }

  @Get("wishlist")
  wishlist(@CurrentCustomer() c: CustomerCtx) {
    return this.packagesSvc.listWishlist(c.customerId);
  }

  @Post("wishlist")
  wishlistAdd(@CurrentCustomer() c: CustomerCtx, @Body() dto: { packageId: string }) {
    if (!dto?.packageId) throw new BadRequestException("packageId required");
    return this.packagesSvc.addWishlist(c.customerId, dto.packageId);
  }

  @Delete("wishlist/:packageId")
  wishlistRemove(@CurrentCustomer() c: CustomerCtx, @Param("packageId") packageId: string) {
    return this.packagesSvc.removeWishlist(c.customerId, packageId);
  }

  @Post("packages/:id/book")
  packageBook(@CurrentCustomer() c: CustomerCtx, @Param("id") id: string, @Body() dto: any) {
    return this.packagesSvc.customerBook(c.customerId, id, dto);
  }
}
