import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { PackagesModule } from "../packages/packages.module";
import { StorageService, LocalStorageService } from "../storage/storage";
import { CustomerAuthService } from "./customer-auth.service";
import { CustomerPortalService } from "./customer-portal.service";
import { CustomerJwtGuard } from "./customer-jwt.guard";
import { CustomerAuthController } from "./customer-auth.controller";
import { CustomerPortalController } from "./customer-portal.controller";
import { CustomerAdminController } from "./customer-admin.controller";

@Module({
  imports: [JwtModule.register({}), NotificationsModule, PackagesModule],
  controllers: [CustomerAuthController, CustomerPortalController, CustomerAdminController],
  providers: [
    CustomerAuthService,
    CustomerPortalService,
    CustomerJwtGuard,
    { provide: StorageService, useClass: LocalStorageService },
  ],
  exports: [CustomerAuthService, CustomerPortalService],
})
export class CustomerPortalModule {}
