import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderOpen, User, LogOut, ChevronLeft, ChevronRight,
  Briefcase, Users, FileArchive, Image, Settings, Activity, UserCog, Shield, PackageOpen,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const clientNav: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "My Projects", href: "/app/projects", icon: FolderOpen },
  { label: "Notifications", href: "/app/notifications", icon: Activity },
  { label: "Profile", href: "/app/profile", icon: User },
];

const staffNav: NavItem[] = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { label: "Projects", href: "/staff/projects", icon: FolderOpen },
  { label: "Notifications", href: "/staff/notifications", icon: Activity },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Clients", href: "/admin/clients", icon: UserCog },
  { label: "Projects", href: "/admin/projects", icon: Briefcase },
  { label: "Deliverables", href: "/admin/deliverables", icon: PackageOpen },
  { label: "Files", href: "/admin/files", icon: FileArchive },
  { label: "Portfolio", href: "/admin/portfolio", icon: Image },
  { label: "Team", href: "/admin/team", icon: Users },
  { label: "Notifications", href: "/admin/notifications", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: Activity },
];

interface PortalSidebarProps {
  variant: "client" | "staff" | "admin";
}

export function PortalSidebar({ variant }: PortalSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
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

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all duration-200",
        "bg-portal-bg border-portal-border min-h-screen",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-portal-border px-4 py-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-portal-text">Studio</span>
            <span className="h-1.5 w-1.5 rounded-full bg-portal-accent" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role badge */}
      <div className={cn(
        "mx-3 mt-3 flex items-center gap-2 rounded-md px-2 py-2",
        "bg-portal-accent/10 border border-portal-accent/20"
      )}>
        <RoleIcon size={14} className="text-portal-accent shrink-0" />
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-portal-accent">
            {roleLabel} Portal
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href ||
            (item.href !== "/app" && item.href !== "/staff" && item.href !== "/admin" &&
              location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn("portal-nav-item", isActive && "active", collapsed && "justify-center")}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-portal-border px-3 py-4 space-y-1">
        {!collapsed && profile && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-portal-text truncate">{profile.full_name}</p>
            <p className="text-xs text-portal-text-muted truncate">{profile.role}</p>
          </div>
        )}
        <Link to="/" className={cn("portal-nav-item", collapsed && "justify-center")} title={collapsed ? "Public Site" : undefined}>
          <LayoutDashboard size={16} className="shrink-0" />
          {!collapsed && <span>Public Site</span>}
        </Link>
        <button
          onClick={handleSignOut}
          className={cn("portal-nav-item w-full", collapsed && "justify-center")}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
