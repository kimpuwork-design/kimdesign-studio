import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PortalLayout } from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CheckCheck, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <PortalLayout variant={variant}>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-portal-text">Notifications</h1>
          <p className="mt-1 text-portal-text-muted">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f
                    ? "border-portal-accent bg-portal-accent/15 text-portal-accent"
                    : "border-portal-border text-portal-text-muted hover:border-portal-accent/50"
                }`}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="border-portal-border text-portal-text-muted text-xs">
              <CheckCheck size={13} className="mr-1.5" />Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-portal-border bg-portal-surface overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-portal-text-muted" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={40} className="mb-4 text-portal-text-muted opacity-30" />
            <p className="font-medium text-portal-text">No notifications</p>
            <p className="mt-1 text-sm text-portal-text-muted">
              {filter === "unread" ? "No unread notifications." : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-portal-border">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-portal-surface-hover transition-colors ${
                  !notif.is_read ? "bg-portal-accent/5" : ""
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1 shrink-0">
                  {!notif.is_read
                    ? <span className="flex h-2.5 w-2.5 rounded-full bg-portal-accent" />
                    : <span className="flex h-2.5 w-2.5 rounded-full bg-transparent" />}
                </div>

                {/* Icon */}
                <span className="text-xl shrink-0">{TYPE_ICON[notif.type] ?? "🔔"}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-portal-text ${!notif.is_read ? "" : "opacity-80"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="mt-0.5 text-xs text-portal-text-muted line-clamp-2">{notif.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-portal-text-muted">
                    {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {notif.link && (
                    <button
                      onClick={() => handleClick(notif)}
                      className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-accent transition-colors"
                      title="Go to"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                  {!notif.is_read && (
                    <button
                      onClick={() => markRead(notif.id)}
                      className="rounded p-1.5 text-portal-text-muted hover:bg-portal-bg hover:text-portal-text transition-colors"
                      title="Mark read"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    className="rounded p-1.5 text-portal-text-muted hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
