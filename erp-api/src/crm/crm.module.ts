import { Module } from "@nestjs/common";
import { ApplicationsModule } from "../applications/applications.module";
import { CrmService } from "./crm.service";
import { LeadsController, CommunicationsController, CrmController } from "./crm.controller";

@Module({
  imports: [ApplicationsModule],
  controllers: [LeadsController, CommunicationsController, CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
