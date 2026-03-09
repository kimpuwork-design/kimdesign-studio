import { 
  LayoutDashboard, FolderOpen, User, LogOut, ChevronLeft, 
  Briefcase, Users, FileArchive, Settings, Activity, UserCog, Shield, 
  PackageOpen, Receipt, FileText, Newspaper, BarChart3, Globe, type LucideIcon 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/hooks/useSettings";
import { KMonogramLogo } from "@/components/KMonogramLogo";
import { NavLink } from "@/components/NavLink";

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

interface ModernPortalSidebarProps {
  variant: "client" | "staff" | "admin";
}

export function ModernPortalSidebar({ variant }: ModernPortalSidebarProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { settings } = useSettings();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  
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
    <Sidebar collapsible="icon" className="bg-portal-bg/95 backdrop-blur-xl border-portal-border">
      {/* Sidebar glow accent */}
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-portal-accent/20 via-transparent to-portal-accent/10" />

      <SidebarHeader className="border-b border-portal-border/50">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <div className="h-8 w-8 rounded-xl overflow-hidden shadow-lg">
              <img src={logoUrl} alt={studioName} className="h-full w-full object-contain" />
            </div>
          ) : (
            <KMonogramLogo size={32} className="rounded-xl shadow-lg" />
          )}
          {!collapsed && (
            <div>
              <span className="font-display text-sm font-bold text-portal-text tracking-tight">{studioName.split(" ")[0]}</span>
              <span className="block text-[9px] tracking-[0.15em] uppercase text-portal-text-muted font-medium">{studioName.split(" ").slice(1).join(" ") || "Studio"}</span>
            </div>
          )}
        </div>

        {/* Role badge */}
        <div className="mt-3 flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-portal-accent/8 border border-portal-accent/15">
          <RoleIcon size={14} className="text-portal-accent shrink-0" />
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-portal-accent">
              {roleLabel} Portal
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.15em] text-portal-text-muted/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.href} 
                        end={item.href === "/app" || item.href === "/staff" || item.href === "/admin"}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-all portal-nav-item"
                        activeClassName="bg-portal-accent/10 text-portal-accent border-portal-accent/20 shadow-lg shadow-portal-accent/5 active"
                      >
                        <item.icon size={16} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-portal-border/50 px-3 py-4">
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
        <div className="space-y-1">
          <SidebarMenuButton asChild>
            <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-all w-full">
              <Globe size={16} className="shrink-0" />
              {!collapsed && <span>Public Site</span>}
            </Link>
          </SidebarMenuButton>
          <SidebarMenuButton asChild>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-all w-full"
            >
              <LogOut size={16} className="shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}