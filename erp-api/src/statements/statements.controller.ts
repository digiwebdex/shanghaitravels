import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { StatementsService } from "./statements.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("fs")
export class StatementsController {
  constructor(private fs: StatementsService) {}

  @Get("ledger")
  @Permissions("financial-report:read")
  ledger(
    @Query("glAccountId") glAccountId?: string,
    @Query("periodId") periodId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("branchId") branchId?: string,
    @Query("costCenterId") costCenterId?: string,
    @Query("currencyCode") currencyCode?: string,
    @Query("limit") limit?: string,
  ) {
    return this.fs.ledgerInquiry({
      glAccountId,
      periodId,
      from,
      to,
      branchId,
      costCenterId,
      currencyCode,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("ledger/:glAccountId")
  @Permissions("financial-report:read")
  drilldown(
    @Param("glAccountId") glAccountId: string,
    @Query("periodId") periodId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.fs.ledgerDrilldown(glAccountId, { periodId, from, to });
  }

  @Get("trial-balance")
  @Permissions("financial-report:read")
  tb(@Query("periodId") periodId?: string, @Query("asOf") asOf?: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.trialBalance({ periodId, asOf, from, to });
  }

  @Get("balance-sheet")
  @Permissions("financial-report:read")
  bs(@Query("asOf") asOf?: string, @Query("periodId") periodId?: string, @Query("compareAsOf") compareAsOf?: string) {
    return this.fs.balanceSheet({ asOf, periodId, compareAsOf });
  }

  @Get("profit-loss")
  @Permissions("financial-report:read")
  pl(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("periodId") periodId?: string,
    @Query("compareFrom") compareFrom?: string,
    @Query("compareTo") compareTo?: string,
  ) {
    return this.fs.profitAndLoss({ from, to, periodId, compareFrom, compareTo });
  }

  @Get("cash-flow")
  @Permissions("financial-report:read")
  cf(@Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.cashFlow({ from, to });
  }

  @Get("equity")
  @Permissions("financial-report:read")
  equity(@Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.equityStatement({ from, to });
  }

  @Get("comparative")
  @Permissions("financial-report:read")
  comparative(
    @Query("report") report?: string,
    @Query("asOf") asOf?: string,
    @Query("compareAsOf") compareAsOf?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("compareFrom") compareFrom?: string,
    @Query("compareTo") compareTo?: string,
  ) {
    return this.fs.comparative({ report: report || "balance-sheet", asOf, compareAsOf, from, to, compareFrom, compareTo });
  }

  @Get("multi-period")
  @Permissions("financial-report:read")
  multi(@Query("report") report?: string, @Query("periodIds") periodIds?: string) {
    return this.fs.multiPeriod({ report: report || "balance-sheet", periodIds: periodIds || "" });
  }

  @Get("analysis/account")
  @Permissions("financial-report:read")
  analysisAccount(@Query("glAccountId") glAccountId: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.analysisAccount(glAccountId, { from, to });
  }

  @Get("analysis/cost-center")
  @Permissions("financial-report:read")
  analysisCc(@Query("costCenterId") costCenterId?: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.analysisCostCenter({ costCenterId, from, to });
  }

  @Get("analysis/branch")
  @Permissions("financial-report:read")
  analysisBranch(@Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.analysisBranch({ from, to });
  }

  @Get("analysis/currency")
  @Permissions("financial-report:read")
  analysisCurrency(@Query("from") from?: string, @Query("to") to?: string) {
    return this.fs.analysisCurrency({ from, to });
  }

  @Get("travel-validation")
  @Permissions("financial-report:read")
  travelValidation() {
    return this.fs.travelValidation();
  }

  @Post("periods/:id/lock")
  @Permissions("period:lock")
  lock(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.fs.lockPeriod(id, u);
  }

  @Post("periods/:id/reopen-request")
  @Permissions("period:close")
  reopenRequest(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.requestReopen(id, dto?.reason, u);
  }

  @Post("periods/:id/reopen-approve")
  @Permissions("period:reopen-approve")
  reopenApprove(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.approveReopen(id, u, dto?.note);
  }

  @Post("periods/:id/reopen-reject")
  @Permissions("period:reopen-approve")
  reopenReject(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.rejectReopen(id, u, dto?.note);
  }

  @Get("reopen-requests")
  @Permissions("period:reopen-approve")
  listReopen(@Query("status") status?: string) {
    return this.fs.listReopenRequests(status);
  }

  @Post("journals/:id/reverse")
  @Permissions("journal:approve")
  reverse(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.reverseJournal(id, u, dto?.memo);
  }

  @Post("year-end/close")
  @Permissions("period:close")
  yearEndClose(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.yearEndClose(dto.fiscalYearId, u);
  }

  @Post("year-end/roll-forward")
  @Permissions("period:close")
  rollForward(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.fs.rollForward(dto.fiscalYearId, u);
  }

  @Get("closing-runs")
  @Permissions("financial-report:read")
  closingRuns() {
    return this.fs.listClosingRuns();
  }

  @Get("export/:report")
  @Permissions("fs:export")
  async export(
    @Param("report") report: string,
    @Query("format") format: string,
    @Query() q: Record<string, string>,
    @Res() res: Response,
  ) {
    const { contentType, body, filename } = await this.fs.exportReport(report, format || "csv", q);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(body);
  }
}
