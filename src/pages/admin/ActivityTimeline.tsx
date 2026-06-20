import { useEffect, useState, useCallback, useRef } from "react";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckCircle2, AlertCircle, Clock, FileText, Briefcase, Users,
  MessageSquare, DollarSign, Image, RefreshCw, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TimelineEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor_name: string | null;
  actor_avatar: string | null;
  metadata: any;
}

const ENTITY_ICONS: Record<string, any> = {
  project: Briefcase,
  lead: Users,
  invoice: DollarSign,
  deliverable: FileText,
  message: MessageSquare,
  file: Image,
  blog_post: FileText,
  default: Clock,
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-emerald-400 bg-emerald-500/10",
  insert: "text-emerald-400 bg-emerald-500/10",
  update: "text-[#1a365d] bg-[#1a365d]/10",
  edit: "text-[#1a365d] bg-[#1a365d]/10",
  delete: "text-red-400 bg-red-500/10",
  status: "text-amber-400 bg-amber-500/10",
};

function getActionColor(action: string) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return color;
  }
  return "text-portal-text-muted bg-portal-surface";
}

function getActionIcon(action: string) {
  if (action.includes("create") || action.includes("insert")) return Plus;
  if (action.includes("update") || action.includes("edit") || action.includes("status")) return CheckCircle2;
  if (action.includes("delete")) return AlertCircle;
  return Clock;
}

export default function ActivityTimeline() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(false);
  const previousCount = useRef(0);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("id, action, entity_type, entity_id, created_at, actor_id, metadata")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("entity_type", filter);
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Fetch actor names
    const actorIds = [...new Set(data.map(a => a.actor_id).filter(Boolean))];
    let nameMap: Record<string, { name: string; avatar: string | null }> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", actorIds);
      if (profiles) {
        profiles.forEach(p => {
          nameMap[p.id] = { name: p.full_name || "Unknown", avatar: p.avatar_url };
        });
      }
    }

    const mapped: TimelineEvent[] = data.map(a => ({
      id: a.id,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      created_at: a.created_at,
      actor_name: a.actor_id ? (nameMap[a.actor_id]?.name || "Unknown") : "System",
      actor_avatar: a.actor_id ? (nameMap[a.actor_id]?.avatar || null) : null,
      metadata: a.metadata,
    }));

    setEvents(mapped);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Real-time subscription for new audit events
  useEffect(() => {
    const channel = supabase
      .channel('activity-timeline-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
        // Show toast for new activity
        const newEvent = payload.new as any;
        toast({
          title: "New Activity",
          description: `${newEvent.action} on ${newEvent.entity_type}`,
        });
        fetchEvents();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents, toast]);

  const entityTypes = ["all", "project", "lead", "invoice", "deliverable", "message", "file"];

  // Group events by date
  const groupedEvents = events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const date = format(new Date(event.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <PortalLayout variant="admin">
      <PageHeader
        title="Activity Timeline"
        subtitle="Real-time activity feed across all resources"
        action={
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-portal-surface/50 border border-portal-border/30">
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-portal-text-muted/40'}`} />
              <span className="text-[10px] font-medium text-portal-text-muted uppercase tracking-wider">
                {isLive ? 'Live' : 'Offline'}
              </span>
            </div>
            <button
              onClick={fetchEvents}
              className="rounded-lg p-2 text-portal-text-muted hover:bg-portal-surface/80 hover:text-portal-text transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-6 pb-0.5">
        {entityTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all whitespace-nowrap shrink-0",
              filter === type
                ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                : "border-portal-border/50 text-portal-text-muted hover:border-portal-accent/40 hover:text-portal-text"
            )}
          >
            {type === "all" ? <Filter size={10} /> : (() => {
              const Icon = ENTITY_ICONS[type] || ENTITY_ICONS.default;
              return <Icon size={10} />;
            })()}
            <span className="capitalize">{type === "all" ? "All" : type + "s"}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="glass-card flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-portal-accent border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <Clock className="mx-auto mb-3 text-portal-text-muted" size={32} />
          <p className="font-medium text-portal-text">No activity found</p>
          <p className="mt-1 text-sm text-portal-text-muted">Activity will appear here as actions are performed.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-portal-text-muted uppercase tracking-wider">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </span>
                <div className="flex-1 h-px bg-portal-border/30" />
                <span className="text-[10px] text-portal-text-muted/50">{dayEvents.length} events</span>
              </div>

              {/* Events */}
              <div className="relative ml-4">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-px bg-portal-border/30" />

                <AnimatePresence mode="popLayout">
                  {dayEvents.map((event, idx) => {
                    const ActionIcon = getActionIcon(event.action);
                    const EntityIcon = ENTITY_ICONS[event.entity_type] || ENTITY_ICONS.default;
                    const colorClass = getActionColor(event.action);

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.3 }}
                        className="relative flex gap-4 pb-4 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", colorClass)}>
                          <ActionIcon size={12} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 glass-card p-3 hover:bg-portal-surface-hover/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-portal-text">{event.actor_name}</span>
                                <span className="text-[10px] text-portal-text-muted">{event.action}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <EntityIcon size={10} className="text-portal-text-muted shrink-0" />
                                <span className="text-[11px] text-portal-text-muted capitalize">{event.entity_type}</span>
                                {event.metadata && typeof event.metadata === 'object' && event.metadata.title && (
                                  <span className="text-[11px] text-portal-text font-medium truncate">— {event.metadata.title}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-portal-text-muted/60 whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </span>
                          </div>

                          {/* Metadata details */}
                          {event.metadata && typeof event.metadata === 'object' && (event.metadata.from || event.metadata.to) && (
                            <div className="mt-2 flex items-center gap-2 text-[10px]">
                              {event.metadata.from && (
                                <span className="rounded-full bg-portal-surface px-2 py-0.5 text-portal-text-muted capitalize">{event.metadata.from}</span>
                              )}
                              {event.metadata.from && event.metadata.to && (
                                <span className="text-portal-text-muted">→</span>
                              )}
                              {event.metadata.to && (
                                <span className="rounded-full bg-portal-accent/10 px-2 py-0.5 text-portal-accent font-medium capitalize">{event.metadata.to}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  );
}