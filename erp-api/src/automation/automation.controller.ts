import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { AuthedUser, CurrentUser, Permissions } from "../rbac";
import { AutomationService } from "./automation.service";

@Controller("automation")
export class AutomationController {
  constructor(private auto: AutomationService) {}

  @Get("status")
  @Permissions("settings:manage")
  status() {
    return this.auto.status();
  }

  @Get("settings")
  @Permissions("settings:manage")
  getSettings() {
    return this.auto.config();
  }

  @Put("settings")
  @Permissions("settings:manage")
  setSettings(@Body() body: Record<string, unknown>, @CurrentUser() u: AuthedUser) {
    return this.auto.setConfig(body, u.id);
  }

  // Manual trigger (verification / on-demand run); the cron does this on schedule.
  @Post("run/:job")
  @Permissions("settings:manage")
  run(@Param("job") job: string) {
    return job === "retries" ? this.auto.runRetries() : this.auto.runReminders();
  }
}
