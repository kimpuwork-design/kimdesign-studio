import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/messages/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { FileList } from "@/components/files/FileList";
import { CalendarDays, MapPin, Users, ArrowLeft, FolderOpen, LayoutList, MessageSquare, PackageOpen, Receipt } from "lucide-react";
import { DeliverablesTab } from "@/components/deliverables/DeliverablesTab";
import { Button } from "@/components/ui/button";
import { BillingTab } from "@/components/billing/BillingTab";


interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
}

interface Member {
  id: string;
  member_role: string;
  profiles: { full_name: string | null } | null;
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "deliverables", label: "Deliverables", icon: PackageOpen },
  { id: "billing", label: "Billing", icon: Receipt },
];

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);

  const tab = (searchParams.get("tab") ?? "overview") as "overview" | "files" | "messages" | "deliverables" | "billing";
  const setTab = (t: string) => setSearchParams({ tab: t });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("project_members").select("id, member_role, profiles(full_name)").eq("project_id", id),
    ]).then(([{ data: proj, error }, { data: mems }]) => {
      if (error || !proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj as Project);
      setMembers((mems as unknown as Member[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <PortalLayout variant="client">
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
      </div>
    </PortalLayout>
  );

  if (notFound) return (
    <PortalLayout variant="client">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="font-display text-2xl font-bold text-portal-text">Project not found</h2>
        <p className="mt-2 text-portal-text-muted">This project doesn't exist or you don't have access.</p>
        <Button className="mt-6" onClick={() => navigate("/app/projects")}><ArrowLeft size={14} className="mr-2" />Back to Projects</Button>
      </div>
    </PortalLayout>
  );

  const staffMembers = members.filter((m) => m.member_role === "STAFF");

  return (
    <PortalLayout variant="client">
      <button onClick={() => navigate("/app/projects")} className="text-xs text-portal-text-muted hover:text-portal-text flex items-center gap-1 mb-4">
        <ArrowLeft size={13} /> Back to Projects
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="font-display text-3xl font-bold text-portal-text">{project!.title}</h1>
          {project!.description && (
            <p className="mt-2 text-portal-text-muted leading-relaxed text-sm max-w-2xl">{project!.description}</p>
          )}
        </div>
        <StatusBadge status={project!.status} className="shrink-0 mt-1" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-portal-border mb-6">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tabId ? "border-portal-accent text-portal-accent" : "border-transparent text-portal-text-muted hover:text-portal-text"
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project!.location && <InfoCard icon={<MapPin size={15} />} label="Location" value={project!.location} />}
            {project!.start_date && <InfoCard icon={<CalendarDays size={15} />} label="Start Date" value={new Date(project!.start_date).toLocaleDateString()} />}
            {project!.target_date && <InfoCard icon={<CalendarDays size={15} />} label="Target Date" value={new Date(project!.target_date).toLocaleDateString()} />}
          </div>
          {staffMembers.length > 0 && (
            <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
              <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-portal-text-muted" /><h2 className="font-semibold text-portal-text">Your Team</h2></div>
              <div className="space-y-2">
                {staffMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                      {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-portal-text">{m.profiles?.full_name ?? "Unnamed"}</span>
                    <span className="ml-auto text-xs text-portal-text-muted">Staff</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "files" && profile && (
        <div className="space-y-6">
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <h2 className="font-semibold text-portal-text mb-4 text-sm">Upload Files</h2>
            <FileUploadZone projectId={project!.id} uploaderId={profile.id} onUploaded={() => setFileRefreshKey((k) => k + 1)} />
          </div>
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <h2 className="font-semibold text-portal-text mb-4 text-sm">Project Files</h2>
            <FileList projectId={project!.id} currentUserId={profile.id} refreshKey={fileRefreshKey} />
          </div>
        </div>
      )}

      {tab === "messages" && profile && (
        <MessageThread projectId={project!.id} currentUserId={profile.id} currentUserRole="CLIENT" />
      )}

      {tab === "deliverables" && (
        <DeliverablesTab projectId={project!.id} role="CLIENT" />
      )}

      {tab === "billing" && (
        <BillingTab projectId={project!.id} role="CLIENT" />
      )}
    </PortalLayout>
  );
}


function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-portal-border bg-portal-surface p-4">
      <div className="flex items-center gap-2 mb-1 text-portal-text-muted">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-portal-text font-medium">{value}</p>
    </div>
  );
}
