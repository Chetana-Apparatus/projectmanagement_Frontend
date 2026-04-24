"use client";

import { useEffect, useState } from "react";

export type UserRole = "admin" | "BA" | "Employee";

const VALID_ROLES: UserRole[] = ["admin", "BA", "Employee"];

export function useRole(defaultRole: UserRole = "Employee") {
  const [role, setRole] = useState<UserRole>(defaultRole);

  useEffect(() => {
    const storedRole = window.localStorage.getItem("user_role");
    if (storedRole && VALID_ROLES.includes(storedRole as UserRole)) {
      setRole(storedRole as UserRole);
    }
  }, []);

  return role;
}
