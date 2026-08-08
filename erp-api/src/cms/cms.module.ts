import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { CmsService } from "./cms.service";
import { CmsController } from "./cms.controller";
import { SiteController } from "./site.controller";

@Module({
  imports: [NotificationsModule],
  controllers: [CmsController, SiteController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
