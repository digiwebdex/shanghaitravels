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
const CmsHeroServicesPage = lazy(() => import("@/pages/CmsHeroServicesPage"));
const CmsContentPage = lazy(() => import("@/pages/CmsContentPage"));
const CmsTravelPage = lazy(() => import("@/pages/CmsTravelPage"));
const CmsFormsPage = lazy(() => import("@/pages/CmsFormsPage"));
const CmsSeoPage = lazy(() => import("@/pages/CmsSeoPage"));
const CmsReportsPage = lazy(() => import("@/pages/CmsReportsPage"));
const CmsPackagesPage = lazy(() => import("@/pages/CmsPackagesPage"));
const CmsDestinationsPage = lazy(() => import("@/pages/CmsDestinationsPage"));
const PackagesListPage = lazy(() => import("@/pages/PackagesListPage"));
const DestinationsListPage = lazy(() => import("@/pages/DestinationsListPage"));
const PackagesPricingPage = lazy(() => import("@/pages/PackagesPricingPage"));
const PackageCategoriesPage = lazy(() => import("@/pages/PackageCategoriesPage"));
const PackageAvailabilityPage = lazy(() => import("@/pages/PackageAvailabilityPage"));
const PackageGalleryPage = lazy(() => import("@/pages/PackageGalleryPage"));
const PackageReportsPage = lazy(() => import("@/pages/PackageReportsPage"));
const SuppliersPage = lazy(() => import("@/pages/SuppliersPage"));
const AgentsPage = lazy(() => import("@/pages/AgentsPage"));
const CorporateClientsPage = lazy(() => import("@/pages/CorporateClientsPage"));
const PartnersOverviewPage = lazy(() => import("@/pages/PartnersOverviewPage"));
const FinanceDashboardPage = lazy(() => import("@/pages/FinanceDashboardPage"));
const FinanceInvoicesPage = lazy(() => import("@/pages/FinanceInvoicesPage"));
const FinancePaymentsPage = lazy(() => import("@/pages/FinancePaymentsPage"));
const FinanceExpensesPage = lazy(() => import("@/pages/FinanceExpensesPage"));
const FinanceCashPage = lazy(() => import("@/pages/FinanceCashPage"));
const FinanceCustomerLedgerPage = lazy(() => import("@/pages/FinanceCustomerLedgerPage"));
const FinanceSupplierLedgerPage = lazy(() => import("@/pages/FinanceSupplierLedgerPage"));
const OperationsOverviewPage = lazy(() => import("@/pages/OperationsOverviewPage"));
const OperationsDocumentsPage = lazy(() => import("@/pages/OperationsDocumentsPage"));
const OperationsWorkflowPage = lazy(() => import("@/pages/OperationsWorkflowPage"));
const OperationsCalendarPage = lazy(() => import("@/pages/OperationsCalendarPage"));
const OperationsNotificationsPage = lazy(() => import("@/pages/OperationsNotificationsPage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const AdminSettingsPage = lazy(() => import("@/pages/AdminSettingsPage"));
const CmsTypedContentPage = lazy(() => import("@/pages/CmsTypedContentPage"));
const SoonPage = lazy(() => import("@/pages/SoonPage"));
const SiteHomePage = lazy(() => import("@/pages/SiteHomePage"));
const SiteDestinationsBrowsePage = lazy(() => import("@/pages/SiteDestinationsBrowsePage"));
const SiteDestinationDetailPage = lazy(() => import("@/pages/SiteDestinationDetailPage"));
const SitePackageDetailPage = lazy(() => import("@/pages/SitePackageDetailPage"));
const SitePackageBookPage = lazy(() => import("@/pages/SitePackageBookPage"));
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
const PortalCustomerPackagesPage = lazy(() => import("@/pages/portal/PortalCustomerPackagesPage"));
const PortalCustomerWishlistPage = lazy(() => import("@/pages/portal/PortalCustomerWishlistPage"));
const PortalCustomerPackageBookPage = lazy(() => import("@/pages/portal/PortalCustomerPackageBookPage"));
const PortalMyPackagesPage = lazy(() => import("@/pages/portal/PortalMyPackagesPage"));
const PortalPackageHistoryPage = lazy(() => import("@/pages/portal/PortalPackageHistoryPage"));
const AgentPortalLayout = lazy(() => import("@/layouts/AgentPortalLayout"));
const AgentLoginPage = lazy(() => import("@/pages/portal/agent/AgentLoginPage"));
const AgentForgotPage = lazy(() => import("@/pages/portal/agent/AgentForgotPage"));
const AgentRegisterPage = lazy(() => import("@/pages/portal/agent/AgentRegisterPage"));
const AgentDashboardPage = lazy(() => import("@/pages/portal/agent/AgentDashboardPage"));
const AgentBookingsPage = lazy(() => import("@/pages/portal/agent/AgentBookingsPage"));
const AgentBookingDetailPage = lazy(() => import("@/pages/portal/agent/AgentBookingDetailPage"));
const AgentCustomersPage = lazy(() => import("@/pages/portal/agent/AgentCustomersPage"));
const AgentCustomerDetailPage = lazy(() => import("@/pages/portal/agent/AgentCustomerDetailPage"));
const AgentFinancePage = lazy(() => import("@/pages/portal/agent/AgentFinancePage"));
const AgentDocumentsPage = lazy(() => import("@/pages/portal/agent/AgentDocumentsPage"));
const AgentCommunicationsPage = lazy(() => import("@/pages/portal/agent/AgentCommunicationsPage"));
const AgentReportsPage = lazy(() => import("@/pages/portal/agent/AgentReportsPage"));
const AgentPackagesBrowsePage = lazy(() => import("@/pages/portal/agent/AgentPackagesBrowsePage"));
const AgentPackageBookPage = lazy(() => import("@/pages/portal/agent/AgentPackageBookPage"));
const CorporatePortalLayout = lazy(() => import("@/layouts/CorporatePortalLayout"));
const CorporateLoginPage = lazy(() => import("@/pages/portal/corporate/CorporateLoginPage"));
const CorporateForgotPage = lazy(() => import("@/pages/portal/corporate/CorporateForgotPage"));
const CorporateDashboardPage = lazy(() => import("@/pages/portal/corporate/CorporateDashboardPage"));
const CorporateCompanyPage = lazy(() => import("@/pages/portal/corporate/CorporateCompanyPage"));
const CorporateEmployeesPage = lazy(() => import("@/pages/portal/corporate/CorporateEmployeesPage"));
const CorporateEmployeeDetailPage = lazy(() => import("@/pages/portal/corporate/CorporateEmployeeDetailPage"));
const CorporateRequestsPage = lazy(() => import("@/pages/portal/corporate/CorporateRequestsPage"));
const CorporateRequestDetailPage = lazy(() => import("@/pages/portal/corporate/CorporateRequestDetailPage"));
const CorporateApprovalsPage = lazy(() => import("@/pages/portal/corporate/CorporateApprovalsPage"));
const CorporateBookingsPage = lazy(() => import("@/pages/portal/corporate/CorporateBookingsPage"));
const CorporateBookingDetailPage = lazy(() => import("@/pages/portal/corporate/CorporateBookingDetailPage"));
const CorporateFinancePage = lazy(() => import("@/pages/portal/corporate/CorporateFinancePage"));
const CorporateCommunicationsPage = lazy(() => import("@/pages/portal/corporate/CorporateCommunicationsPage"));
const CorporateReportsPage = lazy(() => import("@/pages/portal/corporate/CorporateReportsPage"));
const CorporatePackagesBrowsePage = lazy(() => import("@/pages/portal/corporate/CorporatePackagesBrowsePage"));
const CorporatePackageRequestPage = lazy(() => import("@/pages/portal/corporate/CorporatePackageRequestPage"));

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
    path: "/site/destinations/:slug",
    element: (
      <Lazy>
        <SiteDestinationDetailPage />
      </Lazy>
    ),
  },
  {
    path: "/site/destinations",
    element: (
      <Lazy>
        <SiteDestinationsBrowsePage />
      </Lazy>
    ),
  },
  {
    path: "/site/packages/:slug/book",
    element: (
      <Lazy>
        <SitePackageBookPage />
      </Lazy>
    ),
  },
  {
    path: "/site/packages/:slug",
    element: (
      <Lazy>
        <SitePackageDetailPage />
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
      {
        path: "packages",
        element: (
          <Lazy>
            <PortalCustomerPackagesPage />
          </Lazy>
        ),
      },
      {
        path: "packages/wishlist",
        element: (
          <Lazy>
            <PortalCustomerWishlistPage />
          </Lazy>
        ),
      },
      {
        path: "packages/my",
        element: (
          <Lazy>
            <PortalMyPackagesPage />
          </Lazy>
        ),
      },
      {
        path: "packages/history",
        element: (
          <Lazy>
            <PortalPackageHistoryPage />
          </Lazy>
        ),
      },
      {
        path: "packages/:slug/book",
        element: (
          <Lazy>
            <PortalCustomerPackageBookPage />
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
    path: "/portal/agent/register",
    element: (
      <Lazy>
        <AgentRegisterPage />
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
      {
        path: "packages",
        element: (
          <Lazy>
            <AgentPackagesBrowsePage />
          </Lazy>
        ),
      },
      {
        path: "packages/:slug/book",
        element: (
          <Lazy>
            <AgentPackageBookPage />
          </Lazy>
        ),
      },
    ],
  },
  {
    path: "/portal/corporate/login",
    element: (
      <Lazy>
        <CorporateLoginPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/corporate/forgot",
    element: (
      <Lazy>
        <CorporateForgotPage />
      </Lazy>
    ),
  },
  {
    path: "/portal/corporate",
    element: (
      <Lazy>
        <CorporatePortalLayout />
      </Lazy>
    ),
    children: [
      {
        index: true,
        element: (
          <Lazy>
            <CorporateDashboardPage />
          </Lazy>
        ),
      },
      {
        path: "company",
        element: (
          <Lazy>
            <CorporateCompanyPage />
          </Lazy>
        ),
      },
      {
        path: "employees",
        element: (
          <Lazy>
            <CorporateEmployeesPage />
          </Lazy>
        ),
      },
      {
        path: "employees/:id",
        element: (
          <Lazy>
            <CorporateEmployeeDetailPage />
          </Lazy>
        ),
      },
      {
        path: "requests",
        element: (
          <Lazy>
            <CorporateRequestsPage />
          </Lazy>
        ),
      },
      {
        path: "requests/:id",
        element: (
          <Lazy>
            <CorporateRequestDetailPage />
          </Lazy>
        ),
      },
      {
        path: "approvals",
        element: (
          <Lazy>
            <CorporateApprovalsPage />
          </Lazy>
        ),
      },
      {
        path: "bookings",
        element: (
          <Lazy>
            <CorporateBookingsPage />
          </Lazy>
        ),
      },
      {
        path: "bookings/:id",
        element: (
          <Lazy>
            <CorporateBookingDetailPage />
          </Lazy>
        ),
      },
      {
        path: "finance",
        element: (
          <Lazy>
            <CorporateFinancePage />
          </Lazy>
        ),
      },
      {
        path: "communications",
        element: (
          <Lazy>
            <CorporateCommunicationsPage />
          </Lazy>
        ),
      },
      {
        path: "reports",
        element: (
          <Lazy>
            <CorporateReportsPage />
          </Lazy>
        ),
      },
      {
        path: "packages",
        element: (
          <Lazy>
            <CorporatePackagesBrowsePage />
          </Lazy>
        ),
      },
      {
        path: "packages/:slug/request",
        element: (
          <Lazy>
            <CorporatePackageRequestPage />
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
            path: "products/packages",
            element: (
              <Lazy>
                <PackagesListPage />
              </Lazy>
            ),
          },
          {
            path: "products/destinations",
            element: (
              <Lazy>
                <DestinationsListPage />
              </Lazy>
            ),
          },
          {
            path: "products/packages/pricing",
            element: (
              <Lazy>
                <PackagesPricingPage />
              </Lazy>
            ),
          },
          {
            path: "products/categories",
            element: (
              <Lazy>
                <PackageCategoriesPage />
              </Lazy>
            ),
          },
          {
            path: "products/availability",
            element: (
              <Lazy>
                <PackageAvailabilityPage />
              </Lazy>
            ),
          },
          {
            path: "products/gallery",
            element: (
              <Lazy>
                <PackageGalleryPage />
              </Lazy>
            ),
          },
          {
            path: "products/reports",
            element: (
              <Lazy>
                <PackageReportsPage />
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
            path: "cms/hero-services",
            element: (
              <Lazy>
                <CmsHeroServicesPage />
              </Lazy>
            ),
          },
          {
            path: "cms/packages",
            element: (
              <Lazy>
                <CmsPackagesPage />
              </Lazy>
            ),
          },
          {
            path: "cms/destinations",
            element: (
              <Lazy>
                <CmsDestinationsPage />
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
            path: "partners",
            element: (
              <Lazy>
                <PartnersOverviewPage />
              </Lazy>
            ),
          },
          {
            path: "partners/agents",
            element: (
              <Lazy>
                <AgentsPage />
              </Lazy>
            ),
          },
          {
            path: "partners/corporate",
            element: (
              <Lazy>
                <CorporateClientsPage />
              </Lazy>
            ),
          },
          {
            path: "partners/suppliers",
            element: (
              <Lazy>
                <SuppliersPage />
              </Lazy>
            ),
          },
          {
            path: "partners/suppliers/:type",
            element: (
              <Lazy>
                <SuppliersPage />
              </Lazy>
            ),
          },
          {
            path: "partners/settings",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "finance/dashboard",
            element: (
              <Lazy>
                <FinanceDashboardPage />
              </Lazy>
            ),
          },
          {
            path: "finance/invoices",
            element: (
              <Lazy>
                <FinanceInvoicesPage />
              </Lazy>
            ),
          },
          {
            path: "finance/payments",
            element: (
              <Lazy>
                <FinancePaymentsPage />
              </Lazy>
            ),
          },
          {
            path: "finance/expenses",
            element: (
              <Lazy>
                <FinanceExpensesPage />
              </Lazy>
            ),
          },
          {
            path: "finance/cash",
            element: (
              <Lazy>
                <FinanceCashPage />
              </Lazy>
            ),
          },
          {
            path: "finance/customer-ledger",
            element: (
              <Lazy>
                <FinanceCustomerLedgerPage />
              </Lazy>
            ),
          },
          {
            path: "finance/supplier-ledger",
            element: (
              <Lazy>
                <FinanceSupplierLedgerPage />
              </Lazy>
            ),
          },
          {
            path: "operations",
            element: (
              <Lazy>
                <OperationsOverviewPage />
              </Lazy>
            ),
          },
          {
            path: "operations/documents",
            element: (
              <Lazy>
                <OperationsDocumentsPage />
              </Lazy>
            ),
          },
          {
            path: "operations/workflow",
            element: (
              <Lazy>
                <OperationsWorkflowPage />
              </Lazy>
            ),
          },
          {
            path: "operations/calendar",
            element: (
              <Lazy>
                <OperationsCalendarPage />
              </Lazy>
            ),
          },
          {
            path: "operations/notifications",
            element: (
              <Lazy>
                <OperationsNotificationsPage />
              </Lazy>
            ),
          },
          {
            path: "admin/users",
            element: (
              <Lazy>
                <AdminUsersPage />
              </Lazy>
            ),
          },
          {
            path: "admin/settings",
            element: (
              <Lazy>
                <AdminSettingsPage />
              </Lazy>
            ),
          },
          {
            path: "admin/roles",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "admin/permissions",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "admin/audit",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "admin/api-keys",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "admin/integrations",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "cms/content/:type",
            element: (
              <Lazy>
                <CmsTypedContentPage />
              </Lazy>
            ),
          },
          {
            path: "crm/settings",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "comms/settings",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "ai",
            element: (
              <Lazy>
                <SoonPage />
              </Lazy>
            ),
          },
          {
            path: "ai/*",
            element: (
              <Lazy>
                <SoonPage />
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
