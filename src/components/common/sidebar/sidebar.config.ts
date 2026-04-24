import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CheckSquare,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Milestone,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import type { UserRole } from "@/hooks/useRole";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    {
      label: "Project Management",
      href: "/admin/projects",
      icon: FolderKanban,
    },
    { label: "Milestones", href: "/admin/milestones", icon: Milestone },
    { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
    { label: "Work Tracking", href: "/admin/work-tracking", icon: Timer },
    { label: "Documents", href: "/admin/documents", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  BA: [
    { label: "Dashboard", href: "/business-analyst", icon: LayoutDashboard },
    {
      label: "Projects",
      href: "/business-analyst/projects",
      icon: FolderKanban,
    },
    { label: "Documents", href: "/business-analyst/documents", icon: FileText },
  ],
  Employee: [
    { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: "Tasks", href: "/employee/tasks", icon: ClipboardList },
    { label: "Work History", href: "/employee/work-history", icon: Briefcase },
  ],
};
