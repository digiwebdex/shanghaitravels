import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { OcrModule } from "../ocr/ocr.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PackagesModule } from "../packages/packages.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { StorageService, LocalStorageService } from "../storage/storage";
import { AgentJwtGuard } from "./agent-jwt.guard";
import { AgentAuthService } from "./agent-auth.service";
import { AgentPortalService } from "./agent-portal.service";
import { AgentAuthController } from "./agent-auth.controller";
import { AgentPortalController } from "./agent-portal.controller";
import { AgentAdminController } from "./agent-admin.controller";

@Module({
  imports: [JwtModule.register({}), OcrModule, NotificationsModule, PackagesModule, WorkflowModule],
  controllers: [AgentAuthController, AgentPortalController, AgentAdminController],
  providers: [
    AgentAuthService,
    AgentPortalService,
    AgentJwtGuard,
    { provide: StorageService, useClass: LocalStorageService },
  ],
})
export class AgentPortalModule {}
