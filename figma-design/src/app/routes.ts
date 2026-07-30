import { createBrowserRouter } from "react-router";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Visa from "../pages/Visa";
import Flights from "../pages/Flights";
import Tours from "../pages/Tours";
import TourDetail from "../pages/TourDetail";
import Blog from "../pages/Blog";
import BlogArticle from "../pages/BlogArticle";
import Inquiry from "../pages/Inquiry";
import Payment from "../pages/Payment";
import Contact from "../pages/Contact";
import PortalLayout from "../portal/PortalLayout";
import Login from "../portal/Login";
import Dashboard from "../portal/Dashboard";
import Apply from "../portal/Apply";
import Documents from "../portal/Documents";
import Track from "../portal/Track";
import PortalPayment from "../portal/PortalPayment";
import Invoice from "../portal/Invoice";
import Support from "../portal/Support";
import CorporateLayout from "../corporate/CorporateLayout";
import CorpDashboard from "../corporate/Dashboard";
import Employees from "../corporate/Employees";
import Applications from "../corporate/Applications";
import Approvals from "../corporate/Approvals";
import Credit from "../corporate/Credit";
import Reports from "../corporate/Reports";
import AgentLayout from "../agent/AgentLayout";
import AgentDashboard from "../agent/AgentDashboard";
import Profile from "../agent/Profile";
import Wallet from "../agent/Wallet";
import Passengers from "../agent/Passengers";
import Bookings from "../agent/Bookings";
import BookingsList from "../agent/BookingsList";
import AgentLedger from "../agent/AgentLedger";
import Commission from "../agent/Commission";
import Downloads from "../agent/Downloads";
import SupplierLayout from "../supplier/SupplierLayout";
import SupplierDashboard from "../supplier/SupplierDashboard";
import Requests from "../supplier/Requests";
import SupplierServices from "../supplier/Services";
import SupplierInvoices from "../supplier/SupplierInvoices";
import SupplierPayments from "../supplier/Payments";
import Performance from "../supplier/Performance";
import Contracts from "../supplier/Contracts";
import AdminLayout from "../admin/AdminLayout";
import AdminDashboard from "../admin/AdminDashboard";
import AdminPlaceholder from "../admin/AdminPlaceholder";
import CRMModule from "../admin/crm/CRMModule";
import CustomerModule from "../admin/customers/CustomerModule";
import PassportModule from "../admin/passports/PassportModule";
import VisaModule from "../admin/visa/VisaModule";
import TicketingModule from "../admin/ticketing/TicketingModule";
import HotelsModule from "../admin/hotels/HotelsModule";
import TransportModule from "../admin/transport/TransportModule";
import ToursModule from "../admin/tours/ToursModule";
import HajjModule from "../admin/hajj/HajjModule";
import StudentModule from "../admin/student/StudentModule";
import MedicalModule from "../admin/medical/MedicalModule";
import ImmigrationModule from "../admin/immigration/ImmigrationModule";
import InsuranceModule from "../admin/insurance/InsuranceModule";
import CorporateClientsModule from "../admin/corporate-clients/CorporateClientsModule";
import SuppliersModule from "../admin/suppliers/SuppliersModule";
import AccountingModule from "../admin/accounting/AccountingModule";
import WalletCommissionModule from "../admin/wallet/WalletCommissionModule";
import HRModule from "../admin/hr/HRModule";
import TaskWorkflowModule from "../admin/tasks/TaskWorkflowModule";
import CMSModule from "../admin/cms/CMSModule";
import NotificationModule from "../admin/notifications/NotificationModule";
import DownloadsModule from "../admin/downloads/DownloadsModule";
import SettingsModule from "../admin/settings/SettingsModule";
import CaseJourneyModule from "../admin/case-journey/CaseJourneyModule";
import TabletShowcase from "../admin/tablet-showcase/TabletShowcase";
import ProjectOverview from "../admin/project-overview/ProjectOverview";
import PWAShowcase from "../admin/pwa/PWAShowcase";
import MobileShowcase from "../mobile/MobileShowcase";
import StaffLayout from "../staff/StaffLayout";
import MyDashboard from "../staff/MyDashboard";
import AssignedTasks from "../staff/AssignedTasks";
import StaffApplications from "../staff/Applications";
import StaffCustomers from "../staff/Customers";
import StaffCalendar from "../staff/StaffCalendar";
import InternalChat from "../staff/InternalChat";
import StaffDocuments from "../staff/StaffDocuments";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "services", Component: Services },
      { path: "visa", Component: Visa },
      { path: "flights", Component: Flights },
      { path: "tours", Component: Tours },
      { path: "tours/:id", Component: TourDetail },
      { path: "blog", Component: Blog },
      { path: "blog/:slug", Component: BlogArticle },
      { path: "inquiry", Component: Inquiry },
      { path: "payment", Component: Payment },
      { path: "contact", Component: Contact },
    ],
  },
  {
    path: "/portal",
    children: [
      { path: "login", Component: Login },
      {
        Component: PortalLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "dashboard", Component: Dashboard },
          { path: "apply", Component: Apply },
          { path: "documents", Component: Documents },
          { path: "track/:id", Component: Track },
          { path: "payment/:id", Component: PortalPayment },
          { path: "invoice/:id", Component: Invoice },
          { path: "support", Component: Support },
        ],
      },
    ],
  },
  {
    path: "/corporate",
    children: [
      {
        Component: CorporateLayout,
        children: [
          { index: true, Component: CorpDashboard },
          { path: "dashboard", Component: CorpDashboard },
          { path: "employees", Component: Employees },
          { path: "applications", Component: Applications },
          { path: "approvals", Component: Approvals },
          { path: "credit", Component: Credit },
          { path: "reports", Component: Reports },
        ],
      },
    ],
  },
  {
    path: "/agent",
    children: [
      {
        Component: AgentLayout,
        children: [
          { index: true, Component: AgentDashboard },
          { path: "profile",    Component: Profile    },
          { path: "wallet",     Component: Wallet     },
          { path: "passengers", Component: Passengers },
          { path: "book",       Component: Bookings   },
          { path: "bookings",   Component: BookingsList },
          { path: "ledger",     Component: AgentLedger },
          { path: "commission", Component: Commission  },
          { path: "downloads",  Component: Downloads   },
        ],
      },
    ],
  },
  {
    path: "/supplier",
    children: [
      {
        Component: SupplierLayout,
        children: [
          { index: true,              Component: SupplierDashboard },
          { path: "requests",         Component: Requests          },
          { path: "services",         Component: SupplierServices  },
          { path: "invoices",         Component: SupplierInvoices  },
          { path: "payments",         Component: SupplierPayments  },
          { path: "performance",      Component: Performance       },
          { path: "contracts",        Component: Contracts         },
        ],
      },
    ],
  },
  {
    path: "/admin",
    children: [{
      Component: AdminLayout,
      children: [
        { index: true,          Component: AdminDashboard   },
        { path: "crm",          Component: CRMModule        },
        { path: "customers",    Component: CustomerModule   },
        { path: "passports",    Component: PassportModule   },
        { path: "visa",         Component: VisaModule       },
        { path: "ticketing",    Component: TicketingModule  },
        { path: "hotels",       Component: HotelsModule     },
        { path: "transport",    Component: TransportModule  },
        { path: "tours",        Component: ToursModule      },
        { path: "hajj",         Component: HajjModule       },
        { path: "student",      Component: StudentModule     },
        { path: "medical",      Component: MedicalModule         },
        { path: "immigration",  Component: ImmigrationModule     },
        { path: "insurance",    Component: InsuranceModule        },
        { path: "corporate",    Component: CorporateClientsModule },
        { path: "suppliers",    Component: SuppliersModule          },
        { path: "finance",      Component: AccountingModule         },
        { path: "wallet",       Component: WalletCommissionModule   },
        { path: "hr",            Component: HRModule                 },
        { path: "tasks",         Component: TaskWorkflowModule       },
        { path: "cms",           Component: CMSModule                },
        { path: "notifications", Component: NotificationModule       },
        { path: "downloads",     Component: DownloadsModule          },
        { path: "settings",      Component: SettingsModule            },
        { path: "case-journey",  Component: CaseJourneyModule         },
        { path: "tablet",        Component: TabletShowcase             },
        { path: "overview",      Component: ProjectOverview            },
        { path: "pwa",           Component: PWAShowcase                },
        { path: "*",             Component: AdminPlaceholder          },
      ],
    }],
  },
  {
    path: "/mobile",
    Component: MobileShowcase,
  },
  {
    path: "/staff",
    children: [
      {
        Component: StaffLayout,
        children: [
          { index: true,          Component: MyDashboard      },
          { path: "tasks",        Component: AssignedTasks    },
          { path: "apps",         Component: StaffApplications},
          { path: "customers",    Component: StaffCustomers   },
          { path: "calendar",     Component: StaffCalendar    },
          { path: "chat",         Component: InternalChat     },
          { path: "docs",         Component: StaffDocuments   },
        ],
      },
    ],
  },
]);
