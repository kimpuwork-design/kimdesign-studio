import { PortalLayout } from "@/components/PortalLayout";
import { FolderOpen } from "lucide-react";

export default function ClientProjects() {
  return (
    <PortalLayout variant="client">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">My Projects</h1>
        <p className="mt-1 text-portal-text-muted">Track the progress of your work with us.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <FolderOpen size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No projects yet</p>
          <p className="mt-1 text-sm">Your studio will assign projects to you here.</p>
        </div>
      </div>
    </PortalLayout>
  );
}
