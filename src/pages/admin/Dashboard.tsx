import { PortalLayout } from "@/components/PortalLayout";
import { Users, Briefcase, TrendingUp, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Admin Dashboard</h1>
        <p className="mt-1 text-portal-text-muted">Studio overview and management.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Users, label: "Total Clients", value: "0", color: "text-blue-400" },
          { icon: Briefcase, label: "Active Projects", value: "0", color: "text-purple-400" },
          { icon: TrendingUp, label: "New Leads", value: "0", color: "text-green-400" },
          { icon: DollarSign, label: "Revenue (mo)", value: "$0", color: "text-yellow-400" },
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Recent Activity</h2>
          <p className="text-sm text-portal-text-muted">No activity yet.</p>
        </div>
        <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
          <h2 className="font-display text-lg font-semibold text-portal-text mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {["Add Client", "Create Project", "Upload Files", "View Reports"].map((action) => (
              <button key={action} className="w-full rounded-lg px-3 py-2 text-left text-sm text-portal-text hover:bg-portal-surface-hover transition-colors">
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
