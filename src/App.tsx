import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("./pages/public/Home"));
const Portfolio = lazy(() => import("./pages/public/Portfolio"));
const PortfolioDetail = lazy(() => import("./pages/public/PortfolioDetail"));
const Services = lazy(() => import("./pages/public/Services"));
const About = lazy(() => import("./pages/public/About"));
const Contact = lazy(() => import("./pages/public/Contact"));

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminProjectDetail = lazy(() => import("./pages/admin/ProjectDetail"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminLeads = lazy(() => import("./pages/admin/Leads"));
const AdminDeliverables = lazy(() => import("./pages/admin/Deliverables"));
const AdminQuotes = lazy(() => import("./pages/admin/Quotes"));
const AdminInvoices = lazy(() => import("./pages/admin/Invoices"));
const AdminFiles = lazy(() => import("./pages/admin/Files"));
const AdminPortfolio = lazy(() => import("./pages/admin/Portfolio"));
const AdminPortfolioEditor = lazy(() => import("./pages/admin/PortfolioEditor"));
const AdminTeam = lazy(() => import("./pages/admin/Team"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));

const StaffDashboard = lazy(() => import("./pages/staff/Dashboard"));
const StaffProjects = lazy(() => import("./pages/staff/Projects"));
const StaffProjectDetail = lazy(() => import("./pages/staff/ProjectDetail"));

const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientProjects = lazy(() => import("./pages/client/Projects"));
const ClientProjectDetail = lazy(() => import("./pages/client/ProjectDetail"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));

const NotificationsPage = lazy(() => import("./pages/shared/NotificationsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NotAuthorized = lazy(() => import("./pages/NotAuthorized"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<PortfolioDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Admin routes */}
          <Route path="/ares" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminProjects /></ProtectedRoute>} />
          <Route path="/admin/projects/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminProjectDetail /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminClients /></ProtectedRoute>} />
          <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminLeads /></ProtectedRoute>} />
          <Route path="/admin/deliverables" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDeliverables /></ProtectedRoute>} />
          <Route path="/admin/quotes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminQuotes /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminInvoices /></ProtectedRoute>} />
          <Route path="/admin/files" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminFiles /></ProtectedRoute>} />
          <Route path="/admin/portfolio" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPortfolio /></ProtectedRoute>} />
          <Route path="/admin/portfolio/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPortfolioEditor /></ProtectedRoute>} />
          <Route path="/admin/team" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminTeam /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["ADMIN"]}><NotificationsPage variant="admin" /></ProtectedRoute>} />

          {/* Staff routes */}
          <Route path="/staff" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/projects" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffProjects /></ProtectedRoute>} />
          <Route path="/staff/projects/:id" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffProjectDetail /></ProtectedRoute>} />
          <Route path="/staff/notifications" element={<ProtectedRoute allowedRoles={["STAFF"]}><NotificationsPage variant="staff" /></ProtectedRoute>} />

          {/* Client routes */}
          <Route path="/app" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/app/projects" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProjects /></ProtectedRoute>} />
          <Route path="/app/projects/:id" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProjectDetail /></ProtectedRoute>} />
          <Route path="/app/profile" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProfile /></ProtectedRoute>} />
          <Route path="/app/notifications" element={<ProtectedRoute allowedRoles={["CLIENT"]}><NotificationsPage variant="client" /></ProtectedRoute>} />

          {/* Misc */}
          <Route path="/not-authorized" element={<NotAuthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
