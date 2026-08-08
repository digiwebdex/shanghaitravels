import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { Permissions } from "../rbac";

// Staff view of the outbox. communication:manage covers notifications.
@Controller("notifications")
export class NotificationsController {
  constructor(private notes: NotificationsService) {}

  @Get() @Permissions("communication:manage")
  list(@Query() q: any) { return this.notes.list(q); }

  // Manual trigger for the (currently no-op) delivery worker.
  @Post("process") @Permissions("communication:manage")
  process() { return this.notes.processPending(); }
}
