"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import type { StoredUser } from "@/lib/auth-storage";
import { clearSession } from "@/lib/auth-storage";

type MePayload = StoredUser;

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
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

        if (res.data.role !== "ADMIN") {
          const target =
            res.data.role === "BA"
              ? "/business-analyst"
              : res.data.role === "EMPLOYEE"
                ? "/employee"
                : "/auth/login";
          router.replace(target);
          return;
        }

        setReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error(
            "[AdminAuthGuard]",
            e instanceof Error ? e.message : "Auth verification failed",
          );
          clearSession();
          router.replace("/auth/login");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8 text-gray-500">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
