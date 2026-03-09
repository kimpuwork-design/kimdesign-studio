import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { writeAuditLog } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import { Star, ExternalLink, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface KanbanProject {
  id: string;
  title: string;
  status: string;
  location: string | null;
  target_date: string | null;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_public: boolean;
  profiles: { full_name: string | null; company: string | null } | null;
  updated_at: string;
}

const COLUMNS = [
  { id: "inquiry", label: "Inquiry", color: "border-indigo-400/50 bg-indigo-500/5" },
  { id: "active", label: "Active", color: "border-emerald-400/50 bg-emerald-500/5" },
  { id: "review", label: "Review", color: "border-violet-400/50 bg-violet-500/5" },
  { id: "delivered", label: "Delivered", color: "border-green-400/50 bg-green-500/5" },
  { id: "archived", label: "Archived", color: "border-gray-400/50 bg-gray-500/5" },
];

interface ProjectKanbanProps {
  projects: KanbanProject[];
  onRefresh: () => void;
}

export function ProjectKanban({ projects, onRefresh }: ProjectKanbanProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [moving, setMoving] = useState<string | null>(null);

  const columnData = COLUMNS.map(col => ({
    ...col,
    items: projects.filter(p => p.status === col.id),
  }));

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    const project = projects.find(p => p.id === draggableId);
    if (!project || project.status === newStatus) return;

    setMoving(draggableId);

    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", draggableId);

    if (!error && profile) {
      await writeAuditLog({
        actor_id: profile.id,
        action: "project_status_changed",
        entity_type: "project",
        entity_id: draggableId,
        metadata: { from: project.status, to: newStatus },
      });
    }

    setMoving(null);
    onRefresh();
  }, [projects, profile, onRefresh]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
        {columnData.map((col) => (
          <div key={col.id} className="min-w-[260px] flex-1 flex flex-col">
            {/* Column header */}
            <div className={cn("rounded-t-xl border-t-2 px-3 py-2.5 mb-2", col.color)}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-portal-text uppercase tracking-wider">{col.label}</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-portal-surface/50 px-1.5 text-[10px] font-bold text-portal-text-muted">
                  {col.items.length}
                </span>
              </div>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 space-y-2 rounded-b-xl border border-portal-border/30 p-2 min-h-[200px] transition-colors",
                    snapshot.isDraggingOver && "bg-portal-accent/5 border-portal-accent/30"
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {col.items.map((project, index) => (
                      <Draggable key={project.id} draggableId={project.id} index={index}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "glass-card p-3 cursor-grab active:cursor-grabbing group",
                              snapshot.isDragging && "shadow-xl ring-1 ring-portal-accent/30 rotate-1",
                              moving === project.id && "opacity-50"
                            )}
                          >
                            {/* Thumbnail */}
                            {project.thumbnail_url && (
                              <div className="aspect-[16/9] rounded-lg overflow-hidden mb-2.5 bg-portal-surface">
                                <img
                                  src={project.thumbnail_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}

                            {/* Title row */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-portal-text leading-tight flex-1">{project.title}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${project.id}`); }}
                                className="shrink-0 rounded-md p-1 text-portal-text-muted opacity-0 group-hover:opacity-100 hover:text-portal-accent transition-all"
                              >
                                <ExternalLink size={11} />
                              </button>
                            </div>

                            {/* Client */}
                            <p className="text-[10px] text-portal-text-muted mt-1">{project.profiles?.full_name ?? "No client"}</p>

                            {/* Meta row */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {project.location && (
                                <span className="flex items-center gap-0.5 text-[9px] text-portal-text-muted">
                                  <MapPin size={8} /> {project.location}
                                </span>
                              )}
                              {project.target_date && (
                                <span className="flex items-center gap-0.5 text-[9px] text-portal-text-muted">
                                  <Calendar size={8} /> {new Date(project.target_date).toLocaleDateString()}
                                </span>
                              )}
                              {project.is_featured && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
                              {project.is_public && (
                                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-400">Public</span>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                  {col.items.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex items-center justify-center h-20 text-[11px] text-portal-text-muted/50">
                      Drop here
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}