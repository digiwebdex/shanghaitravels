import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CrmService } from "./crm.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("leads")
export class LeadsController {
  constructor(private crm: CrmService) {}
  @Get() @Permissions("lead:read")
  list(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listLeads(q, u); }
  @Get(":id") @Permissions("lead:read")
  get(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.crm.getLead(id, u); }
  @Post() @Permissions("lead:manage")
  create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createLead(dto, u); }
  @Patch(":id") @Permissions("lead:manage")
  update(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.updateLead(id, dto, u); }
  @Delete(":id") @Permissions("lead:manage")
  remove(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.crm.deleteLead(id, u); }
}

@Controller("communications")
export class CommunicationsController {
  constructor(private crm: CrmService) {}
  @Get() @Permissions("crm:read")
  list(@Query() q: any) { return this.crm.listComms(q); }
  @Post() @Permissions("communication:manage")
  log(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.logComm(dto, u); }
}

@Controller("crm")
export class CrmController {
  constructor(private crm: CrmService) {}

  @Get("leads") @Permissions("lead:read")
  leads(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listLeads(q, u); }
  @Post("leads") @Permissions("lead:manage")
  createLead(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createLead(dto, u); }
  @Get("leads/:id") @Permissions("lead:read")
  getLead(@Param("id") id: string, @CurrentUser() u: AuthedUser) { return this.crm.getLead(id, u); }
  @Patch("leads/:id") @Permissions("lead:manage")
  patchLead(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.crm.updateLead(id, dto, u);
  }

  @Get("contacts") @Permissions("crm:read")
  contacts(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listContacts(q, u); }
  @Post("contacts") @Permissions("lead:manage")
  createContact(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createContact(dto, u); }
  @Patch("contacts/:id") @Permissions("lead:manage")
  patchContact(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.crm.updateContact(id, dto, u);
  }

  @Get("organizations") @Permissions("crm:read")
  orgs(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listOrganizations(q, u); }
  @Post("organizations") @Permissions("corporate:manage")
  createOrg(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createOrganization(dto, u); }
  @Patch("organizations/:id") @Permissions("corporate:manage")
  patchOrg(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.crm.updateOrganization(id, dto, u);
  }

  @Get("opportunities") @Permissions("opportunity:read")
  opps(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listOpportunities(q, u); }
  @Post("opportunities") @Permissions("opportunity:manage")
  createOpp(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createOpportunity(dto, u); }
  @Post("opportunities/:id/stage") @Permissions("opportunity:manage")
  stage(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.crm.updateOpportunityStage(id, dto.stage, u, dto);
  }

  @Get("activities") @Permissions("crm:read")
  activities(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listActivities(q, u); }
  @Post("activities") @Permissions("communication:manage")
  createActivity(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createActivity(dto, u); }
  @Post("activities/:id/complete") @Permissions("communication:manage")
  completeActivity(@Param("id") id: string, @CurrentUser() u: AuthedUser) {
    return this.crm.completeActivity(id, u);
  }

  @Get("quotations") @Permissions("quote:read")
  quotes(@Query() q: any, @CurrentUser() u: AuthedUser) { return this.crm.listQuotations(q, u); }
  @Post("quotations") @Permissions("quote:manage")
  createQuote(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.createQuotation(dto, u); }
  @Post("quotations/:id/status") @Permissions("quote:manage")
  quoteStatus(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) {
    return this.crm.setQuotationStatus(id, dto.status, u);
  }

  @Post("convert") @Permissions("crm:convert")
  convert(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.crm.convert(dto, u); }

  @Get("reports/lead-sources") @Permissions("crm:read")
  leadSources(@CurrentUser() u: AuthedUser) { return this.crm.reportLeadSources(u); }
  @Get("reports/conversion") @Permissions("crm:read")
  conversion(@CurrentUser() u: AuthedUser) { return this.crm.reportConversion(u); }
  @Get("reports/pipeline") @Permissions("crm:read")
  pipeline(@CurrentUser() u: AuthedUser) { return this.crm.reportPipeline(u); }
  @Get("reports/team") @Permissions("crm:read")
  team(@CurrentUser() u: AuthedUser) { return this.crm.reportTeam(u); }
  @Get("reports/forecast") @Permissions("crm:read")
  forecast(@CurrentUser() u: AuthedUser) { return this.crm.reportForecast(u); }
}
