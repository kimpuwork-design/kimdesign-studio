import { PortalLayout } from "@/components/PortalLayout";
import { useAuth } from "@/contexts/AuthContext";
import { FolderOpen, Clock, CheckCircle } from "lucide-react";

export default function ClientDashboard() {
  const { profile } = useAuth();

  return (
    <PortalLayout variant="client">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">
          Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-portal-text-muted">Here's what's happening with your projects.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[
          { icon: FolderOpen, label: "Active Projects", value: "0", color: "text-blue-400" },
          { icon: Clock, label: "Pending Review", value: "0", color: "text-yellow-400" },
          { icon: CheckCircle, label: "Completed", value: "0", color: "text-green-400" },
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

      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Recent Projects</h2>
        <div className="flex flex-col items-center justify-center py-12 text-portal-text-muted">
          <FolderOpen size={40} className="mb-3 opacity-30" />
          <p className="text-sm">No projects yet. Your studio will add one soon.</p>
        </div>
      </div>
    </PortalLayout>
  );
}
