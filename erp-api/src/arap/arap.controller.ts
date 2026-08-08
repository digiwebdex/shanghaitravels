import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ArApService } from "./arap.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("ar")
export class ArController {
  constructor(private arap: ArApService) {}

  @Get("customers")
  @Permissions("ar:read")
  listCustomers() {
    return this.arap.listArCustomers();
  }

  @Get("documents")
  @Permissions("ar:read")
  list(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("customerId") customerId?: string,
    @Query("applicationId") applicationId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.arap.listArDocuments({
      status,
      type,
      customerId,
      applicationId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("documents/:id")
  @Permissions("ar:read")
  get(@Param("id") id: string) {
    return this.arap.getArDocument(id);
  }

  @Post("documents")
  @Permissions("ar:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.createArDocument(dto, u);
  }

  @Patch("documents/:id")
  @Permissions("ar:manage")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.updateArDocument(id, dto, u);
  }

  @Post("documents/:id/submit")
  @Permissions("ar:manage")
  submit(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.submitAr(id, u);
  }

  @Post("documents/:id/approve")
  @Permissions("ar:manage")
  approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.approveAr(id, u);
  }

  @Post("documents/:id/reject")
  @Permissions("ar:manage")
  reject(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.rejectAr(id, u, dto?.reason);
  }

  @Post("documents/:id/post")
  @Permissions("ar:manage")
  post(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.postAr(id, u);
  }

  @Post("documents/:id/void")
  @Permissions("ar:manage")
  voidDoc(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.voidAr(id, u, dto?.reason);
  }

  @Post("allocations")
  @Permissions("ar:manage")
  allocate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.allocateAr(dto, u);
  }

  @Post("bridge/invoice/:invoiceId")
  @Permissions("ar:manage")
  bridgeInvoice(@Param("invoiceId") invoiceId: string, @CurrentUser() u: AuthedUser) {
    return this.arap.bridgeFromInvoice(invoiceId, u);
  }

  @Post("bridge/payment/:paymentId")
  @Permissions("ar:manage")
  bridgePayment(@Param("paymentId") paymentId: string, @CurrentUser() u: AuthedUser) {
    return this.arap.bridgeFromPayment(paymentId, u);
  }

  @Get("reports/aging")
  @Permissions("financial-report:read")
  aging(@Query("asOf") asOf?: string) {
    return this.arap.reportArAging(asOf);
  }

  @Get("reports/customer-ledger")
  @Permissions("financial-report:read")
  ledger(@Query("customerId") customerId: string) {
    return this.arap.reportCustomerLedger(customerId);
  }

  @Get("reports/outstanding")
  @Permissions("financial-report:read")
  outstanding() {
    return this.arap.reportOutstandingSummary();
  }
}

@Controller("ap")
export class ApController {
  constructor(private arap: ArApService) {}

  @Get("suppliers")
  @Permissions("ap:read")
  listSuppliers() {
    return this.arap.listApSuppliers();
  }

  @Get("documents")
  @Permissions("ap:read")
  list(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("supplierId") supplierId?: string,
    @Query("applicationId") applicationId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.arap.listApDocuments({
      status,
      type,
      supplierId,
      applicationId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("documents/:id")
  @Permissions("ap:read")
  get(@Param("id") id: string) {
    return this.arap.getApDocument(id);
  }

  @Post("documents")
  @Permissions("ap:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.createApDocument(dto, u);
  }

  @Patch("documents/:id")
  @Permissions("ap:manage")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.updateApDocument(id, dto, u);
  }

  @Post("documents/:id/submit")
  @Permissions("ap:manage")
  submit(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.submitAp(id, u);
  }

  @Post("documents/:id/approve")
  @Permissions("ap:manage")
  approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.approveAp(id, u);
  }

  @Post("documents/:id/reject")
  @Permissions("ap:manage")
  reject(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.rejectAp(id, u, dto?.reason);
  }

  @Post("documents/:id/post")
  @Permissions("ap:manage")
  post(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.arap.postAp(id, u);
  }

  @Post("documents/:id/void")
  @Permissions("ap:manage")
  voidDoc(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.voidAp(id, u, dto?.reason);
  }

  @Post("allocations")
  @Permissions("ap:manage")
  allocate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.arap.allocateAp(dto, u);
  }

  @Get("reports/aging")
  @Permissions("financial-report:read")
  aging(@Query("asOf") asOf?: string) {
    return this.arap.reportApAging(asOf);
  }

  @Get("reports/supplier-ledger")
  @Permissions("financial-report:read")
  ledger(@Query("supplierId") supplierId: string) {
    return this.arap.reportSupplierLedger(supplierId);
  }

  @Get("reports/outstanding")
  @Permissions("financial-report:read")
  outstanding() {
    return this.arap.reportOutstandingSummary();
  }
}
