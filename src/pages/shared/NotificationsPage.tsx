import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2, Inbox, Search, MessageSquare, Package, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  variant: "client" | "staff" | "admin";
}

const TYPE_ICON: Record<string, string> = {
  message: "💬",
  deliverable: "📦",
  system: "🔔",
};

export default function NotificationsPage({ variant }: Props) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "unread") query = query.eq("is_read", false);
    const { data } = await query;
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [profile, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
    toast({ title: "All notifications marked as read" });
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((ns) => ns.filter((n) => n.id !== id));
  };

  const handleClick = async (notif: Notification) => {
    await markRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Group notifications by date
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const date = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) key = "Today";
    else if (date.toDateString() === yesterday.toDateString()) key = "Yesterday";
    else key = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <PortalLayout variant={variant}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <PageHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          className="mb-0"
        />
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-0.5 bg-portal-surface/30 rounded-lg p-0.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-medium transition-all",
                  filter === f
                    ? "bg-portal-surface text-portal-accent shadow-sm"
                    : "text-portal-text-muted hover:text-portal-text"
                )}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead}
              className="border-portal-border/40 text-portal-text-muted text-[11px] h-8">
              <CheckCheck size={12} className="mr-1" />Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-portal-text-muted" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox size={36} className="mb-3 text-portal-text-muted/30" />
            <p className="font-medium text-portal-text text-sm">No notifications</p>
            <p className="mt-1 text-xs text-portal-text-muted">
              {filter === "unread" ? "No unread notifications." : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([date, notifs]) => (
              <div key={date}>
                <div className="px-5 py-2 bg-portal-surface/20 border-b border-portal-border/30">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-portal-text-muted/60">{date}</span>
                </div>
                <div className="divide-y divide-portal-border/20">
                  {notifs.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "flex items-start gap-3 px-5 py-3.5 hover:bg-portal-surface-hover/30 transition-colors cursor-pointer group",
                        !notif.is_read && "bg-portal-accent/[0.04]"
                      )}
                      onClick={() => handleClick(notif)}
                    >
                      {/* Unread indicator */}
                      <div className="mt-2 shrink-0 w-2">
                        {!notif.is_read && <span className="flex h-2 w-2 rounded-full bg-portal-accent" />}
                      </div>

                      {/* Icon */}
                      <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[notif.type] ?? "🔔"}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-medium text-portal-text", notif.is_read && "opacity-70")}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="mt-0.5 text-[11px] text-portal-text-muted line-clamp-1">{notif.body}</p>
                        )}
                        <p className="mt-1 text-[10px] text-portal-text-muted/50">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.link && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClick(notif); }}
                            className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-accent transition-colors"
                            title="Go to"
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                            className="rounded-md p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
                            title="Mark read"
                          >
                            <CheckCheck size={13} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                          className="rounded-md p-1.5 text-portal-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
