import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { PackagesService } from "./packages.service";
import { PackagesController } from "./packages.controller";
import { SitePackagesController } from "./site-packages.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [PackagesController, SitePackagesController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
