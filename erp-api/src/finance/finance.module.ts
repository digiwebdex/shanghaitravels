import { Module } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { InvoicesController, PaymentsController, ExpensesController, AccountsController, FinanceController } from "./finance.controller";
import { AutomationModule } from "../automation/automation.module";

@Module({
  imports: [AutomationModule],
  controllers: [InvoicesController, PaymentsController, ExpensesController, AccountsController, FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
