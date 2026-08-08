import { Body, Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { SalesService } from "./sales.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("sales")
export class SalesController {
  constructor(private sales: SalesService) {}

  @Post("bootstrap")
  @Permissions("opportunity:manage")
  bootstrap(@CurrentUser() u: AuthedUser) {
    return this.sales.bootstrap(u);
  }

  @Get("stages")
  @Permissions("opportunity:read")
  stages() {
    return this.sales.listStages();
  }

  @Post("stages")
  @Permissions("opportunity:manage")
  createStage(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createStage(dto, u);
  }

  @Get("lost-reasons")
  @Permissions("opportunity:read")
  lostReasons() {
    return this.sales.listLostReasons();
  }

  @Post("lost-reasons")
  @Permissions("opportunity:manage")
  createLostReason(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createLostReason(dto, u);
  }

  @Post("opportunities/:id/stage")
  @Permissions("opportunity:manage")
  setStage(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.setOpportunityStage(id, dto, u);
  }

  @Get("opportunities/:id/history")
  @Permissions("opportunity:read")
  history(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.opportunityHistory(id, u);
  }

  @Get("quotations")
  @Permissions("quote:read")
  quotations(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.sales.listQuotations(q, u);
  }

  @Get("quotations/:id")
  @Permissions("quote:read")
  getQuote(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.getQuotation(id, u);
  }

  @Post("quotations")
  @Permissions("quote:manage")
  createQuote(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createQuotation(dto, u);
  }

  @Post("quotations/:id/submit")
  @Permissions("quote:manage")
  submit(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.submitQuotation(id, u);
  }

  @Post("quotations/:id/approve")
  @Permissions("quote:approve")
  approve(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.approveQuotation(id, u);
  }

  @Post("quotations/:id/reject")
  @Permissions("quote:approve")
  reject(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.rejectQuotation(id, dto?.reason, u);
  }

  @Post("quotations/:id/send")
  @Permissions("quote:manage")
  send(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.sendQuotation(id, u);
  }

  @Post("quotations/:id/revise")
  @Permissions("quote:manage")
  revise(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.reviseQuotation(id, dto || {}, u);
  }

  @Get("quotations/:id/export")
  @Permissions("quote:read")
  async export(@Param("id") id: string, @CurrentUser() u: AuthedUser, @Res() res: Response) {
    const { contentType, body, filename } = await this.sales.exportQuotation(id, u);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(body);
  }

  @Get("price-templates")
  @Permissions("sales:pricing")
  templates(@CurrentUser() u: AuthedUser) {
    return this.sales.listPriceTemplates(u);
  }

  @Post("price-templates")
  @Permissions("sales:pricing")
  createTemplate(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createPriceTemplate(dto, u);
  }

  @Get("price-books")
  @Permissions("sales:pricing")
  books(@CurrentUser() u: AuthedUser) {
    return this.sales.listPriceBooks(u);
  }

  @Post("price-books")
  @Permissions("sales:pricing")
  createBook(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createPriceBook(dto, u);
  }

  @Post("pricing/resolve")
  @Permissions("sales:pricing")
  resolve(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.resolvePricing(dto, u);
  }

  @Get("tasks")
  @Permissions("sales:task")
  tasks(@Query() q: any, @CurrentUser() u: AuthedUser) {
    return this.sales.listTasks(q, u);
  }

  @Post("tasks")
  @Permissions("sales:task")
  createTask(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.createTask(dto, u);
  }

  @Post("tasks/:id/complete")
  @Permissions("sales:task")
  completeTask(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.completeTask(id, u);
  }

  @Post("tasks/:id/escalate")
  @Permissions("sales:task")
  escalateTask(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.sales.escalateTask(id, u);
  }

  @Post("convert")
  @Permissions("crm:convert")
  convert(@Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.sales.convertApprovedQuote(dto, u);
  }

  @Get("reports/quote-status")
  @Permissions("crm:read")
  quoteStatus(@CurrentUser() u: AuthedUser) {
    return this.sales.reportQuoteStatus(u);
  }

  @Get("reports/win-loss")
  @Permissions("crm:read")
  winLoss(@CurrentUser() u: AuthedUser) {
    return this.sales.reportWinLoss(u);
  }

  @Get("reports/funnel")
  @Permissions("crm:read")
  funnel(@CurrentUser() u: AuthedUser) {
    return this.sales.reportFunnel(u);
  }

  @Get("reports/by-executive")
  @Permissions("crm:read")
  byExecutive(@CurrentUser() u: AuthedUser) {
    return this.sales.reportByExecutive(u);
  }

  @Get("reports/conversion-time")
  @Permissions("crm:read")
  conversionTime(@CurrentUser() u: AuthedUser) {
    return this.sales.reportConversionTime(u);
  }

  @Get("reports/forecast-accuracy")
  @Permissions("crm:read")
  forecastAccuracy(@CurrentUser() u: AuthedUser) {
    return this.sales.reportForecastAccuracy(u);
  }
}
