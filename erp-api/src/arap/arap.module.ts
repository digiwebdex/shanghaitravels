import { Module } from "@nestjs/common";
import { AccountingModule } from "../accounting/accounting.module";
import { ArApService } from "./arap.service";
import { ArController, ApController } from "./arap.controller";

@Module({
  imports: [AccountingModule],
  controllers: [ArController, ApController],
  providers: [ArApService],
  exports: [ArApService],
})
export class ArApModule {}
