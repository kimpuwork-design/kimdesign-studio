import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Home from "./pages/public/Home";
import Portfolio from "./pages/public/Portfolio";
import PortfolioDetail from "./pages/public/PortfolioDetail";
import Services from "./pages/public/Services";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Client pages
import ClientDashboard from "./pages/client/Dashboard";
import ClientProfile from "./pages/client/Profile";
import ClientProjects from "./pages/client/Projects";
import ClientProjectDetail from "./pages/client/ProjectDetail";

// Staff pages
import StaffDashboard from "./pages/staff/Dashboard";
import StaffProjects from "./pages/staff/Projects";
import StaffProjectDetail from "./pages/staff/ProjectDetail";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminClients from "./pages/admin/Clients";
import AdminProjects from "./pages/admin/Projects";
import AdminProjectDetail from "./pages/admin/ProjectDetail";
import AdminFiles from "./pages/admin/Files";
import AdminPortfolio from "./pages/admin/Portfolio";
import AdminPortfolioEditor from "./pages/admin/PortfolioEditor";
import AdminTeam from "./pages/admin/Team";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminDeliverables from "./pages/admin/Deliverables";

// Shared
import NotificationsPage from "./pages/shared/NotificationsPage";

// Misc
import NotAuthorized from "./pages/NotAuthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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

            {/* Client portal */}
            <Route path="/app" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProfile /></ProtectedRoute>} />
            <Route path="/app/projects" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProjects /></ProtectedRoute>} />
            <Route path="/app/projects/:id" element={<ProtectedRoute allowedRoles={["CLIENT"]}><ClientProjectDetail /></ProtectedRoute>} />
            <Route path="/app/notifications" element={<ProtectedRoute allowedRoles={["CLIENT"]}><NotificationsPage variant="client" /></ProtectedRoute>} />

            {/* Staff portal */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/projects" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffProjects /></ProtectedRoute>} />
            <Route path="/staff/projects/:id" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffProjectDetail /></ProtectedRoute>} />
            <Route path="/staff/notifications" element={<ProtectedRoute allowedRoles={["STAFF"]}><NotificationsPage variant="staff" /></ProtectedRoute>} />

            {/* Admin portal */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminLeads /></ProtectedRoute>} />
            <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminClients /></ProtectedRoute>} />
            <Route path="/admin/projects" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminProjects /></ProtectedRoute>} />
            <Route path="/admin/projects/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminProjectDetail /></ProtectedRoute>} />
            <Route path="/admin/files" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminFiles /></ProtectedRoute>} />
            <Route path="/admin/portfolio" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPortfolio /></ProtectedRoute>} />
            <Route path="/admin/portfolio/:id" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminPortfolioEditor /></ProtectedRoute>} />
            <Route path="/admin/team" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminTeam /></ProtectedRoute>} />
             <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["ADMIN"]}><NotificationsPage variant="admin" /></ProtectedRoute>} />
             <Route path="/admin/deliverables" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDeliverables /></ProtectedRoute>} />
             <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminAuditLogs /></ProtectedRoute>} />

            {/* Error pages */}
            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
