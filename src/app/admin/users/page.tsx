"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import UserForm, {
  USER_EMAIL_USERNAME_HINT,
  type UserFormValues,
} from "@/components/common/users/UserForm";
import UserTable, {
  type UserRecord,
  type UserRole,
} from "@/components/common/users/UserTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useLoader } from "@/context/LoaderContext";
import {
  type ApiUser,
  apiUserToRecord,
  userFormToCreateBody,
  userFormToPatchBody,
} from "@/lib/admin-mappers";
import { apiFetch, postJson } from "@/lib/api-client";
import { drfDelete, fetchAllPages } from "@/lib/pms-http";

function userCreateUpdateErrorToastMessage(message: string): string {
  const m = message.trim();
  if (/email|username|e-mail|domain|unique|exists|@|address/i.test(m)) {
    return `${m} — ${USER_EMAIL_USERNAME_HINT}`;
  }
  return m;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { setLoading: setGlobalLoading } = useLoader();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [developerTypeFilter, setDeveloperTypeFilter] = useState("");
  const [techStackFilter, setTechStackFilter] = useState("");

  const loadUsers = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    setGlobalLoading(true);
    try {
      const rows = await fetchAllPages<ApiUser>("/api/v1/users/");
      setUsers(rows.map(apiUserToRecord));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load users");
      showToast("Something went wrong", "error");
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }, [setGlobalLoading, showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!formMode) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [formMode]);

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingUserId) ?? null,
    [users, editingUserId],
  );

  const designationOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const u of users) {
      const d = u.designation?.trim();
      if (d) seen.add(d);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const hasUsersWithoutDesignation = useMemo(
    () => users.some((u) => !u.designation?.trim()),
    [users],
  );

  const developerTypeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const u of users) {
      const d = u.developerType?.trim();
      if (d && d !== "-") seen.add(d);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const hasUsersWithoutDeveloperType = useMemo(
    () =>
      users.some((u) => {
        const d = (u.developerType ?? "").trim();
        return !d || d === "-";
      }),
    [users],
  );

  const techStackOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const u of users) {
      for (const t of u.techStack) {
        const s = t?.trim();
        if (s) seen.add(s);
      }
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const hasUsersWithoutTechStack = useMemo(
    () => users.some((u) => u.techStack.length === 0),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    return users.filter((u) => {
      if (q) {
        const fn = (u.firstName ?? "").toLowerCase();
        const ln = (u.lastName ?? "").toLowerCase();
        const full = `${fn} ${ln}`.trim();
        if (!fn.includes(q) && !ln.includes(q) && !full.includes(q)) {
          return false;
        }
      }
      if (designationFilter) {
        if (designationFilter === "__none__") {
          if ((u.designation ?? "").trim()) return false;
        } else if (u.designation !== designationFilter) {
          return false;
        }
      }
      if (roleFilter && u.role !== roleFilter) return false;
      if (developerTypeFilter) {
        if (developerTypeFilter === "__none__") {
          const d = (u.developerType ?? "").trim();
          if (d && d !== "-") return false;
        } else if (u.developerType !== developerTypeFilter) {
          return false;
        }
      }
      if (techStackFilter) {
        if (techStackFilter === "__none__") {
          if (u.techStack.length > 0) return false;
        } else {
          const needle = techStackFilter.toLowerCase();
          const hit = u.techStack.some((t) => t.toLowerCase() === needle);
          if (!hit) return false;
        }
      }
      return true;
    });
  }, [
    users,
    nameFilter,
    designationFilter,
    roleFilter,
    developerTypeFilter,
    techStackFilter,
  ]);

  const closeForm = () => {
    setFormMode(null);
    setEditingUserId(null);
  };

  const handleCreate = async (values: UserFormValues) => {
    setGlobalLoading(true);
    try {
      const body = userFormToCreateBody(values);
      const res = await postJson<ApiUser>("/api/v1/users/", body);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Create failed");
      }
      showToast(res.message ?? "User created successfully", "success");
      closeForm();
      await loadUsers();
    } catch (e) {
      showToast(
        userCreateUpdateErrorToastMessage(
          e instanceof Error ? e.message : "Create failed",
        ),
        "error",
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdate = async (values: UserFormValues) => {
    if (!editingUserId) return;
    setGlobalLoading(true);
    try {
      const body = userFormToPatchBody({
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        designation: values.designation,
        developerType: values.developerType,
        techStack: values.techStack,
        techOther: values.techOther,
        password: values.password.trim() ? values.password : undefined,
      });
      const res = await apiFetch<ApiUser>(`/api/v1/users/${editingUserId}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.success || !res.data) {
        throw new Error(res.message || "Update failed");
      }
      showToast(res.message ?? "User updated successfully", "success");
      closeForm();
      await loadUsers();
    } catch (e) {
      showToast(
        userCreateUpdateErrorToastMessage(
          e instanceof Error ? e.message : "Update failed",
        ),
        "error",
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (u: UserRecord) => {
    setGlobalLoading(true);
    try {
      await drfDelete(`/api/v1/users/${u.id}/`);
      showToast("User deleted", "success");
      await loadUsers();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h2 className="h2 font-semibold">User Management</h2>
        <Button onClick={() => setFormMode("create")}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 2xl:items-center">
          <Input
            className="h-10 border-cs-border bg-white text-sm text-cs-text"
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            aria-label="Filter by name"
          />
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
            aria-label="Filter by designation"
          >
            <option value="">All designations</option>
            {hasUsersWithoutDesignation ? (
              <option value="__none__">No designation</option>
            ) : null}
            {designationOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter((e.target.value || "") as UserRole | "")
            }
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="BA">BA</option>
            <option value="Employee">Employee</option>
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={developerTypeFilter}
            onChange={(e) => setDeveloperTypeFilter(e.target.value)}
            aria-label="Filter by developer type"
          >
            <option value="">All developer types</option>
            {hasUsersWithoutDeveloperType ? (
              <option value="__none__">No developer type</option>
            ) : null}
            {developerTypeOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="h-10 w-full min-w-0 rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={techStackFilter}
            onChange={(e) => setTechStackFilter(e.target.value)}
            aria-label="Filter by tech stack"
          >
            <option value="">All tech stacks</option>
            {hasUsersWithoutTechStack ? (
              <option value="__none__">No tech stack</option>
            ) : null}
            {techStackOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="h-10 w-full justify-center px-5 2xl:shrink-0"
            onClick={() => {
              setNameFilter("");
              setDesignationFilter("");
              setRoleFilter("");
              setDeveloperTypeFilter("");
              setTechStackFilter("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      <UserTable
        users={filteredUsers}
        onEdit={(u) => {
          setEditingUserId(u.id);
          setFormMode("edit");
        }}
        onDelete={handleDelete}
      />

      {formMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0"
            onClick={closeForm}
          />

          <div className="relative z-50 w-full max-w-4xl">
            <UserForm
              key={formMode === "create" ? "create" : (editingUserId ?? "edit")}
              mode={formMode}
              initialValues={editingUser || undefined}
              onCancel={closeForm}
              onSubmit={formMode === "create" ? handleCreate : handleUpdate}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
