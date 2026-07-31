import { lazy, Suspense } from "react";
import { createHashRouter } from "react-router";
import { RequireAuth } from "@/auth/RequireAuth";
import AdminLayout from "@/layouts/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { FullPageSpinner } from "@/components/FullPageSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const VisaListPage = lazy(() => import("@/pages/VisaListPage"));
const VisaCasePage = lazy(() => import("@/pages/VisaCasePage"));
const PassportsPage = lazy(() => import("@/pages/PassportsPage"));
const CaseJourneyPage = lazy(() => import("@/pages/CaseJourneyPage"));
const TicketingListPage = lazy(() => import("@/pages/TicketingListPage"));
const TicketingCasePage = lazy(() => import("@/pages/TicketingCasePage"));
const NewTicketingCasePage = lazy(() =>
  import("@/pages/TicketingListPage").then((m) => ({ default: m.NewTicketingCasePage })),
);
const HotelsListPage = lazy(() => import("@/pages/HotelsListPage"));
const HotelsCasePage = lazy(() => import("@/pages/HotelsCasePage"));
const NewHotelCasePage = lazy(() =>
  import("@/pages/HotelsListPage").then((m) => ({ default: m.NewHotelCasePage })),
);
const HotelCatalogPage = lazy(() => import("@/pages/HotelCatalogPage"));
const HotelSuppliersPage = lazy(() => import("@/pages/HotelSuppliersPage"));
const HotelReportsPage = lazy(() => import("@/pages/HotelReportsPage"));
const TransportListPage = lazy(() => import("@/pages/TransportListPage"));
const TransportCasePage = lazy(() => import("@/pages/TransportCasePage"));
const NewTransportCasePage = lazy(() =>
  import("@/pages/TransportListPage").then((m) => ({ default: m.NewTransportCasePage })),
);
const TransportVehiclesPage = lazy(() => import("@/pages/TransportVehiclesPage"));
const TransportRoutesPage = lazy(() => import("@/pages/TransportRoutesPage"));
const TransportSuppliersPage = lazy(() => import("@/pages/TransportSuppliersPage"));
const TransportReportsPage = lazy(() => import("@/pages/TransportReportsPage"));
const TourListPage = lazy(() => import("@/pages/TourListPage"));
const TourCasePage = lazy(() => import("@/pages/TourCasePage"));
const NewTourCasePage = lazy(() =>
  import("@/pages/TourListPage").then((m) => ({ default: m.NewTourCasePage })),
);
const TourPackagesPage = lazy(() => import("@/pages/TourPackagesPage"));
const TourDeparturesPage = lazy(() => import("@/pages/TourDeparturesPage"));
const TourDestinationsPage = lazy(() => import("@/pages/TourDestinationsPage"));
const TourReportsPage = lazy(() => import("@/pages/TourReportsPage"));
const HajjListPage = lazy(() => import("@/pages/HajjListPage"));
const HajjCasePage = lazy(() => import("@/pages/HajjCasePage"));
const NewHajjCasePage = lazy(() =>
  import("@/pages/HajjListPage").then((m) => ({ default: m.NewHajjCasePage })),
);
const HajjPackagesPage = lazy(() => import("@/pages/HajjPackagesPage"));
const HajjPilgrimsPage = lazy(() => import("@/pages/HajjPilgrimsPage"));
const HajjGroupsPage = lazy(() => import("@/pages/HajjGroupsPage"));
const HajjReportsPage = lazy(() => import("@/pages/HajjReportsPage"));
const FinanceAccountsPage = lazy(() => import("@/pages/FinanceAccountsPage"));
const FinanceGroupsPage = lazy(() => import("@/pages/FinanceGroupsPage"));
const FinancePeriodsPage = lazy(() => import("@/pages/FinancePeriodsPage"));
const FinanceCostCentersPage = lazy(() => import("@/pages/FinanceCostCentersPage"));
const FinanceCurrenciesPage = lazy(() => import("@/pages/FinanceCurrenciesPage"));
const FinanceJournalsPage = lazy(() => import("@/pages/FinanceJournalsPage"));
const FinanceJournalDetailPage = lazy(() => import("@/pages/FinanceJournalDetailPage"));
const FinanceReportsPage = lazy(() => import("@/pages/FinanceReportsPage"));
const FinanceArPage = lazy(() => import("@/pages/FinanceArPage"));
const FinanceArDetailPage = lazy(() => import("@/pages/FinanceArDetailPage"));
const FinanceApPage = lazy(() => import("@/pages/FinanceApPage"));
const FinanceApDetailPage = lazy(() => import("@/pages/FinanceApDetailPage"));
const FinanceArApReportsPage = lazy(() => import("@/pages/FinanceArApReportsPage"));
const FinanceBankingPage = lazy(() => import("@/pages/FinanceBankingPage"));
const FinanceBankMovementsPage = lazy(() => import("@/pages/FinanceBankMovementsPage"));
const FinanceChequesPage = lazy(() => import("@/pages/FinanceChequesPage"));
const FinanceReconciliationPage = lazy(() => import("@/pages/FinanceReconciliationPage"));
const FinanceBankingReportsPage = lazy(() => import("@/pages/FinanceBankingReportsPage"));
const FinanceStatementsPage = lazy(() => import("@/pages/FinanceStatementsPage"));
const FinanceLedgerPage = lazy(() => import("@/pages/FinanceLedgerPage"));
const FinanceAnalysisPage = lazy(() => import("@/pages/FinanceAnalysisPage"));
const FinanceClosingPage = lazy(() => import("@/pages/FinanceClosingPage"));
const CrmLeadsPage = lazy(() => import("@/pages/CrmLeadsPage"));
const CrmContactsPage = lazy(() => import("@/pages/CrmContactsPage"));
const CrmOrganizationsPage = lazy(() => import("@/pages/CrmOrganizationsPage"));
const CrmOpportunitiesPage = lazy(() => import("@/pages/CrmOpportunitiesPage"));
const CrmActivitiesPage = lazy(() => import("@/pages/CrmActivitiesPage"));
const CrmQuotationsPage = lazy(() => import("@/pages/CrmQuotationsPage"));
const CrmReportsPage = lazy(() => import("@/pages/CrmReportsPage"));
const SalesPipelinePage = lazy(() => import("@/pages/SalesPipelinePage"));
const SalesQuotationsPage = lazy(() => import("@/pages/SalesQuotationsPage"));
const SalesPricingPage = lazy(() => import("@/pages/SalesPricingPage"));
const SalesTasksPage = lazy(() => import("@/pages/SalesTasksPage"));
const SalesReportsPage = lazy(() => import("@/pages/SalesReportsPage"));
const CommsTimelinePage = lazy(() => import("@/pages/CommsTimelinePage"));
const CommsEmailPage = lazy(() => import("@/pages/CommsEmailPage"));
const CommsWhatsAppPage = lazy(() => import("@/pages/CommsWhatsAppPage"));
const CommsSmsPage = lazy(() => import("@/pages/CommsSmsPage"));
const CommsActivitiesPage = lazy(() => import("@/pages/CommsActivitiesPage"));
const CommsReportsPage = lazy(() => import("@/pages/CommsReportsPage"));
const AnalyticsExecutivePage = lazy(() => import("@/pages/AnalyticsExecutivePage"));
const AnalyticsCustomersPage = lazy(() => import("@/pages/AnalyticsCustomersPage"));
const AnalyticsSalesPage = lazy(() => import("@/pages/AnalyticsSalesPage"));
const AnalyticsCommsPage = lazy(() => import("@/pages/AnalyticsCommsPage"));
const AnalyticsFinancePage = lazy(() => import("@/pages/AnalyticsFinancePage"));
const AnalyticsReportsPage = lazy(() => import("@/pages/AnalyticsReportsPage"));
const CmsPagesPage = lazy(() => import("@/pages/CmsPagesPage"));
const CmsMenusPage = lazy(() => import("@/pages/CmsMenusPage"));
const CmsMediaPage = lazy(() => import("@/pages/CmsMediaPage"));
const CmsBannersPage = lazy(() => import("@/pages/CmsBannersPage"));
const CmsContentPage = lazy(() => import("@/pages/CmsContentPage"));
const CmsTravelPage = lazy(() => import("@/pages/CmsTravelPage"));
const CmsFormsPage = lazy(() => import("@/pages/CmsFormsPage"));
const CmsSeoPage = lazy(() => import("@/pages/CmsSeoPage"));
const CmsReportsPage = lazy(() => import("@/pages/CmsReportsPage"));
const SiteHomePage = lazy(() => import("@/pages/SiteHomePage"));
const SitePageView = lazy(() => import("@/pages/SitePageView"));
const SiteEnquirePage = lazy(() => import("@/pages/SiteEnquirePage"));
const SiteSearchPage = lazy(() => import("@/pages/SiteSearchPage"));
const SiteTravelView = lazy(() => import("@/pages/SiteTravelView"));
const CustomerPortalLayout = lazy(() => import("@/layouts/CustomerPortalLayout"));
const PortalLoginPage = lazy(() => import("@/pages/portal/PortalLoginPage"));
const PortalRegisterPage = lazy(() => import("@/pages/portal/PortalRegisterPage"));
const PortalVerifyPage = lazy(() => import("@/pages/portal/PortalVerifyPage"));
const PortalForgotPage = lazy(() => import("@/pages/portal/PortalForgotPage"));
const PortalDashboardPage = lazy(() => import("@/pages/portal/PortalDashboardPage"));
const PortalApplicationsPage = lazy(() => import("@/pages/portal/PortalApplicationsPage"));
const PortalApplicationDetailPage = lazy(() => import("@/pages/portal/PortalApplicationDetailPage"));
const PortalDocumentsPage = lazy(() => import("@/pages/portal/PortalDocumentsPage"));
const PortalFinancePage = lazy(() => import("@/pages/portal/PortalFinancePage"));
const PortalCommunicationsPage = lazy(() => import("@/pages/portal/PortalCommunicationsPage"));
const PortalProfilePage = lazy(() => import("@/pages/portal/PortalProfilePage"));
const PortalReportsPage = lazy(() => import("@/pages/portal/PortalReportsPage"));
const AgentPortalLayout = lazy(() => import("@/layouts/AgentPortalLayout"));
const AgentLoginPage = lazy(() => import("@/pages/portal/agent/AgentLoginPage"));
const AgentForgotPage = lazy(() => import("@/pages/portal/agent/AgentForgotPage"));
const AgentDashboardPage = lazy(() => import("@/pages/portal/agent/AgentDashboardPage"));
const AgentBookingsPage = lazy(() => import("@/pages/portal/agent/AgentBookingsPage"));
const AgentBookingDetailPage = lazy(() => import("@/pages/portal/agent/AgentBookingDetailPage"));
const AgentCustomersPage = lazy(() => import("@/pages/portal/agent/AgentCustomersPage"));
const AgentCustomerDetailPage = lazy(() => import("@/pages/portal/agent/AgentCustomerDetailPage"));
const AgentFinancePage = lazy(() => import("@/pages/portal/agent/AgentFinancePage"));
const AgentDocumentsPage = lazy(() => import("@/pages/portal/agent/AgentDocumentsPage"));
const AgentCommunicationsPage = lazy(() => import("@/pages/portal/agent/AgentCommunicationsPage"));
const AgentReportsPage = lazy(() => import("@/pages/portal/agent/AgentReportsPage"));

