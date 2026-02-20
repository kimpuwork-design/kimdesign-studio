import { PortalLayout } from "@/components/PortalLayout";
import { Briefcase } from "lucide-react";

export default function AdminProjects() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Projects</h1>
        <p className="mt-1 text-portal-text-muted">All studio projects.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <Briefcase size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No projects yet</p>
        </div>
      </div>
    </PortalLayout>
  );
}
