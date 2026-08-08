import { Module } from "@nestjs/common";
import { AccountingModule } from "../accounting/accounting.module";
import { StatementsService } from "./statements.service";
import { StatementsController } from "./statements.controller";

@Module({
  imports: [AccountingModule],
  controllers: [StatementsController],
  providers: [StatementsService],
  exports: [StatementsService],
})
export class StatementsModule {}
