import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { AgentsService } from "./agents.service";
import { CorporateService } from "./corporate.service";
import { CommissionService } from "./commission.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

// NOTE on permissions: agent/commission/corporate MUTATIONS use NEW permission
// keys (agent:manage, commission:manage, corporate:manage) that are NOT yet in
// the RBAC seed. That means they currently FAIL CLOSED — only super_admin (guard
// bypass) can use them until the owner adds the keys and assigns them (likely to
// accounts_manager). Viewing uses existing keys (supplier:read, commission:read,
// customer:read).

@Controller("suppliers")
export class SuppliersController {
  constructor(private s: SuppliersService) {}
  @Get() @Permissions("supplier:read") list(@Query() q: any) { return this.s.list(q); }
  @Get(":id") @Permissions("supplier:read") get(@Param("id") id: string) { return this.s.get(id); }
  @Post() @Permissions("supplier:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.s.create(dto, u); }
  @Patch(":id") @Permissions("supplier:manage") update(@Param("id") id: string, @Body() dto: any) { return this.s.update(id, dto); }
  @Delete(":id") @Permissions("supplier:manage") remove(@Param("id") id: string) { return this.s.softDelete(id); }
}

// Agent tiers (classification only in Phase 1). Distinct resource → own
// controller; reuses AgentsService (no duplicate service).
@Controller("agent-tiers")
export class AgentTiersController {
  constructor(private a: AgentsService) {}
  @Get() @Permissions("commission:read") list() { return this.a.listTiers(); }
  @Post() @Permissions("agent:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.createTier(dto, u); }
  @Patch(":id") @Permissions("agent:manage") update(@Param("id") id: string, @Body() dto: any) { return this.a.updateTier(id, dto); }
}

@Controller("agents")
export class AgentsController {
  constructor(private a: AgentsService) {}
  @Get() @Permissions("commission:read") list(@Query() q: any) { return this.a.list(q); }
  @Get(":id") @Permissions("commission:read") get(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.getForView(id, u); }
  @Get(":id/timeline") @Permissions("commission:read") timeline(@Param("id") id: string) { return this.a.timeline(id); }
  @Post() @Permissions("agent:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.create(dto, u); }
  @Patch(":id") @Permissions("agent:manage") update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.update(id, dto, u); }
  @Delete(":id") @Permissions("agent:manage") remove(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.softDelete(id, u); }
  @Post(":id/restore") @Permissions("agent:manage") restore(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.restore(id, u); }
  // ---- V6 Phase 1: onboarding lifecycle (agent:manage) ----
  @Post(":id/kyc") @Permissions("agent:manage") kyc(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.reviewKyc(id, dto, u); }
  @Post(":id/approve") @Permissions("agent:manage") approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.approve(id, u); }
  @Post(":id/reject") @Permissions("agent:manage") reject(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.reject(id, dto, u); }
  @Post(":id/suspend") @Permissions("agent:manage") suspend(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.suspend(id, u); }
  @Post(":id/reinstate") @Permissions("agent:manage") reinstate(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.reinstate(id, u); }
  // wallet adjustment / withdrawal (money) — commission:manage
  @Post(":id/wallet") @Permissions("commission:manage") wallet(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.walletTxn(id, dto, u); }
  // ---- V6 Wave 1: immutable wallet ledger + funding rails ----
  @Get(":id/wallet/ledger") @Permissions("commission:read") walletLedger(@Param("id") id: string) { return this.a.walletLedger(id); }
  @Get(":id/wallet/reconcile") @Permissions("commission:read") reconcile(@Param("id") id: string) { return this.a.reconcileWallet(id); }
  @Get(":id/wallet/requests") @Permissions("commission:read") walletRequests(@Param("id") id: string, @Query("status") s?: string) { return this.a.listWalletRequests(id, s); }
  @Post(":id/wallet/topup") @Permissions("commission:manage") topup(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.createTopupRequest(id, dto, u); }
  @Post(":id/wallet/withdraw") @Permissions("commission:manage") withdraw(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.createWithdrawalRequest(id, dto, u); }
}

// V6 Wave 1 — decide wallet funding/payout requests. commission:manage.
@Controller("wallet-requests")
export class WalletRequestsController {
  constructor(private a: AgentsService) {}
  @Get() @Permissions("commission:read") list(@Query("status") s?: string) { return this.a.listWalletRequests(undefined, s); }
  @Post("topup/:id/:decision") @Permissions("commission:manage") topup(@Param("id") id: string, @Param("decision") d: string, @CurrentUser() u: AuthedUser) { return this.a.decideTopup(id, d === "approve", u); }
  @Post("withdrawal/:id/:decision") @Permissions("commission:manage") withdrawal(@Param("id") id: string, @Param("decision") d: string, @CurrentUser() u: AuthedUser) { return this.a.decideWithdrawal(id, d === "approve", u); }
}

// V6 Wave 1 — commission RULES (the engine policy). commission:manage.
@Controller("commission-rules")
export class CommissionRulesController {
  constructor(private c: CommissionService) {}
  @Get() @Permissions("commission:read") list(@Query() q: any) { return this.c.listRules(q); }
  @Post() @Permissions("commission:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.c.createRule(dto, u); }
  @Patch(":id") @Permissions("commission:manage") update(@Param("id") id: string, @Body() dto: any) { return this.c.updateRule(id, dto); }
  @Delete(":id") @Permissions("commission:manage") remove(@Param("id") id: string) { return this.c.deleteRule(id); }
}

@Controller("commissions")
export class CommissionsController {
  constructor(private a: AgentsService, private engine: CommissionService) {}
  @Get() @Permissions("commission:read") list(@Query() q: any) { return this.a.listCommissions(q); }
  @Post() @Permissions("commission:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.a.createCommission(dto, u); }
  // V6 Wave 1 — engine: preview / generate from rules, and the agent ledger.
  @Get("preview/invoice/:invoiceId") @Permissions("commission:read") preview(@Param("invoiceId") id: string) { return this.engine.previewForInvoice(id); }
  @Post("generate/invoice/:invoiceId") @Permissions("commission:manage") generate(@Param("invoiceId") id: string, @CurrentUser() u: AuthedUser) { return this.engine.generateForInvoice(id, u); }
  @Get("ledger/:agentId") @Permissions("commission:read") ledger(@Param("agentId") agentId: string) { return this.engine.ledger(agentId); }
  @Post(":id/approve") @Permissions("commission:manage") approve(@Param("id") id: string) { return this.a.approveCommission(id); }
  @Post(":id/pay") @Permissions("commission:manage") pay(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.a.payCommission(id, u); }
}

@Controller("corporate-clients")
export class CorporateController {
  constructor(private c: CorporateService) {}
  @Get() @Permissions("customer:read") list(@Query() q: any) { return this.c.list(q); }
  @Get(":id") @Permissions("customer:read") get(@Param("id") id: string) { return this.c.get(id); }
  @Post() @Permissions("corporate:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.c.create(dto, u); }
  @Patch(":id") @Permissions("corporate:manage") update(@Param("id") id: string, @Body() dto: any) { return this.c.update(id, dto); }
  @Delete(":id") @Permissions("corporate:manage") remove(@Param("id") id: string) { return this.c.softDelete(id); }
}
