import { Body, Controller, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { BankingService } from "./banking.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("banking")
export class BankingController {
  constructor(private banking: BankingService) {}

  @Post("bootstrap")
  @Permissions("banking:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.banking.bootstrap(u);
  }

  @Get("masters")
  @Permissions("banking:read")
  listMasters() {
    return this.banking.listMasters();
  }

  @Post("masters")
  @Permissions("banking:manage")
  createMaster(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.createMaster(dto, u);
  }

  @Patch("masters/:id")
  @Permissions("banking:manage")
  updateMaster(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.updateMaster(id, dto, u);
  }

  @Get("accounts")
  @Permissions("banking:read")
  listAccounts(@Query("kind") kind?: string, @Query("active") active?: string) {
    return this.banking.listAccounts({ kind, active });
  }

  @Get("accounts/:id")
  @Permissions("banking:read")
  getAccount(@Param("id") id: string) {
    return this.banking.getAccount(id);
  }

  @Post("accounts")
  @Permissions("banking:manage")
  createAccount(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.createAccount(dto, u);
  }

  @Patch("accounts/:id")
  @Permissions("banking:manage")
  updateAccount(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.updateAccount(id, dto, u);
  }

  @Post("accounts/:id/opening")
  @Permissions("banking:manage")
  postOpening(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.banking.postOpening(id, u);
  }

  @Get("accounts/:id/balance")
  @Permissions("banking:read")
  balance(@Param("id") id: string, @Query("asOf") asOf?: string) {
    return this.banking.bookBalance(id, asOf ? new Date(asOf) : undefined);
  }

  @Get("movements")
  @Permissions("banking:read")
  listMovements(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("bankAccountId") bankAccountId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.banking.listMovements({
      status,
      type,
      bankAccountId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("movements/:id")
  @Permissions("banking:read")
  getMovement(@Param("id") id: string) {
    return this.banking.getMovement(id);
  }

  @Post("movements")
  @Permissions("banking:manage")
  createMovement(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.createMovement(dto, u);
  }

  @Post("movements/:id/post")
  @Permissions("banking:manage")
  postMovement(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.banking.postMovement(id, u);
  }

  @Post("movements/:id/void")
  @Permissions("banking:manage")
  voidMovement(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.voidMovement(id, u, dto?.reason);
  }

  @Get("cheques")
  @Permissions("banking:read")
  listCheques(
    @Query("status") status?: string,
    @Query("bankAccountId") bankAccountId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.banking.listCheques({
      status,
      bankAccountId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post("cheques")
  @Permissions("cheque:manage")
  createCheque(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.createCheque(dto, u);
  }

  @Post("cheques/:id/status")
  @Permissions("cheque:manage")
  chequeStatus(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.updateChequeStatus(id, dto.status, u, { bounceReason: dto.bounceReason });
  }

  @Post("cheques/:id/print")
  @Permissions("cheque:manage")
  printCheque(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.banking.printCheque(id, u);
  }

  @Get("cheque-print-config")
  @Permissions("cheque:manage")
  getPrintConfig() {
    return this.banking.getChequePrintConfig();
  }

  @Put("cheque-print-config")
  @Permissions("cheque:manage")
  putPrintConfig(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.putChequePrintConfig(dto, u);
  }

  @Get("statements")
  @Permissions("banking:read")
  listStatements(@Query("bankAccountId") bankAccountId?: string) {
    return this.banking.listStatements(bankAccountId);
  }

  @Get("statements/:id")
  @Permissions("banking:read")
  getStatement(@Param("id") id: string) {
    return this.banking.getStatement(id);
  }

  @Post("statements")
  @Permissions("banking:reconcile")
  createStatement(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.createStatement(dto, u);
  }

  @Post("statements/import-csv")
  @Permissions("banking:reconcile")
  importCsv(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.importCsv(dto, u);
  }

  @Get("reconciliations")
  @Permissions("banking:read")
  listRecons(@Query("bankAccountId") bankAccountId?: string) {
    return this.banking.listReconciliations(bankAccountId);
  }

  @Post("reconciliations")
  @Permissions("banking:reconcile")
  startRecon(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.startReconciliation(dto, u);
  }

  @Post("reconciliations/match")
  @Permissions("banking:reconcile")
  match(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.matchLine(dto, u);
  }

  @Post("reconciliations/unmatch/:lineId")
  @Permissions("banking:reconcile")
  unmatch(@Param("lineId") lineId: string, @CurrentUser() u: AuthedUser) {
    return this.banking.unmatchLine(lineId, u);
  }

  @Post("reconciliations/:id/complete")
  @Permissions("banking:reconcile")
  complete(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.banking.completeReconciliation(id, u);
  }

  @Post("bridge/ar-receipt/:arDocId")
  @Permissions("banking:manage")
  bridgeAr(@Param("arDocId") arDocId: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.bridgeArReceipt(arDocId, dto, u);
  }

  @Post("bridge/ap-payment/:apDocId")
  @Permissions("banking:manage")
  bridgeAp(@Param("apDocId") apDocId: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.banking.bridgeApPayment(apDocId, dto, u);
  }

  @Get("reports/bank-book")
  @Permissions("financial-report:read")
  bankBook(@Query("bankAccountId") bankAccountId: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.banking.reportBankBook(bankAccountId, from, to);
  }

  @Get("reports/cash-book")
  @Permissions("financial-report:read")
  cashBook(@Query("from") from?: string, @Query("to") to?: string) {
    return this.banking.reportCashBook(from, to);
  }

  @Get("reports/daily-cash-position")
  @Permissions("financial-report:read")
  dailyPosition(@Query("asOf") asOf?: string) {
    return this.banking.reportDailyCashPosition(asOf);
  }

  @Get("reports/reconciliation")
  @Permissions("financial-report:read")
  reconReport(@Query("id") id: string) {
    return this.banking.reportReconciliation(id);
  }

  @Get("reports/cash-flow-summary")
  @Permissions("financial-report:read")
  cashFlow(@Query("from") from?: string, @Query("to") to?: string) {
    return this.banking.reportCashFlowSummary(from, to);
  }
}
