import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/messages/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { FileList } from "@/components/files/FileList";
import { CalendarDays, MapPin, Users, ArrowLeft, FolderOpen, LayoutList, MessageSquare, PackageOpen, Receipt, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { DeliverablesTab } from "@/components/deliverables/DeliverablesTab";
import { Button } from "@/components/ui/button";
import { BillingTab } from "@/components/billing/BillingTab";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  thumbnail_url: string | null;
}

interface Member {
  id: string;
  member_role: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutList },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "deliverables", label: "Deliverables", icon: PackageOpen },
  { id: "billing", label: "Billing", icon: Receipt },
];

const STATUS_STEPS = [
  { key: "inquiry", label: "Inquiry", icon: Clock, desc: "Proposal stage" },
  { key: "active", label: "Active", icon: AlertCircle, desc: "In progress" },
  { key: "review", label: "Review", icon: AlertCircle, desc: "Under review" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, desc: "Complete" },
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
      supabase.from("project_members").select("id, member_role, profiles(full_name, avatar_url)").eq("project_id", id),
    ]).then(([{ data: proj, error }, { data: mems }]) => {
      if (error || !proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj as Project);
      setMembers((mems as unknown as Member[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <PortalLayout variant="client">
      <div className="flex items-center justify-center py-20">
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
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === project!.status);

  return (
    <PortalLayout variant="client">
      <button onClick={() => navigate("/app/projects")} className="text-[11px] text-portal-text-muted hover:text-portal-text flex items-center gap-1 mb-4 transition-colors">
        <ArrowLeft size={12} /> Back to Projects
      </button>

      {/* Hero */}
      {project!.thumbnail_url ? (
        <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-6 glass-card">
          <img src={project!.thumbnail_url} alt={project!.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-portal-bg via-portal-bg/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white drop-shadow-lg">{project!.title}</h1>
              {project!.description && (
                <p className="text-white/60 text-xs mt-1 max-w-xl line-clamp-1">{project!.description}</p>
              )}
            </div>
            <StatusBadge status={project!.status} />
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-portal-text">{project!.title}</h1>
            {project!.description && (
              <p className="mt-1.5 text-portal-text-muted text-sm max-w-2xl">{project!.description}</p>
            )}
          </div>
          <StatusBadge status={project!.status} className="shrink-0 mt-1" />
        </div>
      )}

      {/* Progress Tracker — Enhanced */}
      <div className="mb-6 glass-card p-5">
        <div className="flex items-center justify-between relative">
          {/* Background track */}
          <div className="absolute top-5 left-8 right-8 h-[2px] bg-portal-border" />
          {/* Active track */}
          <div className="absolute top-5 left-8 h-[2px] bg-gradient-to-r from-portal-accent to-portal-accent/60 transition-all duration-700 ease-out"
            style={{ width: `calc(${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 4rem)` }} />
          
          {STATUS_STEPS.map((step, i) => {
            const isComplete = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const StepIcon = step.icon;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1 : 0.9,
                    boxShadow: isCurrent ? "0 0 20px hsl(32 95% 55% / 0.3)" : "none",
                  }}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500",
                    isCurrent ? "bg-portal-accent text-white ring-4 ring-portal-accent/20" :
                    isComplete ? "bg-portal-accent/80 text-white" :
                    "bg-portal-surface border-2 border-portal-border text-portal-text-muted"
                  )}
                >
                  {isComplete && i < currentStepIndex ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <StepIcon size={16} />
                  )}
                </motion.div>
                <div className="text-center">
                  <span className={cn(
                    "text-[10px] font-semibold tracking-wider uppercase block",
                    isCurrent ? "text-portal-accent" : isComplete ? "text-portal-text" : "text-portal-text-muted"
                  )}>
                    {step.label}
                  </span>
                  <span className="text-[9px] text-portal-text-muted/60 hidden sm:block">{step.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs — Enhanced */}
      <div className="flex gap-0.5 bg-portal-surface/30 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all rounded-lg whitespace-nowrap",
              tab === tabId
                ? "bg-portal-surface text-portal-accent shadow-sm"
                : "text-portal-text-muted hover:text-portal-text"
            )}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {project!.location && <InfoCard icon={<MapPin size={14} />} label="Location" value={project!.location} />}
                {project!.start_date && <InfoCard icon={<CalendarDays size={14} />} label="Start Date" value={new Date(project!.start_date).toLocaleDateString()} />}
                {project!.target_date && <InfoCard icon={<CalendarDays size={14} />} label="Target Date" value={new Date(project!.target_date).toLocaleDateString()} />}
              </div>

              {staffMembers.length > 0 && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={15} className="text-portal-text-muted" />
                    <h2 className="font-display text-sm font-semibold text-portal-text">Your Team</h2>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {staffMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl bg-portal-surface/50 px-3 py-2.5 hover:bg-portal-surface transition-colors">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-portal-accent/30 to-portal-accent/10 text-portal-accent text-xs font-bold">
                          {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-portal-text">{m.profiles?.full_name ?? "Unnamed"}</p>
                          <p className="text-[10px] text-portal-text-muted">Team Member</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "files" && profile && (
            <div className="space-y-5">
              <div className="glass-card p-5">
                <h2 className="font-display text-sm font-semibold text-portal-text mb-4">Upload Files</h2>
                <FileUploadZone projectId={project!.id} uploaderId={profile.id} onUploaded={() => setFileRefreshKey((k) => k + 1)} />
              </div>
              <div className="glass-card p-5">
                <h2 className="font-display text-sm font-semibold text-portal-text mb-4">Project Files</h2>
                <FileList projectId={project!.id} currentUserId={profile.id} refreshKey={fileRefreshKey} role="CLIENT" />
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
        </motion.div>
      </AnimatePresence>
    </PortalLayout>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card p-4 hover:border-portal-accent/30 transition-all">
      <div className="flex items-center gap-2 mb-1.5 text-portal-text-muted">{icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-portal-text font-medium text-sm">{value}</p>
    </div>
  );
}
