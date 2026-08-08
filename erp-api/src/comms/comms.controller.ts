import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CommsService } from "./comms.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("comms")
export class CommsController {
  constructor(private comms: CommsService) {}

  @Post("bootstrap")
  @Permissions("comms:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.comms.bootstrap(u);
  }

  @Get("timeline")
  @Permissions("comms:read")
  timeline(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.timeline(q, u);
  }

  @Post("log")
  @Permissions("comms:manage")
  log(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.logEntry(dto, u);
  }

  @Get("templates")
  @Permissions("comms:read")
  templates(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.listTemplates(u, q);
  }

  @Post("templates")
  @Permissions("comms:manage")
  createTemplate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.createTemplate(dto, u);
  }

  @Post("templates/:id/render")
  @Permissions("comms:read")
  render(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.renderTemplateById(id, dto?.vars || {}, u);
  }

  @Get("threads")
  @Permissions("comms:read")
  threads(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.listThreads(q, u);
  }

  @Get("threads/:id")
  @Permissions("comms:read")
  getThread(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.comms.getThread(id, u);
  }

  @Post("threads")
  @Permissions("comms:manage")
  createThread(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.createThread(dto, u);
  }

  @Post("threads/:id/messages")
  @Permissions("comms:manage")
  addMessage(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.addMessage(id, dto, u);
  }

  @Post("send")
  @Permissions("comms:send")
  send(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.send(dto, u);
  }

  @Get("delivery")
  @Permissions("comms:read")
  delivery(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.listDelivery(q, u);
  }

  @Post("process-outbox")
  @Permissions("comms:send")
  processOutbox(@CurrentUser() u: AuthedUser) {
    return this.comms.processOutbox(u);
  }

  @Get("activities")
  @Permissions("comms:read")
  activities(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.listActivities(q, u);
  }

  @Post("activities")
  @Permissions("comms:manage")
  createActivity(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.comms.createActivity(dto, u);
  }

  @Post("activities/:id/complete")
  @Permissions("comms:manage")
  complete(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.comms.completeActivity(id, u);
  }

  @Post("activities/:id/escalate")
  @Permissions("comms:manage")
  escalate(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.comms.escalateActivity(id, u);
  }

  @Get("calendar")
  @Permissions("comms:read")
  calendar(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.comms.calendar(q, u);
  }

  @Get("sla")
  @Permissions("comms:read")
  sla(@CurrentUser() u: AuthedUser) {
    return this.comms.slaDashboard(u);
  }

  @Get("portal/:partyKind/:partyId/timeline")
  @Permissions("comms:read")
  portalTimeline(@Param("partyKind") partyKind: string, @Param("partyId") partyId: string, @CurrentUser() u: AuthedUser) {
    return this.comms.portalTimeline(partyKind, partyId, u);
  }

  @Get("reports/volume")
  @Permissions("comms:read")
  volume(@CurrentUser() u: AuthedUser) {
    return this.comms.reportVolume(u);
  }

  @Get("reports/response-time")
  @Permissions("comms:read")
  responseTime(@CurrentUser() u: AuthedUser) {
    return this.comms.reportResponseTime(u);
  }

  @Get("reports/sla-compliance")
  @Permissions("comms:read")
  slaCompliance(@CurrentUser() u: AuthedUser) {
    return this.comms.reportSlaCompliance(u);
  }

  @Get("reports/activity-completion")
  @Permissions("comms:read")
  activityCompletion(@CurrentUser() u: AuthedUser) {
    return this.comms.reportActivityCompletion(u);
  }

  @Get("reports/executive-productivity")
  @Permissions("comms:read")
  executiveProductivity(@CurrentUser() u: AuthedUser) {
    return this.comms.reportExecutiveProductivity(u);
  }
}
