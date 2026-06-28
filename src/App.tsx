import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CommandPalette } from "@/components/CommandPalette";
import { usePageTracking } from "@/hooks/usePageTracking";
import { BackToTop } from "@/components/BackToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy-loaded pages for code splitting
type LazyModule = { default: React.ComponentType<Record<string, unknown>> };
const lazyRetry = <T extends LazyModule>(fn: () => Promise<T>) =>
  lazy<React.ComponentType<Record<string, unknown>>>(() =>
    fn().catch(() => {
      // Force reload on chunk load failure (stale deploy)
      window.location.reload();
      return new Promise<T>(() => {});
    }),
  );

const Home = lazyRetry(() => import("./pages/public/Home"));
const Portfolio = lazyRetry(() => import("./pages/public/Portfolio"));
const PortfolioDetail = lazyRetry(() => import("./pages/public/PortfolioDetail"));
const Services = lazyRetry(() => import("./pages/public/Services"));
const About = lazyRetry(() => import("./pages/public/About"));
const Contact = lazyRetry(() => import("./pages/public/Contact"));

const Login = lazyRetry(() => import("./pages/auth/Login"));
const Register = lazyRetry(() => import("./pages/auth/Register"));

const AdminDashboard = lazyRetry(() => import("./pages/admin/Dashboard"));
const AdminProjects = lazyRetry(() => import("./pages/admin/Projects"));
const AdminProjectDetail = lazyRetry(() => import("./pages/admin/ProjectDetail"));
const AdminClients = lazyRetry(() => import("./pages/admin/Clients"));
const AdminLeads = lazyRetry(() => import("./pages/admin/Leads"));
const AdminDeliverables = lazyRetry(() => import("./pages/admin/Deliverables"));
const AdminQuotes = lazyRetry(() => import("./pages/admin/Quotes"));
const AdminInvoices = lazyRetry(() => import("./pages/admin/Invoices"));
const AdminFiles = lazyRetry(() => import("./pages/admin/Files"));
const AdminPortfolio = lazyRetry(() => import("./pages/admin/Projects"));
const AdminPortfolioEditor = lazyRetry(() => import("./pages/admin/PortfolioEditor"));
const AdminTeam = lazyRetry(() => import("./pages/admin/Team"));
const AdminSettings = lazyRetry(() => import("./pages/admin/AdminSettings"));
const AdminSiteContent = lazyRetry(() => import("./pages/admin/SiteContent"));
const AdminAuditLogs = lazyRetry(() => import("./pages/admin/AuditLogs"));
const AdminAnalytics = lazyRetry(() => import("./pages/admin/Analytics"));
const AdminActivityTimeline = lazyRetry(() => import("./pages/admin/ActivityTimeline"));

const StaffDashboard = lazyRetry(() => import("./pages/staff/Dashboard"));
const StaffProjects = lazyRetry(() => import("./pages/staff/Projects"));
const StaffProjectDetail = lazyRetry(() => import("./pages/staff/ProjectDetail"));

const ClientDashboard = lazyRetry(() => import("./pages/client/Dashboard"));
const ClientProjects = lazyRetry(() => import("./pages/client/Projects"));
const ClientProjectDetail = lazyRetry(() => import("./pages/client/ProjectDetail"));
const ClientProfile = lazyRetry(() => import("./pages/client/Profile"));

const NotificationsPage = lazyRetry(() => import("./pages/shared/NotificationsPage"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const NotAuthorized = lazyRetry(() => import("./pages/NotAuthorized"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible defaults: less refetch thrash, retry once on transient failures.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

function AppRoutes() {
  usePageTracking();
  return null;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <LanguageProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BackToTop />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <CommandPalette />
        <AppRoutes />
        <Suspense fallback={<PageLoader />}>
        <main>
        <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Navigate to="/portfolio" replace />} />
          <Route path="/projects/:id" element={<Navigate to="/portfolio" replace />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/portfolio/:slug" element={<PortfolioDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Navigate to="/" replace />} />
          <Route path="/blog/:slug" element={<Navigate to="/" replace />} />



          {/* Auth routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Admin routes */}
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
          <Route path="/admin/site-content" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminSiteContent /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["ADMIN"]}><NotificationsPage variant="admin" /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/activity" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminActivityTimeline /></ProtectedRoute>} />

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
        </ErrorBoundary>
        </main>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </LanguageProvider>
  </ThemeProvider>
);

export default App;
