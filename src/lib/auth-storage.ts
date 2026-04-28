const ACCESS = "pms_access_token";
const REFRESH = "pms_refresh_token";
const USER = "pms_user";

export type StoredUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string | null;
};

export function getStoredAccess(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS);
}

export function getStoredRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function persistSession(payload: {
  access: string;
  refresh: string;
  user: StoredUser;
}): void {
  window.localStorage.setItem(ACCESS, payload.access);
  window.localStorage.setItem(REFRESH, payload.refresh);
  window.localStorage.setItem(USER, JSON.stringify(payload.user));
  window.localStorage.removeItem("user_role");
}

export function clearSession(): void {
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
  window.localStorage.removeItem(USER);
  window.localStorage.removeItem("user_role");
}
