import { Module } from "@nestjs/common";
import { ApplicationsModule } from "../applications/applications.module";
import { SalesService } from "./sales.service";
import { SalesController } from "./sales.controller";

@Module({
  imports: [ApplicationsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
