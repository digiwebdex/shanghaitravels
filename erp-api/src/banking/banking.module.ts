import { Module } from "@nestjs/common";
import { AccountingModule } from "../accounting/accounting.module";
import { BankingService } from "./banking.service";
import { BankingController } from "./banking.controller";

@Module({
  imports: [AccountingModule],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
