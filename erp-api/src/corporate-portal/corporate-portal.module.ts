import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { PackagesModule } from "../packages/packages.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { StorageService, LocalStorageService } from "../storage/storage";
import { CorporateJwtGuard } from "./corporate-jwt.guard";
import { CorporateAuthService } from "./corporate-auth.service";
import { CorporatePortalService } from "./corporate-portal.service";
import { CorporateAuthController } from "./corporate-auth.controller";
import { CorporatePortalController } from "./corporate-portal.controller";
import { CorporateAdminController } from "./corporate-admin.controller";

@Module({
  imports: [JwtModule.register({}), NotificationsModule, PackagesModule, WorkflowModule],
  controllers: [CorporateAuthController, CorporatePortalController, CorporateAdminController],
  providers: [
    CorporateAuthService,
    CorporatePortalService,
    CorporateJwtGuard,
    { provide: StorageService, useClass: LocalStorageService },
  ],
})
export class CorporatePortalModule {}
