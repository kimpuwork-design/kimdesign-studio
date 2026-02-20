import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      <div className="mb-2">
        <button onClick={() => navigate("/app/projects")} className="text-xs text-portal-text-muted hover:text-portal-text flex items-center gap-1 mb-4">
          <ArrowLeft size={13} /> Back to Projects
        </button>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-portal-text">{project!.title}</h1>
          <StatusBadge status={project!.status} className="shrink-0" />
        </div>
        {project!.description && (
          <p className="mt-3 text-portal-text-muted leading-relaxed">{project!.description}</p>
        )}
      </div>

      {/* Details grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {project!.location && (
          <InfoCard icon={<MapPin size={15} />} label="Location" value={project!.location} />
        )}
        {project!.start_date && (
          <InfoCard icon={<CalendarDays size={15} />} label="Start Date"
            value={new Date(project!.start_date).toLocaleDateString()} />
        )}
        {project!.target_date && (
          <InfoCard icon={<CalendarDays size={15} />} label="Target Date"
            value={new Date(project!.target_date).toLocaleDateString()} />
        )}
      </div>

      {/* Team */}
      {staffMembers.length > 0 && (
        <div className="mt-6 rounded-xl border border-portal-border bg-portal-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-portal-text-muted" />
            <h2 className="font-semibold text-portal-text">Your Team</h2>
          </div>
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
