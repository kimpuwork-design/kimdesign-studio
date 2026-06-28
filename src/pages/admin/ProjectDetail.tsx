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
  FolderOpen, LayoutList, MessageSquare, Pencil, PackageOpen, Receipt, ImageIcon, Milestone, SplitSquareHorizontal,
} from "lucide-react";
import { DeliverablesTab } from "@/components/deliverables/DeliverablesTab";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { DrivePdfImporter } from "@/components/admin/DrivePdfImporter";
import { ProjectTimeline } from "@/components/admin/ProjectTimeline";
import { BeforeAfterSlider } from "@/components/media/BeforeAfterSlider";
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
  created_at: string;
  updated_at: string;
  is_public: boolean;
  thumbnail_url: string | null;
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
  { id: "gallery", label: "Gallery", icon: ImageIcon },
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


  const tab = (searchParams.get("tab") ?? "overview") as "overview" | "files" | "gallery" | "messages" | "deliverables" | "billing";
  const setTab = (t: string) => setSearchParams({ tab: t });

  const load = async () => {
    if (!id) return;
    const [{ data: proj, error }, { data: mems }] = await Promise.all([
      supabase.from("projects").select("*, profiles(full_name, company)").eq("id", id).maybeSingle(),
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

      {/* Hero thumbnail */}
      {project!.thumbnail_url && (
        <div className="relative w-full aspect-[2/1] md:aspect-[3/1] rounded-xl overflow-hidden mb-4 md:mb-5 border border-portal-border">
          <img src={project!.thumbnail_url} alt={project!.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-portal-bg/90 via-portal-bg/30 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-5 md:right-5">
            <h1 className="font-display text-xl md:text-3xl font-bold text-white drop-shadow-lg">{project!.title}</h1>
            {project!.profiles && (
              <div className="flex items-center gap-2 mt-1 md:mt-1.5 text-white/70">
                <User size={12} className="md:w-[14px] md:h-[14px]" />
                <span className="text-xs md:text-sm">
                  {project!.profiles.full_name}
                  {project!.profiles.company && ` · ${project!.profiles.company}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header (no thumbnail fallback) */}
      {!project!.thumbnail_url && (
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl md:text-3xl font-bold text-portal-text truncate">{project!.title}</h1>
            {project!.profiles && (
              <div className="flex items-center gap-2 mt-1.5 md:mt-2 text-portal-text-muted">
                <User size={12} className="md:w-[14px] md:h-[14px]" />
                <span className="text-xs md:text-sm">
                  {project!.profiles.full_name}
                  {project!.profiles.company && ` · ${project!.profiles.company}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {project!.description && (
        <p className="mt-1 mb-2 text-portal-text-muted leading-relaxed text-sm max-w-2xl">{project!.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2">
        <StatusBadge status={project!.status} />
        <Button size="sm" variant="outline" className="border-portal-border text-portal-text-muted h-8 text-xs"
          onClick={() => setShowEdit(true)}>
          <Pencil size={12} className="mr-1" />Edit
        </Button>
        <Button size="sm" variant="outline" className="border-portal-border text-portal-text-muted h-8 text-xs"
          onClick={() => setShowAssign(true)}>
          <Users size={12} className="mr-1" />Team
        </Button>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div className="flex gap-0.5 md:gap-1 border-b border-portal-border mb-4 md:mb-6 mt-3 md:mt-4 overflow-x-auto scrollbar-none">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              tab === tabId ? "border-portal-accent text-portal-accent" : "border-transparent text-portal-text-muted hover:text-portal-text"
            }`}>
            <Icon size={13} className="md:w-[14px] md:h-[14px]" />{label}
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

          {/* Project Timeline */}
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Milestone size={16} className="text-portal-accent" />
              <h2 className="font-semibold text-portal-text">Project Timeline</h2>
            </div>
            <ProjectTimeline milestones={(() => {
              const STATUS_ORDER = ["inquiry", "active", "review", "delivered", "archived"];
              const currentIdx = STATUS_ORDER.indexOf(project!.status);
              return STATUS_ORDER.filter(s => s !== "archived").map((s, i) => ({
                id: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
                status: i < currentIdx ? "completed" as const : i === currentIdx ? "current" as const : "upcoming" as const,
                date: s === "inquiry" ? project!.created_at : s === "active" ? project!.start_date : s === "delivered" ? project!.target_date : null,
                description: s === "inquiry" ? "Project initiated" : s === "active" ? "Design & development in progress" : s === "review" ? "Client review & feedback" : "Final delivery",
              }));
            })()} />
          </div>

          {/* Team */}
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

      {tab === "gallery" && (
        <div className="space-y-5">
          <DrivePdfImporter
            projectId={project!.id}
            onImported={() => setFileRefreshKey((k) => k + 1)}
          />
          <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
            <h2 className="font-semibold text-portal-text mb-4 text-sm">Portfolio Gallery</h2>
            <p className="text-xs text-portal-text-muted mb-4">Manage gallery images shown on the public portfolio page for this project.</p>
            <GalleryManager key={fileRefreshKey} projectId={project!.id} />
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
