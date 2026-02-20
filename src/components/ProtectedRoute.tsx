import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "ADMIN" | "STAFF" | "CLIENT";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center portal-layout">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center portal-layout">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}