function Lazy({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageSpinner label="Loading module…" />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

// NewVisaCase is named export from VisaListPage — load via same chunk
const NewVisaCasePage = lazy(() =>
  import("@/pages/VisaListPage").then((m) => ({ default: m.NewVisaCasePage })),
);

/**
 * HashRouter so /erp/ works without nginx SPA fallback changes.
 * visa-admin and public site remain untouched.
 */
export const router = createHashRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/site",
    element: (
      <Lazy>
        <SiteHomePage />
      </Lazy>
    ),
  },
  {
    path: "/site/p/:slug",
    element: (
      <Lazy>
        <SitePageView />
      </Lazy>
    ),
  },
  {
    path: "/site/enquire",
    element: (
      <Lazy>
        <SiteEnquirePage />
      </Lazy>
    ),
  },
  {
    path: "/site/search",
    element: (
      <Lazy>
        <SiteSearchPage />
      </Lazy>
    ),
  },
  {
    path: "/site/travel/:serviceType/:slug",
    element: (
      <Lazy>
        <SiteTravelView />
      </Lazy>
    ),
  },
  {
    path: "/portal/customer/login",
    element: (
      <Lazy>
        <PortalLoginPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/customer/register",
    element: (
      <Lazy>
        <PortalRegisterPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/customer/verify",
    element: (
      <Lazy>
        <PortalVerifyPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/customer/forgot",
    element: (
      <Lazy>
        <PortalForgotPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/customer",
    element: (
      <Lazy>
        <CustomerPortalLayout />
      </Lazy>
    ),
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <PortalDashboardPage />
          </Lazy>
        ),
      },
      {
        path: "applications",
        element: (
          <Lazy>
            <PortalApplicationsPage />
          </Lazy>
        ),
      },
      {
        path: "applications/:id",
        element: (
          <Lazy>
            <PortalApplicationDetailPage />
          </Lazy>
        ),
      },
      {
        path: "documents",
        element: (
          <Lazy>
            <PortalDocumentsPage />
          </Lazy>
        ),
      },
      {
        path: "finance",
        element: (
          <Lazy>
            <PortalFinancePage />
          </Lazy>
        ),
      },
      {
        path: "communications",
        element: (
          <Lazy>
            <PortalCommunicationsPage />
          </Lazy>
        ),
      },
      {
        path: "profile",
        element: (
          <Lazy>
            <PortalProfilePage />
          </Lazy>
        ),
      },
      {
        path: "reports",
        element: (
          <Lazy>
            <PortalReportsPage />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: "/portal/agent/login",
    element: (
      <Lazy>
        <AgentLoginPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/agent/forgot",
    element: (
      <Lazy>
        <AgentForgotPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/agent",
    element: (
      <Lazy>
        <AgentPortalLayout />
      </Lazy>
    ),
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <AgentDashboardPage />
          </Lazy>
        ),
      },
      {
        path: "bookings",
        element: (
          <Lazy>
            <AgentBookingsPage />
          </Lazy>
        ),
      },
      {
        path: "bookings/:id",
        element: (
          <Lazy>
            <AgentBookingDetailPage />
          </Lazy>
        ),
      },
      {
        path: "customers",
        element: (
          <Lazy>
            <AgentCustomersPage />
          </Lazy>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <Lazy>
            <AgentCustomerDetailPage />
          </Lazy>
        ),
      },
      {
        path: "finance",
        element: (
          <Lazy>
            <AgentFinancePage />
          </Lazy>
        ),
      },
      {
        path: "documents",
        element: (
          <Lazy>
            <AgentDocumentsPage />
          </Lazy>
        ),
      },
      {
        path: "communications",
        element: (
          <Lazy>
            <AgentCommunicationsPage />
          </Lazy>
        ),
      },
      {
        path: "reports",
        element: (
          <Lazy>
            <AgentReportsPage />
          </Lazy>
        ),
      },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <NotFoundPage />,
    children: [
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <AdminLayout />,
        errorElement: <NotFoundPage />,
        children: [
          {
            index: true,
            element: (
              <Lazy>
                <DashboardPage />
              </Lazy>
            ),
          },
          {
            path: "customers",
            element: (
              <Lazy>
                <CustomersPage />
              </Lazy>
            ),
          },
          {
            path: "visa",
            element: (
              <Lazy>
                <VisaListPage />
              </Lazy>
            ),
          },
          {
            path: "visa/new",
            element: (
              <Lazy>
                <NewVisaCasePage />
              </Lazy>
            ),
          },
          {
            path: "visa/:id",
            element: (
              <Lazy>
                <VisaCasePage />
              </Lazy>
            ),
          },
          {
            path: "ticketing",
            element: (
              <Lazy>
                <TicketingListPage />
              </Lazy>
            ),
          },
          {
            path: "ticketing/new",
            element: (
              <Lazy>
                <NewTicketingCasePage />
              </Lazy>
            ),
          },
          {
            path: "ticketing/:id",
            element: (
              <Lazy>
                <TicketingCasePage />
              </Lazy>
            ),
          },
          {
            path: "hotels",
            element: (
              <Lazy>
                <HotelsListPage />
              </Lazy>
            ),
          },
          {
            path: "hotels/new",
            element: (
              <Lazy>
                <NewHotelCasePage />
              </Lazy>
            ),
          },
          {
            path: "hotels/catalog",
            element: (
              <Lazy>
                <HotelCatalogPage />
              </Lazy>
            ),
          },
          {
            path: "hotels/suppliers",
            element: (
              <Lazy>
                <HotelSuppliersPage />
              </Lazy>
            ),
          },
          {
            path: "hotels/reports",
            element: (
              <Lazy>
                <HotelReportsPage />
              </Lazy>
            ),
          },
          {
            path: "hotels/:id",
            element: (
              <Lazy>
                <HotelsCasePage />
              </Lazy>
            ),
          },
          {
            path: "transport",
            element: (
              <Lazy>
                <TransportListPage />
              </Lazy>
            ),
          },
          {
            path: "transport/new",
            element: (
              <Lazy>
                <NewTransportCasePage />
              </Lazy>
            ),
          },
          {
            path: "transport/vehicles",
            element: (
              <Lazy>
                <TransportVehiclesPage />
              </Lazy>
            ),
          },
          {
            path: "transport/routes",
            element: (
              <Lazy>
                <TransportRoutesPage />
              </Lazy>
            ),
          },
          {
            path: "transport/suppliers",
            element: (
              <Lazy>
                <TransportSuppliersPage />
              </Lazy>
            ),
          },
          {
            path: "transport/reports",
            element: (
              <Lazy>
                <TransportReportsPage />
              </Lazy>
            ),
          },
          {
            path: "transport/:id",
            element: (
              <Lazy>
                <TransportCasePage />
              </Lazy>
            ),
          },
          {
            path: "tours",
            element: (
              <Lazy>
                <TourListPage />
              </Lazy>
            ),
          },
          {
            path: "tours/new",
            element: (
              <Lazy>
                <NewTourCasePage />
              </Lazy>
            ),
          },
          {
            path: "tours/packages",
            element: (
              <Lazy>
                <TourPackagesPage />
              </Lazy>
            ),
          },
          {
            path: "tours/departures",
            element: (
              <Lazy>
                <TourDeparturesPage />
              </Lazy>
            ),
          },
          {
            path: "tours/destinations",
            element: (
              <Lazy>
                <TourDestinationsPage />
              </Lazy>
            ),
          },
          {
            path: "tours/reports",
            element: (
              <Lazy>
                <TourReportsPage />
              </Lazy>
            ),
          },
          {
            path: "tours/:id",
            element: (
              <Lazy>
                <TourCasePage />
              </Lazy>
            ),
          },
          {
            path: "hajj",
            element: (
              <Lazy>
                <HajjListPage />
              </Lazy>
            ),
          },
          {
            path: "hajj/new",
            element: (
              <Lazy>
                <NewHajjCasePage />
              </Lazy>
            ),
          },
          {
            path: "hajj/packages",
            element: (
              <Lazy>
                <HajjPackagesPage />
              </Lazy>
            ),
          },
          {
            path: "hajj/pilgrims",
            element: (
              <Lazy>
                <HajjPilgrimsPage />
              </Lazy>
            ),
          },
          {
            path: "hajj/groups",
            element: (
              <Lazy>
                <HajjGroupsPage />
              </Lazy>
            ),
          },
          {
            path: "hajj/reports",
            element: (
              <Lazy>
                <HajjReportsPage />
              </Lazy>
            ),
          },
          {
            path: "hajj/:id",
            element: (
              <Lazy>
                <HajjCasePage />
              </Lazy>
            ),
          },
          {
            path: "finance",
            element: (
              <Lazy>
                <FinanceAccountsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/groups",
            element: (
              <Lazy>
                <FinanceGroupsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/periods",
            element: (
              <Lazy>
                <FinancePeriodsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/cost-centers",
            element: (
              <Lazy>
                <FinanceCostCentersPage />
              </Lazy>
            ),
          },
          {
            path: "finance/currencies",
            element: (
              <Lazy>
                <FinanceCurrenciesPage />
              </Lazy>
            ),
          },
          {
            path: "finance/journals",
            element: (
              <Lazy>
                <FinanceJournalsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/journals/:id",
            element: (
              <Lazy>
                <FinanceJournalDetailPage />
              </Lazy>
            ),
          },
          {
            path: "finance/reports",
            element: (
              <Lazy>
                <FinanceReportsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ar",
            element: (
              <Lazy>
                <FinanceArPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ar/:id",
            element: (
              <Lazy>
                <FinanceArDetailPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ap",
            element: (
              <Lazy>
                <FinanceApPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ap/:id",
            element: (
              <Lazy>
                <FinanceApDetailPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ar-ap-reports",
            element: (
              <Lazy>
                <FinanceArApReportsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/banking",
            element: (
              <Lazy>
                <FinanceBankingPage />
              </Lazy>
            ),
          },
          {
            path: "finance/banking/movements",
            element: (
              <Lazy>
                <FinanceBankMovementsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/banking/cheques",
            element: (
              <Lazy>
                <FinanceChequesPage />
              </Lazy>
            ),
          },
          {
            path: "finance/banking/reconciliation",
            element: (
              <Lazy>
                <FinanceReconciliationPage />
              </Lazy>
            ),
          },
          {
            path: "finance/banking/reports",
            element: (
              <Lazy>
                <FinanceBankingReportsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/statements",
            element: (
              <Lazy>
                <FinanceStatementsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/ledger",
            element: (
              <Lazy>
                <FinanceLedgerPage />
              </Lazy>
            ),
          },
          {
            path: "finance/analysis",
            element: (
              <Lazy>
                <FinanceAnalysisPage />
              </Lazy>
            ),
          },
          {
            path: "finance/closing",
            element: (
              <Lazy>
                <FinanceClosingPage />
              </Lazy>
            ),
          },
          {
            path: "crm",
            element: (
              <Lazy>
                <CrmLeadsPage />
              </Lazy>
            ),
          },
          {
            path: "crm/contacts",
            element: (
              <Lazy>
                <CrmContactsPage />
              </Lazy>
            ),
          },
          {
            path: "crm/organizations",
            element: (
              <Lazy>
                <CrmOrganizationsPage />
              </Lazy>
            ),
          },
          {
            path: "crm/opportunities",
            element: (
              <Lazy>
                <CrmOpportunitiesPage />
              </Lazy>
            ),
          },
          {
            path: "crm/activities",
            element: (
              <Lazy>
                <CrmActivitiesPage />
              </Lazy>
            ),
          },
          {
            path: "crm/quotations",
            element: (
              <Lazy>
                <CrmQuotationsPage />
              </Lazy>
            ),
          },
          {
            path: "crm/reports",
            element: (
              <Lazy>
                <CrmReportsPage />
              </Lazy>
            ),
          },
          {
            path: "sales",
            element: (
              <Lazy>
                <SalesPipelinePage />
              </Lazy>
            ),
          },
          {
            path: "sales/quotations",
            element: (
              <Lazy>
                <SalesQuotationsPage />
              </Lazy>
            ),
          },
          {
            path: "sales/pricing",
            element: (
              <Lazy>
                <SalesPricingPage />
              </Lazy>
            ),
          },
          {
            path: "sales/tasks",
            element: (
              <Lazy>
                <SalesTasksPage />
              </Lazy>
            ),
          },
          {
            path: "sales/reports",
            element: (
              <Lazy>
                <SalesReportsPage />
              </Lazy>
            ),
          },
          {
            path: "comms",
            element: (
              <Lazy>
                <CommsTimelinePage />
              </Lazy>
            ),
          },
          {
            path: "comms/email",
            element: (
              <Lazy>
                <CommsEmailPage />
              </Lazy>
            ),
          },
          {
            path: "comms/whatsapp",
            element: (
              <Lazy>
                <CommsWhatsAppPage />
              </Lazy>
            ),
          },
          {
            path: "comms/sms",
            element: (
              <Lazy>
                <CommsSmsPage />
              </Lazy>
            ),
          },
          {
            path: "comms/activities",
            element: (
              <Lazy>
                <CommsActivitiesPage />
              </Lazy>
            ),
          },
          {
            path: "comms/reports",
            element: (
              <Lazy>
                <CommsReportsPage />
              </Lazy>
            ),
          },
          {
            path: "analytics",
            element: (
              <Lazy>
                <AnalyticsExecutivePage />
              </Lazy>
            ),
          },
          {
            path: "analytics/customers",
            element: (
              <Lazy>
                <AnalyticsCustomersPage />
              </Lazy>
            ),
          },
          {
            path: "analytics/sales",
            element: (
              <Lazy>
                <AnalyticsSalesPage />
              </Lazy>
            ),
          },
          {
            path: "analytics/comms",
            element: (
              <Lazy>
                <AnalyticsCommsPage />
              </Lazy>
            ),
          },
          {
            path: "analytics/finance",
            element: (
              <Lazy>
                <AnalyticsFinancePage />
              </Lazy>
            ),
          },
          {
            path: "analytics/reports",
            element: (
              <Lazy>
                <AnalyticsReportsPage />
              </Lazy>
            ),
          },
          {
            path: "cms",
            element: (
              <Lazy>
                <CmsPagesPage />
              </Lazy>
            ),
          },
          {
            path: "cms/menus",
            element: (
              <Lazy>
                <CmsMenusPage />
              </Lazy>
            ),
          },
          {
            path: "cms/media",
            element: (
              <Lazy>
                <CmsMediaPage />
              </Lazy>
            ),
          },
          {
            path: "cms/banners",
            element: (
              <Lazy>
                <CmsBannersPage />
              </Lazy>
            ),
          },
          {
            path: "cms/content",
            element: (
              <Lazy>
                <CmsContentPage />
              </Lazy>
            ),
          },
          {
            path: "cms/travel",
            element: (
              <Lazy>
                <CmsTravelPage />
              </Lazy>
            ),
          },
          {
            path: "cms/forms",
            element: (
              <Lazy>
                <CmsFormsPage />
              </Lazy>
            ),
          },
          {
            path: "cms/seo",
            element: (
              <Lazy>
                <CmsSeoPage />
              </Lazy>
            ),
          },
          {
            path: "cms/reports",
            element: (
              <Lazy>
                <CmsReportsPage />
              </Lazy>
            ),
          },
          {
            path: "passports",
            element: (
              <Lazy>
                <PassportsPage />
              </Lazy>
            ),
          },
          {
            path: "case-journey",
            element: (
              <Lazy>
                <CaseJourneyPage />
              </Lazy>
            ),
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
