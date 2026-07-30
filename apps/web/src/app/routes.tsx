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
    children: [
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <AdminLayout />,
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
