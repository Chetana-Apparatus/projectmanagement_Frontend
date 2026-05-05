"use client";

import AuthGuard from "@/components/guards/AuthGuard";

const ADMIN_ONLY = ["ADMIN"] as const;

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard allowedRoles={ADMIN_ONLY}>{children}</AuthGuard>;
}
