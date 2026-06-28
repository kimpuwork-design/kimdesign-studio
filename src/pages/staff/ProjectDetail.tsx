import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { MessageThread } from "@/components/messages/MessageThread";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { FileList } from "@/components/files/FileList";
import { CalendarDays, MapPin, Users, User, ArrowLeft, FolderOpen, LayoutList, MessageSquare, PackageOpen, Receipt, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { DeliverablesTab } from "@/components/deliverables/DeliverablesTab";
import { Button } from "@/components/ui/button";
import { BillingTab } from "@/components/billing/BillingTab";
import { QuoteModal } from "@/components/billing/QuoteModal";
import { InvoiceModal } from "@/components/billing/InvoiceModal";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  target_date: string | null;
  thumbnail_url: string | null;
  profiles: { full_name: string | null; company: string | null } | null;
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
  { key: "inquiry", label: "Inquiry", icon: Circle },
  { key: "active", label: "Active", icon: Loader2 },
  { key: "review", label: "Review", icon: PackageOpen },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function StaffProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [showQuote, setShowQuote] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const tab = (searchParams.get("tab") ?? "overview") as string;
  const setTab = (t: string) => setSearchParams({ tab: t });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("projects").select("*, profiles(full_name, company)").eq("id", id).maybeSingle(),
      supabase.from("project_members").select("id, member_role, profiles(full_name, avatar_url)").eq("project_id", id),
    ]).then(([{ data: proj, error }, { data: mems }]) => {
      if (error || !proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj as unknown as Project);
      setMembers((mems as unknown as Member[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <PortalLayout variant="staff">
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
      </div>
    </PortalLayout>
  );

  if (notFound) return (
    <PortalLayout variant="staff">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="font-display text-2xl font-bold text-portal-text">Not authorized</h2>
        <p className="mt-2 text-portal-text-muted">You are not assigned to this project.</p>
        <Button className="mt-6" onClick={() => navigate("/staff/projects")}><ArrowLeft size={14} className="mr-2" />Back</Button>
      </div>
    </PortalLayout>
  );

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === project!.status);
  const staffMembers = members.filter((m) => m.member_role === "STAFF");

  return (
    <PortalLayout variant="staff">
      <button onClick={() => navigate("/staff/projects")} className="text-xs text-portal-text-muted hover:text-portal-text flex items-center gap-1 mb-5">
        <ArrowLeft size={13} /> Back to Projects
      </button>

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-portal-border bg-gradient-to-br from-portal-surface to-portal-bg overflow-hidden mb-6">
        {project!.thumbnail_url && (
          <div className="absolute inset-0 opacity-10">
            <img src={project!.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="font-display text-3xl font-bold text-portal-text">{project!.title}</h1>
            <StatusBadge status={project!.status} className="shrink-0" />
          </div>
          {project!.profiles && (
            <div className="flex items-center gap-2 mt-2 mb-1 text-portal-text-muted">
              <User size={14} />
              <span className="text-sm">Client: <span className="text-portal-text">{project!.profiles.full_name}</span>
                {project!.profiles.company && ` · ${project!.profiles.company}`}
              </span>
            </div>
          )}
          {project!.description && (
            <p className="mt-2 text-portal-text-muted leading-relaxed text-sm max-w-2xl">{project!.description}</p>
          )}

          {/* Team Avatars */}
          {staffMembers.length > 0 && (
            <div className="flex items-center gap-1 mt-4">
              {staffMembers.slice(0, 5).map((m) => (
                <div key={m.id} className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-accent/20 text-portal-accent text-xs font-bold border-2 border-portal-surface -ml-1 first:ml-0"
                  title={m.profiles?.full_name ?? "Staff"}>
                  {m.profiles?.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (m.profiles?.full_name ?? "?").charAt(0).toUpperCase()
                  )}
                </div>
              ))}
              {staffMembers.length > 5 && (
                <span className="text-xs text-portal-text-muted ml-2">+{staffMembers.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Progress Tracker */}
      {currentStepIndex >= 0 && (
        <div className="mb-6 glass-card p-5">
          <div className="relative flex items-center justify-between">
            {/* Track background */}
            <div className="absolute top-5 left-8 right-8 h-[2px] bg-portal-border" />
            {/* Track progress */}
            <div
              className="absolute top-5 left-8 h-[2px] bg-gradient-to-r from-portal-accent to-portal-accent/60 transition-all duration-700 ease-out"
              style={{ width: currentStepIndex === 0 ? "0%" : `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 4rem)` }}
            />
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    done ? "border-portal-accent bg-portal-accent/15 text-portal-accent" : "border-portal-border bg-portal-bg text-portal-text-muted"
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${done ? "text-portal-accent" : "text-portal-text-muted"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pill Tabs */}
      <div className="flex gap-1 mb-6 bg-portal-bg/50 rounded-xl p-1 border border-portal-border/50 overflow-x-auto">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setTab(tabId)}
            className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              tab === tabId
                ? "bg-portal-accent text-portal-accent-foreground shadow-sm"
                : "text-portal-text-muted hover:text-portal-text hover:bg-portal-surface/50"
            }`}>
            <Icon size={14} />{label}
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
                {project!.location && <InfoCard icon={<MapPin size={15} />} label="Location" value={project!.location} />}
                {project!.start_date && <InfoCard icon={<CalendarDays size={15} />} label="Start Date" value={new Date(project!.start_date).toLocaleDateString()} />}
                {project!.target_date && <InfoCard icon={<CalendarDays size={15} />} label="Target Date" value={new Date(project!.target_date).toLocaleDateString()} />}
              </div>
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4"><Users size={16} className="text-portal-accent" /><h2 className="font-semibold text-portal-text">Project Team ({members.length})</h2></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-portal-border bg-portal-bg px-3 py-2.5 hover:border-portal-accent/30 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-portal-accent/20 text-portal-accent text-xs font-semibold">
                        {m.profiles?.avatar_url ? (
                          <img src={m.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (m.profiles?.full_name ?? "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-portal-text block truncate">{m.profiles?.full_name ?? "Unnamed"}</span>
                        <span className="text-xs text-portal-text-muted capitalize">{m.member_role.toLowerCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "files" && profile && (
            <div className="space-y-6">
              <div className="glass-card p-5">
                <h2 className="font-semibold text-portal-text mb-4 text-sm">Upload Files</h2>
                <FileUploadZone projectId={project!.id} uploaderId={profile.id} onUploaded={() => setFileRefreshKey((k) => k + 1)} />
              </div>
              <div className="glass-card p-5">
                <h2 className="font-semibold text-portal-text mb-4 text-sm">Project Files</h2>
                <FileList projectId={project!.id} currentUserId={profile.id} refreshKey={fileRefreshKey} />
              </div>
            </div>
          )}

          {tab === "messages" && profile && (
            <MessageThread projectId={project!.id} currentUserId={profile.id} currentUserRole="STAFF" />
          )}

          {tab === "deliverables" && (
            <DeliverablesTab projectId={project!.id} role="STAFF" />
          )}

          {tab === "billing" && (
            <BillingTab
              projectId={project!.id}
              role="STAFF"
              onCreateQuote={() => setShowQuote(true)}
              onCreateInvoice={() => setShowInvoice(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {showQuote && (
        <QuoteModal projectId={project!.id} onClose={() => setShowQuote(false)} onSaved={() => setShowQuote(false)} />
      )}
      {showInvoice && (
        <InvoiceModal projectId={project!.id} onClose={() => setShowInvoice(false)} onSaved={() => setShowInvoice(false)} />
      )}
    </PortalLayout>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-1 text-portal-text-muted">{icon}<span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="text-portal-text font-medium">{value}</p>
    </div>
  );
}
