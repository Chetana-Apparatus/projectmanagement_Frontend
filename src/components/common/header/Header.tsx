"use client";

import { Bell, LogOut, Menu, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLogout } from "@/hooks/useLogout";
import type { UserRole } from "@/hooks/useRole";

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

const Header = ({ role, onToggleMobileSidebar }: HeaderProps) => {
  const USER_NAME_KEY = "userName";
  const USER_AVATAR_KEY = "userAvatar";
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("John Doe");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useLogout();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const syncUserProfile = () => {
      const storedName = window.localStorage.getItem(USER_NAME_KEY);
      const storedAvatar = window.localStorage.getItem(USER_AVATAR_KEY);

      setUserName(storedName?.trim() || "John Doe");
      setUserAvatar(storedAvatar || null);
    };

    syncUserProfile();
    window.addEventListener("userUpdate", syncUserProfile);

    return () => {
      window.removeEventListener("userUpdate", syncUserProfile);
    };
  }, []);

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 transition-all duration-300 lg:left-[var(--sidebar-width)] lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex rounded-md p-2 text-cs-text hover:bg-cs-primary-100/10 lg:hidden"
          onClick={onToggleMobileSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
        {/* <div className="h-8 w-8 rounded-md bg-cs-primary-100/30 ring-1 ring-cs-primary-100/40" />
        <span className="text-sm font-semibold text-cs-heading">Apparatus Portal</span> */}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-cs-text hover:bg-cs-primary-100/10"
          aria-label="Open notifications"
        >
          <Bell size={18} />
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"
            aria-hidden
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-cs-primary-100/10"
            aria-label="Open profile menu"
          >
            <div className="h-9 w-9 rounded-full bg-cs-primary-100/30 ring-1 ring-cs-primary-100/40 overflow-hidden flex items-center justify-center">
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt={userName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <User size={16} className="text-cs-text" />
              )}
            </div>
            <div className="hidden text-left sm:block">
              <p className="font-heading  font-semibold text-cs-heading">
                {userName}
              </p>
              <p className="p1!tracking-normal !leading-normal">
                {roleLabel[role]}
              </p>
            </div>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-white p-1 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-cs-text hover:bg-cs-primary-100/10"
                onClick={() => {
                  setOpen(false);
                  router.push("/admin/settings");
                }}
              >
                <User size={16} />
                <span className="font-medium">Profile</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut size={14} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
