import { Module } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationScheduler } from "./notifications.scheduler";
import { MessagingModule } from "../comms/messaging.module";

@Module({
  imports: [MessagingModule], // shared email/whatsapp/sms adapters for the delivery worker
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationScheduler], // HF1: auto-deliver the outbox
  exports: [NotificationsService], // PublicModule (intake) enqueues staff alerts
})
export class NotificationsModule {}
