import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const notifRoute =
    profile?.role === "ADMIN"
      ? "/admin/notifications"
      : profile?.role === "STAFF"
      ? "/staff/notifications"
      : "/app/notifications";

  const fetchUnread = useCallback(async () => {
    if (!profile) return;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [profile]);

  const fetchRecent = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8);
    setNotifications((data as Notification[]) ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchUnread();
    const channel = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) fetchRecent();
  };

  const markRead = async (notif: Notification) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((ns) => ns.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link) {
      setOpen(false);
      navigate(notif.link);
    }
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setUnreadCount(0);
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-portal-accent text-[9px] font-bold text-portal-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-80 rounded-xl border border-portal-border bg-portal-bg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-portal-border">
              <span className="text-sm font-semibold text-portal-text">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-portal-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-portal-border">
              {loading ? (
                <div className="py-8 text-center text-sm text-portal-text-muted">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-portal-text-muted">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-portal-surface transition-colors ${
                      !n.is_read ? "bg-portal-accent/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-portal-accent" />
                      )}
                      <div className={!n.is_read ? "" : "pl-4"}>
                        <p className="text-sm font-medium text-portal-text line-clamp-1">{n.title}</p>
                        {n.body && <p className="text-xs text-portal-text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                        <p className="text-[10px] text-portal-text-muted mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-portal-border px-4 py-2.5">
              <button
                onClick={() => { setOpen(false); navigate(notifRoute); }}
                className="w-full text-center text-xs text-portal-accent hover:underline"
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
