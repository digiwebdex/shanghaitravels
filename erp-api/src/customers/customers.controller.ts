import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CustomersService } from "./customers.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("customers")
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get() @Permissions("customer:read")
  list(@CurrentUser() u: AuthedUser, @Query() q: any) {
    return this.customers.list(u as any, q);
  }

  /** Enterprise global intelligence search — must be registered before :id */
  @Get("intelligence/search") @Permissions("customer:read")
  intelligenceSearch(@CurrentUser() u: AuthedUser, @Query("q") q?: string) {
    return this.customers.intelligenceSearch(u, q || "");
  }

  @Get("intelligence/reports") @Permissions("customer:read")
  intelligenceReports(@CurrentUser() u: AuthedUser) {
    return this.customers.intelligenceReports(u);
  }

  @Get(":id/intelligence") @Permissions("customer:read")
  intelligenceProfile(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.customers.intelligenceProfile(id, u);
  }

  // ---- V6 Wave 1: customer ownership (agent:manage) ----
  @Get(":id/ownership") @Permissions("customer:read")
  ownershipHistory(@Param("id") id: string) {
    return this.customers.ownershipHistory(id);
  }

  @Post(":id/ownership/assign") @Permissions("agent:manage")
  assignPrimary(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.customers.assignPrimary(id, dto, u);
  }

  @Post(":id/ownership/release") @Permissions("agent:manage")
  releaseOwnership(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.customers.releaseOwnership(id, dto, u);
  }

  @Post(":id/ownership/secondary") @Permissions("agent:manage")
  setSecondary(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.customers.setSecondary(id, dto, u);
  }

  @Get(":id") @Permissions("customer:read")
  get(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.customers.get(id, u as any);
  }

  @Post() @Permissions("customer:create")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.customers.create(dto, u as any);
  }

  @Patch(":id") @Permissions("customer:update")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.customers.update(id, dto, u as any);
  }

  @Delete(":id") @Permissions("customer:delete") // soft-delete only
  remove(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.customers.softDelete(id, u as any);
  }
}
