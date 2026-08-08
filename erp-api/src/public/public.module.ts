import { Module } from "@nestjs/common";
import { PublicService } from "./public.service";
import { PublicController } from "./public.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
