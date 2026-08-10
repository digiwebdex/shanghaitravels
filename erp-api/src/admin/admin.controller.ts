import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("cms/pages")
export class CmsController {
  constructor(private admin: AdminService) {}
  @Get() @Permissions("cms:manage") list() { return this.admin.listPages(); }
  @Get(":slug") @Permissions("cms:manage") get(@Param("slug") slug: string) { return this.admin.getPage(slug); }
  @Put() @Permissions("cms:manage") upsert(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.admin.upsertPage(dto, u); }
  @Delete(":slug") @Permissions("cms:manage") remove(@Param("slug") slug: string) { return this.admin.deletePage(slug); }
}

@Controller("settings")
export class SettingsController {
  constructor(private admin: AdminService) {}
  @Get() @Permissions("settings:manage") list() { return this.admin.listSettings(); }
  @Put(":key") @Permissions("settings:manage") set(@Param("key") key: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.admin.setSetting(key, dto.value, u); }
}

@Controller("reports")
export class ReportsController {
  constructor(private admin: AdminService) {}
  @Get("operational") @Permissions("report:read") ops(@CurrentUser() u: AuthedUser) { return this.admin.operationalReport(u); }

  // Shanghai Travels Owner Requirement — Delivery Report. Server-side filtering
  // (date range + customer classification), existing report:read permission.
  @Get("delivery") @Permissions("report:read")
  delivery(@CurrentUser() u: AuthedUser, @Query() q: any) {
    return this.admin.deliveryReport(u, q);
  }
}
