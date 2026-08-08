import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Put } from "@nestjs/common";
import { ApplicationsService } from "./applications.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("applications")
export class ApplicationsController {
  constructor(private apps: ApplicationsService) {}

  @Get() @Permissions("application:read")
  list(@CurrentUser() u: AuthedUser, @Query() q: any) { return this.apps.list(u, q); }

  @Get(":id") @Permissions("application:read")
  get(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.apps.get(id, u); }

  @Get(":id/journey") @Permissions("application:read")
  journey(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.apps.journey(id, u); }

  @Post() @Permissions("application:create")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.apps.create(dto, u); }

  @Patch(":id") @Permissions("application:update")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.apps.update(id, dto, u); }

  @Post(":id/advance-stage") @Permissions("application:advance-stage")
  advance(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.apps.advanceStage(id, u, dto?.note); }

  @Post(":id/note") @Permissions("application:note")
  note(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.apps.addNote(id, dto?.message, u); }

  @Post(":id/assign") @Permissions("application:assign")
  assign(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.apps.assign(id, dto.assignedTo ?? null, u);
  }

  @Get(":id/checklist") @Permissions("application:read")
  getChecklist(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.apps.getChecklist(id, u);
  }

  @Put(":id/checklist") @Permissions("application:update")
  putChecklist(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.apps.putChecklist(id, dto?.updates || [], u);
  }

  @Post(":id/approve") @Permissions("application:approve")
  approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.apps.approve(id, u); }

  @Delete(":id") @Permissions("application:delete") // soft-delete only
  remove(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.apps.softDelete(id, u); }

  // Visa detail sub-resource
  @Put(":id/visa") @Permissions("application:update")
  upsertVisa(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.apps.upsertVisa(id, dto, u); }

  // Phase 4 service detail sub-resources (air_ticket | hotel | tour | transport)
  @Put(":id/detail/:serviceType") @Permissions("application:update")
  upsertDetail(@Param("id") id: string, @Param("serviceType") st: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.apps.upsertDetail(id, st, dto, u);
  }
}
