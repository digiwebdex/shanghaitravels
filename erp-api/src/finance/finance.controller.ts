import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";
import { RecordPaymentDto } from "../common/dto/payment.dto";

// Invoices — amounts gated by invoice:amount:read; mutations by invoice:manage.
@Controller("invoices")
export class InvoicesController {
  constructor(private fin: FinanceService) {}
  @Get() @Permissions("invoice:amount:read")
  list(@CurrentUser() u: AuthedUser, @Query() q: any) { return this.fin.listInvoices(u, q); }
  @Get(":id") @Permissions("invoice:amount:read")
  get(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.getInvoice(id, u); }
  @Post() @Permissions("invoice:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.fin.createInvoice(dto, u); }
  @Post(":id/issue") @Permissions("invoice:manage")
  issue(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.issueInvoice(id, u); }
  @Delete(":id") @Permissions("invoice:manage")
  remove(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.softDeleteInvoice(id, u); }

  // V5 lifecycle transitions (RBAC: manage for approve/send/cancel/void; refund perm for refunded)
  @Post(":id/approve") @Permissions("invoice:manage")
  approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.approveInvoice(id, u); }
  @Post(":id/send") @Permissions("invoice:manage")
  send(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.markSent(id, u); }
  @Post(":id/viewed") @Permissions("invoice:manage")
  viewed(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.markViewed(id, u); }
  @Post(":id/cancel") @Permissions("invoice:manage")
  cancel(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.cancelInvoice(id, u); }
  @Post(":id/void") @Permissions("invoice:manage")
  voidInvoice(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.voidInvoice(id, u); }
  @Post(":id/refunded") @Permissions("payment:refund")
  refunded(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.markRefunded(id, u); }
  @Get(":id/audit") @Permissions("invoice:amount:read")
  audit(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.fin.invoiceAudit(id, u); }
}

// Payments — record needs payment:record; REFUND needs the SEPARATE payment:refund.
@Controller("payments")
export class PaymentsController {
  constructor(private fin: FinanceService) {}
  @Post() @Permissions("payment:record")
  record(@Body() dto: RecordPaymentDto, @CurrentUser() u: AuthedUser) { return this.fin.recordPayment(dto, u, "payment"); }
  @Post("refund") @Permissions("payment:refund")
  refund(@Body() dto: RecordPaymentDto, @CurrentUser() u: AuthedUser) { return this.fin.recordPayment(dto, u, "refund"); }
}

// Expenses (payables) — expense:manage.
@Controller("expenses")
export class ExpensesController {
  constructor(private fin: FinanceService) {}
  @Get() @Permissions("expense:manage")
  list(@CurrentUser() u: AuthedUser, @Query() q: any) { return this.fin.listExpenses(u, q); }
  @Post() @Permissions("expense:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.fin.createExpense(dto, u); }
}

// Cash & bank accounts + ledger — view by bank:read; manage by ledger:manage.
@Controller("accounts")
export class AccountsController {
  constructor(private fin: FinanceService) {}
  @Get() @Permissions("bank:read")
  list(@CurrentUser() u: AuthedUser) { return this.fin.listAccounts(u); }
  @Get(":id/ledger") @Permissions("bank:read")
  ledger(@Param("id") id: string) { return this.fin.ledger(id); }
  @Post() @Permissions("ledger:manage")
  create(@Body() dto: any) { return this.fin.createAccount(dto); }
}

// Financial reports — financial-report:read.
@Controller("finance")
export class FinanceController {
  constructor(private fin: FinanceService) {}
  @Get("summary") @Permissions("financial-report:read")
  summary(@CurrentUser() u: AuthedUser) { return this.fin.summary(u); }
  @Get("reports/:type") @Permissions("financial-report:read")
  report(@Param("type") type: string, @Query() q: any, @CurrentUser() u: AuthedUser) { return this.fin.report(type, q, u); }
}
