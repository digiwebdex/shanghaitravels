import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CustomersModule } from "./customers/customers.module";
import { ApplicationsModule } from "./applications/applications.module";
import { WorkflowModule } from "./workflow/workflow.module";
import { TasksModule } from "./tasks/tasks.module";
import { FinanceModule } from "./finance/finance.module";
import { AccountingModule } from "./accounting/accounting.module";
import { ArApModule } from "./arap/arap.module";
import { BankingModule } from "./banking/banking.module";
import { StatementsModule } from "./statements/statements.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PublicModule } from "./public/public.module";
import { PartnersModule } from "./partners/partners.module";
import { HrModule } from "./hr/hr.module";
import { CrmModule } from "./crm/crm.module";
import { SalesModule } from "./sales/sales.module";
import { CommsModule } from "./comms/comms.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { CmsModule } from "./cms/cms.module";
import { AdminModule } from "./admin/admin.module";
import { OcrModule } from "./ocr/ocr.module";
import { AgentPortalModule } from "./agent-portal/agent-portal.module";
import { PdfModule } from "./pdf/pdf.module";
import { AutomationModule } from "./automation/automation.module";
import { CustomerPortalModule } from "./customer-portal/customer-portal.module";
import { CorporatePortalModule } from "./corporate-portal/corporate-portal.module";
import { PackagesModule } from "./packages/packages.module";
import { DestinationsModule } from "./destinations/destinations.module";
import { DocumentsController } from "./documents.controller";
import { PassportsController } from "./passports.controller";
import { UsersController } from "./users.controller";
import { AppDocumentsController } from "./app-documents.controller";
import { AgentDocumentsController } from "./partners/agent-documents.controller";
import { ReferenceController } from "./reference.controller";
import { HotelsController } from "./hotels.controller";
import { TransportCatalogController } from "./transport-catalog.controller";
import { TourCatalogController } from "./tour-catalog.controller";
import { HajjCatalogController } from "./hajj-catalog.controller";
import { HealthController } from "./health.controller";
import { JwtAuthGuard, PermissionsGuard } from "./rbac";
import { StorageService, LocalStorageService } from "./storage/storage";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Production hardening — baseline per-IP rate limiting across the whole API
    // (was absent; only ad-hoc in-memory limiters on a few auth/intake endpoints).
    // Single-instance in-memory store; for multi-instance add a Redis storage.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    JwtModule.register({}),
    PrismaModule,
    AuthModule,
    CustomersModule,
    ApplicationsModule,
    WorkflowModule,
    TasksModule,
    FinanceModule,
    AccountingModule,
    ArApModule,
    BankingModule,
    StatementsModule,
    NotificationsModule,
    PublicModule,
    PartnersModule,
    HrModule,
    CrmModule,
    SalesModule,
    CommsModule,
    AnalyticsModule,
    CmsModule,
    AdminModule,
    OcrModule,
    AgentPortalModule,
    PdfModule,
    AutomationModule,
    CustomerPortalModule,
    CorporatePortalModule,
    PackagesModule,
    DestinationsModule,
  ],
  controllers: [
    HealthController,
    DocumentsController,
    PassportsController,
    UsersController,
    AppDocumentsController,
    AgentDocumentsController,
    ReferenceController,
    HotelsController,
    TransportCatalogController,
    TourCatalogController,
    HajjCatalogController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },    // runs first: per-IP rate limit
    { provide: APP_GUARD, useClass: JwtAuthGuard },      // then: authenticate + attach permissions
    { provide: APP_GUARD, useClass: PermissionsGuard },  // then: enforce @Permissions()
    { provide: StorageService, useClass: LocalStorageService }, // swap to R2 driver later
  ],
})
export class AppModule {}
