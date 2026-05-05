"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "./sidebar.config";

type SidebarProps = {
  role: UserRole;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
};

export default function Sidebar({
  role,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const items = SIDEBAR_ITEMS[role];

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onCloseMobile}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-white transition-all duration-300",
          collapsed ? "w-20" : "w-64",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-border px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <span className="text-base font-heading font-semibold text-cs-heading">
              Apparatus Portal
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1 text-cs-text hover:bg-cs-primary-100/10 hover:text-cs-primary-200 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-cs-text hover:bg-cs-primary-100/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {items.map((item) => {
            /** Avoid marking "Dashboard" active on sibling routes (e.g. /employee/tasks). */
            const isDashboardRootLink =
              item.href === "/business-analyst" || item.href === "/employee";
            const isActive = isDashboardRootLink
              ? pathname === item.href || pathname === `${item.href}/dashboard`
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-base font-medium transition-all duration-200",
                  collapsed ? "justify-center gap-0" : "gap-3",
                  isActive
                    ? "bg-cs-primary-100/20 text-cs-primary-200"
                    : "text-cs-text hover:bg-cs-primary-100/10 hover:text-cs-primary-200",
                )}
                title={collapsed ? item.label : undefined}
                onClick={onCloseMobile}
              >
                <Icon size={16} />
                {!collapsed && (
                  <span className="p1 !tracking-normal !leading-normal">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
