import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderOpen, User, LogOut, ChevronLeft, ChevronRight,
  Briefcase, Users, FileArchive, Settings, Activity, UserCog, Shield, PackageOpen, Receipt, FileText,
  type LucideIcon, Newspaper, BarChart3, Globe, ChevronDown
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const clientNav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/app", icon: LayoutDashboard },
      { label: "My Projects", href: "/app/projects", icon: FolderOpen },
      { label: "Notifications", href: "/app/notifications", icon: Activity },
      { label: "Profile", href: "/app/profile", icon: User },
    ],
  },
];

const staffNav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
      { label: "Projects", href: "/staff/projects", icon: FolderOpen },
      { label: "Notifications", href: "/staff/notifications", icon: Activity },
    ],
  },
];

const adminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Leads", href: "/admin/leads", icon: Users },
      { label: "Clients", href: "/admin/clients", icon: UserCog },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "Projects", href: "/admin/projects", icon: Briefcase },
      { label: "Deliverables", href: "/admin/deliverables", icon: PackageOpen },
      { label: "Files", href: "/admin/files", icon: FileArchive },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Quotes", href: "/admin/quotes", icon: Receipt },
      { label: "Invoices", href: "/admin/invoices", icon: FileText },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Blog", href: "/admin/blog", icon: Newspaper },
      { label: "Site Content", href: "/admin/site-content", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Team", href: "/admin/team", icon: Users },
      { label: "Notifications", href: "/admin/notifications", icon: Activity },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
    ],
  },
];

interface PortalSidebarProps {
  variant: "client" | "staff" | "admin";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function PortalSidebar({ variant, collapsed = false, onToggleCollapse }: PortalSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { settings } = useSettings();
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  const logoUrl = settings?.logo_url;

  const navGroups =
    variant === "admin" ? adminNav :
    variant === "staff" ? staffNav :
    clientNav;

  const roleLabel =
    variant === "admin" ? "Admin" :
    variant === "staff" ? "Staff" : "Client";

  const RoleIcon: LucideIcon =
    variant === "admin" ? Shield :
    variant === "staff" ? Briefcase : User;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (profile?.full_name ?? "?").split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-300 relative",
        "bg-sidebar/95 backdrop-blur-xl border-sidebar-border min-h-screen",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Sidebar glow accent */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-portal-accent/20 via-transparent to-portal-accent/10" />
      
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border/50 px-4 h-16",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <div className="h-8 w-8 rounded-xl overflow-hidden shadow-lg">
                <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
              </div>
            ) : (
              <KMonogramLogo size={32} className="rounded-xl shadow-lg" />
            )}
            <div>
              <span className="font-display text-sm font-bold text-portal-text tracking-tight">{studioName.split(" ")[0]}</span>
              <span className="block text-[9px] tracking-[0.15em] uppercase text-portal-text-muted font-medium">{studioName.split(" ").slice(1).join(" ") || "Studio"}</span>
            </div>
          </div>
        )}
        {collapsed && (
          logoUrl ? (
            <div className="h-8 w-8 rounded-xl overflow-hidden shadow-lg">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={32} className="rounded-xl shadow-lg" />
          )
        )}
        {onToggleCollapse && !collapsed && (
          <button
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-all"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Collapse button for collapsed state */}
      {onToggleCollapse && collapsed && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto mt-3 rounded-lg p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-all"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Role badge */}
      <div className={cn(
        "mx-3 mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5",
        "bg-portal-accent/8 border border-portal-accent/15"
      )}>
        <RoleIcon size={14} className="text-portal-accent shrink-0" />
        {!collapsed && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-portal-accent">
            {roleLabel} Portal
          </span>
        )}
      </div>

      {/* Nav — Grouped */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <NavSection key={group.label} group={group} collapsed={collapsed} currentPath={location.pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border/50 px-3 py-4 space-y-1">
        {!collapsed && profile && (
          <div className="px-3 py-3 mb-2 flex items-center gap-3 rounded-xl bg-portal-surface/50">
            <Avatar className="h-9 w-9 ring-2 ring-portal-accent/20">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? ""} />}
              <AvatarFallback className="bg-gradient-to-br from-portal-accent/30 to-portal-accent/10 text-portal-accent text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-portal-text truncate">{profile.full_name}</p>
              <p className="text-[10px] text-portal-text-muted truncate capitalize">{profile.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <Link to="/" className={cn("portal-nav-item", collapsed && "justify-center px-0")} title={collapsed ? "Public Site" : undefined}>
          <Globe size={16} className="shrink-0" />
          {!collapsed && <span>Public Site</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn("portal-nav-item w-full", collapsed && "justify-center px-0")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

/* ── Collapsible Nav Section ── */
function NavSection({ group, collapsed, currentPath }: { group: NavGroup; collapsed: boolean; currentPath: string }) {
  const hasActive = group.items.some(item => 
    currentPath === item.href || 
    (item.href !== "/app" && item.href !== "/staff" && item.href !== "/admin" && currentPath.startsWith(item.href))
  );
  const [open, setOpen] = useState(true);

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href ||
            (item.href !== "/app" && item.href !== "/staff" && item.href !== "/admin" && currentPath.startsWith(item.href));
          return (
            <Link key={item.href} to={item.href}
              className={cn("portal-nav-item justify-center px-0", isActive && "active")}
              title={item.label}>
              <Icon size={16} className="shrink-0" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-portal-text-muted/60 group-hover:text-portal-text-muted transition-colors">
          {group.label}
        </span>
        <ChevronDown size={10} className={cn(
          "text-portal-text-muted/40 transition-transform duration-200",
          !open && "-rotate-90"
        )} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href ||
              (item.href !== "/app" && item.href !== "/staff" && item.href !== "/admin" && currentPath.startsWith(item.href));
            return (
              <Link key={item.href} to={item.href}
                className={cn("portal-nav-item", isActive && "active")}>
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
