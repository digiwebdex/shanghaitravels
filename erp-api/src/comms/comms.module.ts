import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { MessagingModule } from "./messaging.module";
import { CommsService } from "./comms.service";
import { CommsController } from "./comms.controller";

@Module({
  imports: [NotificationsModule, MessagingModule],
  controllers: [CommsController],
  providers: [CommsService],
  exports: [CommsService],
})
export class CommsModule {}
