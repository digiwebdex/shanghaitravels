import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { PackagesService } from "./packages.service";
import { PackagesController } from "./packages.controller";
import { SitePackagesController } from "./site-packages.controller";

@Module({
  imports: [NotificationsModule, WorkflowModule],
  controllers: [PackagesController, SitePackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
