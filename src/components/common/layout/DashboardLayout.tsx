"use client";

import { useState } from "react";
import type { UserRole } from "@/hooks/useRole";
import { useRole } from "@/hooks/useRole";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
  userRole?: UserRole;
};

export default function DashboardLayout({
  children,
  userRole,
}: DashboardLayoutProps) {
  const detectedRole = useRole(userRole ?? "Employee");
  const activeRole = userRole ?? detectedRole;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarWidth = collapsed ? "5rem" : "16rem";

  return (
    <div
      className="min-h-screen bg-background"
      style={{ ["--sidebar-width" as string]: sidebarWidth }}
    >
      <Sidebar
        role={activeRole}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <Header
        role={activeRole}
        collapsed={collapsed}
        onToggleMobileSidebar={() => setMobileOpen(true)}
      />
      <main className="mt-16 min-h-[calc(100vh-4rem)] p-4 transition-all duration-300 lg:ml-[var(--sidebar-width)] lg:p-6">
        {children}
      </main>
    </div>
  );
}
