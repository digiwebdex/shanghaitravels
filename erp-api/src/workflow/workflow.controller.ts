import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { WorkflowService } from "./workflow.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

// Workflow templates are a Settings concern → gated by settings:manage
// (super_admin also bypasses via the guard).
@Controller("workflow/templates")
export class WorkflowController {
  constructor(private wf: WorkflowService) {}

  @Get() @Permissions("settings:manage")
  list(@Query("serviceType") serviceType?: string) { return this.wf.list(serviceType); }

  @Get(":id") @Permissions("settings:manage")
  get(@Param("id") id: string) { return this.wf.get(id); }

  // Install default workflows for any service that has none (idempotent). Runs
  // automatically on boot; this endpoint is for manual re-seed after edits.
  @Post("seed-defaults") @Permissions("settings:manage")
  seedDefaults() { return this.wf.seedDefaults(); }

  @Post() @Permissions("settings:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.wf.create(dto, u); }

  @Patch(":id") @Permissions("settings:manage")
  update(@Param("id") id: string, @Body() dto: any) { return this.wf.update(id, dto); }

  @Post(":id/activate") @Permissions("settings:manage")
  activate(@Param("id") id: string) { return this.wf.activate(id); }

  @Delete(":id") @Permissions("settings:manage")
  remove(@Param("id") id: string) { return this.wf.softDelete(id); }
}
