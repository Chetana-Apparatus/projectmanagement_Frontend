"use client";

import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const logout = () => {
    window.localStorage.removeItem("user_role");
    window.localStorage.removeItem("auth_token");
    router.replace("/auth/login");
  };

  return logout;
}
