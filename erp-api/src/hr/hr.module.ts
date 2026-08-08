import { Module } from "@nestjs/common";
import { HrService } from "./hr.service";
import { EmployeesController, PayrollController } from "./hr.controller";

@Module({ controllers: [EmployeesController, PayrollController], providers: [HrService] })
export class HrModule {}
