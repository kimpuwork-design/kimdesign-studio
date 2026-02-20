import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Clock, Users } from "lucide-react";

export default function StaffDashboard() {
  const { profile } = useAuth();
  return (
    <PortalLayout variant="staff">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">
          Staff Dashboard
        </h1>
        <p className="mt-1 text-portal-text-muted">Welcome back, {profile?.full_name?.split(" ")[0]}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { icon: Briefcase, label: "Assigned Projects", value: "0", color: "text-blue-400" },
          { icon: Clock, label: "In Progress", value: "0", color: "text-yellow-400" },
          { icon: Users, label: "Active Clients", value: "0", color: "text-green-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-portal-border bg-portal-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-portal-text-muted">{s.label}</span>
                <Icon size={16} className={s.color} />
              </div>
              <p className="font-display text-3xl font-bold text-portal-text">{s.value}</p>
            </div>
          );
        })}
      </div>
    </PortalLayout>
  );
}
