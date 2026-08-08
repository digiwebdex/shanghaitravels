import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../prisma.module";
import { CommsModule } from "../comms/comms.module";
import { AutomationService } from "./automation.service";
import { AutomationController } from "./automation.controller";

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, CommsModule],
  providers: [AutomationService],
  controllers: [AutomationController],
  exports: [AutomationService],
})
export class AutomationModule {}
