import { PortalLayout } from "@/components/PortalLayout";
import { useParams } from "react-router-dom";

export default function ClientProjectDetail() {
  const { id } = useParams();
  return (
    <PortalLayout variant="client">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Project #{id}</h1>
        <p className="mt-1 text-portal-text-muted">Project details and files.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <p className="text-portal-text-muted text-sm">Project details will appear here.</p>
      </div>
    </PortalLayout>
  );
}
