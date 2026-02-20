import { PortalLayout } from "@/components/PortalLayout";
import { FileArchive } from "lucide-react";

export default function AdminFiles() {
  return (
    <PortalLayout variant="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-portal-text">Files</h1>
        <p className="mt-1 text-portal-text-muted">File management and storage.</p>
      </div>
      <div className="rounded-xl border border-portal-border bg-portal-surface p-6">
        <div className="flex flex-col items-center justify-center py-16 text-portal-text-muted">
          <FileArchive size={48} className="mb-4 opacity-30" />
          <p className="font-medium text-portal-text">No files uploaded yet</p>
        </div>
      </div>
    </PortalLayout>
  );
}
