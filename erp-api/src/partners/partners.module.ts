import { Module } from "@nestjs/common";
import { SuppliersService } from "./suppliers.service";
import { AgentsService } from "./agents.service";
import { CorporateService } from "./corporate.service";
import { CommissionService } from "./commission.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { SuppliersController, AgentsController, AgentTiersController, CommissionsController, CommissionRulesController, WalletRequestsController, CorporateController } from "./partners.controller";

@Module({
  imports: [NotificationsModule], // reused outbox for agent onboarding notifications
  controllers: [SuppliersController, AgentsController, AgentTiersController, CommissionsController, CommissionRulesController, WalletRequestsController, CorporateController],
  providers: [SuppliersService, AgentsService, CorporateService, CommissionService],
})
export class PartnersModule {}
