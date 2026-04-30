import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CheckSquare,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
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
    { label: "Work tracking", href: "/admin/work-tracking", icon: Timer },
    { label: "AI Chat", href: "/admin/ai-chat", icon: MessageSquare },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  BA: [
    { label: "Dashboard", href: "/business-analyst", icon: LayoutDashboard },
    {
      label: "Project Management",
      href: "/business-analyst/projects",
      icon: FolderKanban,
    },
    {
      label: "Milestone Management",
      href: "/business-analyst/milestones",
      icon: Milestone,
    },
    {
      label: "Task Management",
      href: "/business-analyst/tasks",
      icon: CheckSquare,
    },
    {
      label: "Work tracking",
      href: "/business-analyst/work-tracking",
      icon: Timer,
    },
  ],
  Employee: [
    { label: "Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: " My Tasks", href: "/employee/tasks", icon: ClipboardList },
    { label: "Work History", href: "/employee/work-history", icon: Briefcase },
  ],
};
