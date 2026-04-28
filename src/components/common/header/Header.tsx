"use client";

import { Bell, LogOut, Menu, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLogout } from "@/hooks/useLogout";
import type { UserRole } from "@/hooks/useRole";
import type { NotificationRow } from "@/lib/admin-dashboard-api";
import { apiFetch } from "@/lib/api-client";

type HeaderProps = {
  role: UserRole;
  collapsed: boolean;
  onToggleMobileSidebar: () => void;
};

const roleLabel: Record<UserRole, string> = {
  admin: "Admin",
  BA: "BA",
  Employee: "Employee",
};

const settingsRouteByRole: Record<UserRole, string> = {
  admin: "/admin/settings",
  BA: "/business-analyst",
  Employee: "/employee/settings",
};

const Header = ({ role, collapsed, onToggleMobileSidebar }: HeaderProps) => {
  const USER_NAME_KEY = "userName";
  const USER_AVATAR_KEY = "userAvatar";

  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const canManageProfile = role !== "BA";

  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync user data
  useEffect(() => {
    const syncUserProfile = () => {
      const storedName = localStorage.getItem(USER_NAME_KEY);
      const storedAvatar = localStorage.getItem(USER_AVATAR_KEY);

      setUserName(storedName?.trim() || "User");
      setUserAvatar(storedAvatar || null);
    };

    syncUserProfile();
    window.addEventListener("userUpdate", syncUserProfile);

    return () => {
      window.removeEventListener("userUpdate", syncUserProfile);
    };
  }, []);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const res = await apiFetch<{
          first_name?: string;
          last_name?: string;
          email?: string;
        }>("/api/v1/auth/me", { method: "GET" });
        if (!res.success || !res.data) return;
        const fullName =
          `${res.data.first_name ?? ""} ${res.data.last_name ?? ""}`.trim() ||
          res.data.email ||
          "User";
        setUserName(fullName);
        localStorage.setItem(USER_NAME_KEY, fullName);
      } catch {
        // keep local fallback
      }
    };
    void loadCurrentUser();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ results?: NotificationRow[] }>(
        "/api/v1/notifications/?page_size=12",
        { method: "GET" },
      );
      if (res.success && res.data?.results) {
        setNotifications(res.data.results);
      }
    } catch {
      // silent in header
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markNotificationRead = async (notificationId: number) => {
    try {
      const res = await apiFetch<{ id: number }>(
        `/api/v1/notifications/${notificationId}/read/`,
        { method: "PATCH", body: JSON.stringify({}) },
      );
      if (!res.success) return;
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    } catch {
      // no-op
    }
  };

  return (
    <header
      className={`
        fixed top-0 right-0 z-20 flex h-16 items-center justify-between
        border-b border-border bg-white px-4 lg:px-5
        transition-all duration-300
        ${collapsed ? "lg:left-[80px]" : "lg:left-[240px]"}
      `}
    >
      {/* LEFT SECTION */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex rounded-md p-2 text-cs-text hover:bg-cs-primary-100/10 lg:hidden"
          onClick={onToggleMobileSidebar}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-2 pr-1">
        {/* Notification */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              void loadNotifications();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-cs-primary-100/10"
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            ) : null}
          </button>

          {notificationOpen ? (
            <div className="absolute right-0 mt-2 max-h-[360px] w-[340px] overflow-hidden rounded-lg border border-border bg-white shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <p className="text-sm font-semibold text-cs-heading">
                  Notifications
                </p>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-cs-text">
                    No notifications
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        void markNotificationRead(n.id);
                      }}
                      className="w-full border-b border-border/60 px-3 py-2 text-left hover:bg-cs-primary-100/10"
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read ? (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                        ) : (
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-cs-heading">
                            {n.title}
                          </p>
                          {n.message ? (
                            <p className="text-xs text-cs-text">{n.message}</p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Profile */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-cs-primary-100/10"
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-cs-primary-100/30 overflow-hidden flex items-center justify-center">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <User size={14} />
              )}
            </div>

            {/* Name + Role */}
            <div className="hidden sm:flex flex-col leading-none">
              <p className="text-sm font-semibold text-cs-heading whitespace-nowrap">
                {userName}
              </p>
              <p className="text-[11px] text-cs-text mt-[2px] whitespace-nowrap">
                {roleLabel[role]}
              </p>
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-white p-1 shadow-lg">
              {canManageProfile ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(settingsRouteByRole[role]);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-cs-primary-100/10"
                >
                  <User size={16} />
                  Profile
                </button>
              ) : null}

              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
