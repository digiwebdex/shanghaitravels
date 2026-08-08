import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { HrService } from "./hr.service";
import { Permissions, CurrentUser, AuthedUser } from "../rbac";

@Controller("employees")
export class EmployeesController {
  constructor(private hr: HrService) {}
  @Get() @Permissions("hr:read") list(@Query() q: any) { return this.hr.listEmployees(q); }
  @Get(":id") @Permissions("hr:read") get(@Param("id") id: string) { return this.hr.getEmployee(id); }
  @Post() @Permissions("hr:manage") create(@Body() dto: any, @CurrentUser() u: AuthedUser) { return this.hr.createEmployee(dto, u); }
  @Patch(":id") @Permissions("hr:manage") update(@Param("id") id: string, @Body() dto: any) { return this.hr.updateEmployee(id, dto); }
  @Delete(":id") @Permissions("hr:manage") remove(@Param("id") id: string) { return this.hr.deleteEmployee(id); }
  @Post(":id/salary") @Permissions("hr:manage") pay(@Param("id") id: string, @Body() dto: any, @CurrentUser() u: AuthedUser) { return this.hr.paySalary(id, dto, u); }
}

@Controller("payroll")
export class PayrollController {
  constructor(private hr: HrService) {}
  @Get() @Permissions("hr:manage") list(@Query() q: any) { return this.hr.listSalaries(q); }
}
