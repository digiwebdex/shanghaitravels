import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AccountingService } from "./accounting.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("gl")
export class AccountingController {
  constructor(private gl: AccountingService) {}

  @Post("bootstrap")
  @Permissions("gl:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.gl.bootstrap(u);
  }

  // Groups
  @Get("account-groups")
  @Permissions("gl:read")
  listGroups() {
    return this.gl.listGroups();
  }

  @Post("account-groups")
  @Permissions("gl:manage")
  createGroup(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createGroup(dto, u);
  }

  @Patch("account-groups/:id")
  @Permissions("gl:manage")
  updateGroup(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.updateGroup(id, dto, u);
  }

  // Accounts
  @Get("accounts")
  @Permissions("gl:read")
  listAccounts(
    @Query("q") q?: string,
    @Query("type") type?: string,
    @Query("active") active?: string,
  ) {
    return this.gl.listAccounts(q, type, active);
  }

  @Post("accounts")
  @Permissions("gl:manage")
  createAccount(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createAccount(dto, u);
  }

  @Patch("accounts/:id")
  @Permissions("gl:manage")
  updateAccount(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.updateAccount(id, dto, u);
  }

  // Fiscal / periods
  @Get("fiscal-years")
  @Permissions("gl:read")
  listFiscalYears() {
    return this.gl.listFiscalYears();
  }

  @Post("fiscal-years")
  @Permissions("gl:manage")
  createFiscalYear(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createFiscalYear(dto, u);
  }

  @Post("periods")
  @Permissions("gl:manage")
  createPeriod(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createPeriod(dto, u);
  }

  @Post("periods/:id/close")
  @Permissions("period:close")
  closePeriod(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.gl.closePeriod(id, u);
  }

  @Post("periods/:id/reopen")
  @Permissions("period:close")
  reopenPeriod(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.gl.reopenPeriod(id, u);
  }

  // Cost centers
  @Get("cost-centers")
  @Permissions("gl:read")
  listCostCenters() {
    return this.gl.listCostCenters();
  }

  @Post("cost-centers")
  @Permissions("gl:manage")
  createCostCenter(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createCostCenter(dto, u);
  }

  @Patch("cost-centers/:id")
  @Permissions("gl:manage")
  updateCostCenter(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.updateCostCenter(id, dto, u);
  }

  // Currencies / FX
  @Get("currencies")
  @Permissions("gl:read")
  listCurrencies() {
    return this.gl.listCurrencies();
  }

  @Post("currencies")
  @Permissions("fx:manage")
  createCurrency(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createCurrency(dto, u);
  }

  @Patch("currencies/:id")
  @Permissions("fx:manage")
  updateCurrency(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.updateCurrency(id, dto, u);
  }

  @Get("exchange-rates")
  @Permissions("gl:read")
  listExchangeRates() {
    return this.gl.listExchangeRates().then((rows) =>
      rows.map((r) => ({
        ...r,
        rateScaled: r.rateScaled.toString(),
        rate: Number(r.rateScaled) / 1e8,
      })),
    );
  }

  @Post("exchange-rates")
  @Permissions("fx:manage")
  createExchangeRate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createExchangeRate(dto, u);
  }

  // Journals
  @Get("journals")
  @Permissions("gl:read")
  listJournals(
    @Query("status") status?: string,
    @Query("periodId") periodId?: string,
    @Query("type") type?: string,
    @Query("limit") limit?: string,
  ) {
    return this.gl.listJournals({
      status,
      periodId,
      type,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get("journals/:id")
  @Permissions("gl:read")
  getJournal(@Param("id") id: string) {
    return this.gl.getJournal(id);
  }

  @Post("journals")
  @Permissions("journal:create")
  createJournal(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.createJournal(dto, u);
  }

  @Patch("journals/:id")
  @Permissions("journal:create")
  updateJournal(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.updateJournal(id, dto, u);
  }

  @Post("journals/:id/submit")
  @Permissions("journal:create")
  submitJournal(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.gl.submitJournal(id, u);
  }

  @Post("journals/:id/approve")
  @Permissions("journal:approve")
  approveJournal(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.gl.approveJournal(id, u);
  }

  @Post("journals/:id/reject")
  @Permissions("journal:approve")
  rejectJournal(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.rejectJournal(id, u, dto?.reason);
  }

  @Post("journals/:id/post")
  @Permissions("journal:approve")
  postJournal(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.gl.postJournal(id, u);
  }

  @Post("journals/:id/void")
  @Permissions("journal:approve")
  voidJournal(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.gl.voidJournal(id, u, dto?.reason);
  }

  // Reports
  @Get("reports/chart-of-accounts")
  @Permissions("financial-report:read")
  reportCoa() {
    return this.gl.reportChartOfAccounts();
  }

  @Get("reports/journal-register")
  @Permissions("financial-report:read")
  reportRegister(
    @Query("status") status?: string,
    @Query("periodId") periodId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.gl.reportJournalRegister({ status, periodId, from, to });
  }

  @Get("reports/trial-balance")
  @Permissions("financial-report:read")
  reportTrialBalance(@Query("periodId") periodId?: string, @Query("asOf") asOf?: string) {
    return this.gl.reportTrialBalance({ periodId, asOf });
  }
}
