"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, routeForRole } from "@/lib/api-client";
import type { StoredUser } from "@/lib/auth-storage";
import { clearSession } from "@/lib/auth-storage";

type MePayload = Pick<StoredUser, "role">;

type Segment = "employee" | "business-analyst";

/**
 * Keeps dashboard URLs aligned with `/api/v1/auth/me` role — e.g. employees who
 * edit the address bar to `/business-analyst/*` are sent back to the employee dashboard.
 */
export default function DashboardRoleGuard({
  children,
  segment,
}: {
  children: React.ReactNode;
  segment: Segment;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await apiFetch<MePayload>("/api/v1/auth/me");
        if (cancelled) return;

        if (!res.success || !res.data) {
          clearSession();
          router.replace("/auth/login");
          return;
        }

        const apiRole = res.data.role ?? null;

        if (!apiRole) {
          clearSession();
          router.replace("/auth/login");
          return;
        }

        if (apiRole === "ADMIN") {
          router.replace("/admin/dashboard");
          return;
        }

        if (segment === "business-analyst" && apiRole === "EMPLOYEE") {
          router.replace("/employee/dashboard");
          return;
        }

        if (segment === "employee" && apiRole === "BA") {
          router.replace("/business-analyst/dashboard");
          return;
        }

        const wrongSegment =
          (segment === "employee" && apiRole !== "EMPLOYEE") ||
          (segment === "business-analyst" && apiRole !== "BA");
        if (wrongSegment) {
          router.replace(routeForRole(apiRole));
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
  }, [router, segment]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
