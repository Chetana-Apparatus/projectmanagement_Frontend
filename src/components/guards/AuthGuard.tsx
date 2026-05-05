"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, routeForRole } from "@/lib/api-client";
import type { StoredUser } from "@/lib/auth-storage";
import { clearSession, getStoredAccess } from "@/lib/auth-storage";

type ApiRole = "ADMIN" | "BA" | "EMPLOYEE";

type AuthGuardProps = {
  children: React.ReactNode;
  /** If set, user must have one of these roles or they are sent to their home route. */
  allowedRoles?: readonly ApiRole[];
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!getStoredAccess()) {
        clearSession();
        if (!cancelled) router.replace("/auth/login");
        return;
      }

      try {
        const res = await apiFetch<StoredUser>("/api/v1/auth/me");

        if (cancelled) return;

        if (!res.success || !res.data) {
          clearSession();
          router.replace("/auth/login");
          return;
        }

        const role = res.data.role;
        if (
          !role ||
          (role !== "ADMIN" && role !== "BA" && role !== "EMPLOYEE")
        ) {
          clearSession();
          router.replace("/auth/login");
          return;
        }

        if (allowedRoles?.length && !allowedRoles.includes(role as ApiRole)) {
          router.replace(routeForRole(role));
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) {
          clearSession();
          router.replace("/auth/login");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router, allowedRoles]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
