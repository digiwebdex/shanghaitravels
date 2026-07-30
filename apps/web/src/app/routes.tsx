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
