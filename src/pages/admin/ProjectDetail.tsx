import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/messages/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { FileList } from "@/components/files/FileList";
import {
  CalendarDays, MapPin, Users, User, ArrowLeft,
  FolderOpen, LayoutList, MessageSquare, Pencil, PackageOpen, Receipt,
} from "lucide-react";
import { DeliverablesTab } from "@/components/deliverables/DeliverablesTab";
import { Button } from "@/components/ui/button";
import { ProjectFormModal } from "@/components/admin/ProjectFormModal";
import { StaffAssignModal } from "@/components/admin/StaffAssignModal";
import { BillingTab } from "@/components/billing/BillingTab";
import { QuoteModal } from "@/components/billing/QuoteModal";
import { InvoiceModal } from "@/components/billing/InvoiceModal";


interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  updated_at: string;
  is_public: boolean;
  profiles: { full_name: string | null; company: string | null } | null;
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

export default function AdminProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);


  const tab = (searchParams.get("tab") ?? "overview") as "overview" | "files" | "messages" | "deliverables" | "billing";
  const setTab = (t: string) => setSearchParams({ tab: t });

  const load = async () => {
    if (!id) return;
    const [{ data: proj, error }, { data: mems }] = await Promise.all([
      supabase.from("projects").select("*, profiles(full_name, company)").eq("id", id).single(),
      supabase.from("project_members").select("id, member_role, profiles(full_name)").eq("project_id", id),
    ]);
    if (error || !proj) { setNotFound(true); setLoading(false); return; }
    setProject(proj as unknown as Project);
    setMembers((mems as unknown as Member[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <PortalLayout variant="admin">
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
      </div>
    </PortalLayout>
  );

  if (notFound) return (
    <PortalLayout variant="admin">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="font-display text-2xl font-bold text-portal-text">Project not found</h2>
        <Button className="mt-6" onClick={() => navigate("/admin/projects")}><ArrowLeft size={14} className="mr-2" />Back</Button>
      </div>
    </PortalLayout>
  );

  return (
    <PortalLayout variant="admin">
      <button onClick={() => navigate("/admin/projects")} className="text-xs text-portal-text-muted hover:text-portal-text flex items-center gap-1 mb-5">
        <ArrowLeft size={13} /> Back to Projects
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-3xl font-bold text-portal-text">{project!.title}</h1>
          {project!.profiles && (
            <div className="flex items-center gap-2 mt-2 text-portal-text-muted">
              <User size={14} />
              <span className="text-sm">
                {project!.profiles.full_name}
                {project!.profiles.company && ` · ${project!.profiles.company}`}
              </span>
            </div>
          )}
          {project!.description && (
            <p className="mt-2 text-portal-text-muted leading-relaxed text-sm max-w-2xl">{project!.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={project!.status} />
          <Button size="sm" variant="outline" className="border-portal-border text-portal-text-muted"
            onClick={() => setShowEdit(true)}>
            <Pencil size={13} className="mr-1.5" />Edit
          </Button>
          <Button size="sm" variant="outline" className="border-portal-border text-portal-text-muted"
            onClick={() => setShowAssign(true)}>
            <Users size={13} className="mr-1.5" />Team
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-portal-border mb-6 mt-4">
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
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-portal-text-muted" />
              <h2 className="font-semibold text-portal-text">Project Team ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-portal-text-muted">No members assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg px-3 py-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                      {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-portal-text">{m.profiles?.full_name ?? "Unnamed"}</span>
                    <span className="ml-auto text-xs text-portal-text-muted capitalize">{m.member_role.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <MessageThread projectId={project!.id} currentUserId={profile.id} currentUserRole="ADMIN" />
      )}

      {tab === "deliverables" && (
        <DeliverablesTab projectId={project!.id} role="ADMIN" />
      )}

      {tab === "billing" && (
        <BillingTab
          projectId={project!.id}
          role="ADMIN"
          onCreateQuote={() => setShowQuote(true)}
          onCreateInvoice={() => setShowInvoice(true)}
        />
      )}



      {showEdit && (
        <ProjectFormModal
          editProject={project as any}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load(); }}
        />
      )}
      {showAssign && (
        <StaffAssignModal
          projectId={project!.id}
          projectTitle={project!.title}
          onClose={() => { setShowAssign(false); load(); }}
        />
      )}
      {showQuote && (
        <QuoteModal projectId={project!.id} onClose={() => setShowQuote(false)} onSaved={() => { setShowQuote(false); }} />
      )}
      {showInvoice && (
        <InvoiceModal projectId={project!.id} onClose={() => setShowInvoice(false)} onSaved={() => { setShowInvoice(false); }} />
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
