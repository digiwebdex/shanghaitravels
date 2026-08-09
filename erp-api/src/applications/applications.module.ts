import { Module } from "@nestjs/common";
import { ApplicationsService } from "./applications.service";
import { ApplicationsController } from "./applications.controller";
import { WorkflowModule } from "../workflow/workflow.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ArApModule } from "../arap/arap.module";

@Module({
  imports: [WorkflowModule, NotificationsModule, ArApModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}

