import { Body, Controller, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { AnalyticsService } from "./analytics.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("analytics")
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Post("bootstrap")
  @Permissions("analytics:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.analytics.bootstrap(u);
  }

  @Get("executive")
  @Permissions("analytics:read")
  executive(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.executive(q, u);
  }

  @Get("customer")
  @Permissions("analytics:read")
  customer(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.customer(q, u);
  }

  @Get("sales")
  @Permissions("analytics:read")
  sales(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.sales(q, u);
  }

  @Get("comms")
  @Permissions("analytics:read")
  comms(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.comms(q, u);
  }

  @Get("finance")
  @Permissions("analytics:read")
  finance(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.finance(q, u);
  }

  @Get("export/:report")
  @Permissions("analytics:export")
  async export(
    @Param("report") report: string,
    @Query() q: any,
    @CurrentUser() u: AuthedUser,
    @Res() res: Response,
  ) {
    const { contentType, body, filename } = await this.analytics.exportReport(report, q.format || "csv", q, u);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(body);
  }

  @Get("templates")
  @Permissions("analytics:read")
  templates(@CurrentUser() u: AuthedUser) {
    return this.analytics.listTemplates(u);
  }

  @Post("templates")
  @Permissions("analytics:manage")
  createTemplate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.createTemplate(dto, u);
  }

  @Get("schedules")
  @Permissions("analytics:read")
  schedules(@CurrentUser() u: AuthedUser) {
    return this.analytics.listSchedules(u);
  }

  @Post("schedules")
  @Permissions("analytics:manage")
  createSchedule(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.createSchedule(dto, u);
  }

  @Patch("schedules/:id")
  @Permissions("analytics:manage")
  patchSchedule(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.analytics.patchSchedule(id, dto, u);
  }
}
