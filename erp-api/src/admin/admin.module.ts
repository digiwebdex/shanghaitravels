import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { SettingsController, ReportsController } from "./admin.controller";

/** Legacy CmsController retired — Website & CMS lives in CmsModule (`/cms/*`, `/site/*`). */
@Module({ controllers: [SettingsController, ReportsController], providers: [AdminService] })
export class AdminModule {}