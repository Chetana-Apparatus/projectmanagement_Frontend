"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import UserForm, {
  type UserFormValues,
} from "@/components/common/users/UserForm";
import UserTable, {
  type UserRecord,
} from "@/components/common/users/UserTable";
import Button from "@/components/ui/Button";
import { useLoader } from "@/context/LoaderContext";
import {
  type ApiUser,
  apiUserToRecord,
  userFormToCreateBody,
  userFormToPatchBody,
} from "@/lib/admin-mappers";
import { apiFetch, postJson } from "@/lib/api-client";
import { drfDelete, fetchAllPages } from "@/lib/pms-http";

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
  const [developerTypeFilter, setDeveloperTypeFilter] = useState("");
  const [techStackFilter, setTechStackFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

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

  const techStackOptions = useMemo(
    () =>
      Array.from(new Set(users.flatMap((user) => user.techStack)))
        .map((stack) => stack.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [users],
  );

  const designationOptions = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.designation.trim())))
        .filter((designation) => designation && designation !== "-")
        .sort((a, b) => a.localeCompare(b)),
    [users],
  );

  const developerTypeOptions = useMemo(
    () =>
      Array.from(new Set(users.map((user) => user.developerType.trim())))
        .filter((developerType) => developerType && developerType !== "-")
        .sort((a, b) => a.localeCompare(b)),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const nameQuery = nameFilter.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.trim();
      if (nameQuery && !fullName.toLowerCase().includes(nameQuery)) {
        return false;
      }
      if (designationFilter && user.designation !== designationFilter) {
        return false;
      }
      if (developerTypeFilter && user.developerType !== developerTypeFilter) {
        return false;
      }
      if (
        techStackFilter &&
        !user.techStack.some(
          (stack) => stack.toLowerCase() === techStackFilter.toLowerCase(),
        )
      ) {
        return false;
      }
      if (roleFilter && user.role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [
    users,
    nameFilter,
    designationFilter,
    developerTypeFilter,
    techStackFilter,
    roleFilter,
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
      showToast(e instanceof Error ? e.message : "Create failed", "error");
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
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (u: UserRecord) => {
    if (!confirm(`Remove user ${u.email}?`)) return;
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
        <h2 className="h3">User Management</h2>
        <Button onClick={() => setFormMode("create")}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : null}
      {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-x-2.5 overflow-x-auto py-0.5 sm:gap-x-3">
          <input
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filter by name"
          />
          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={designationFilter}
            onChange={(e) => setDesignationFilter(e.target.value)}
          >
            <option value="">All designations</option>
            {designationOptions.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </select>
          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={developerTypeFilter}
            onChange={(e) => setDeveloperTypeFilter(e.target.value)}
          >
            <option value="">All developer types</option>
            {developerTypeOptions.map((developerType) => (
              <option key={developerType} value={developerType}>
                {developerType}
              </option>
            ))}
          </select>
          <select
            className="h-10 min-w-[12rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={techStackFilter}
            onChange={(e) => setTechStackFilter(e.target.value)}
          >
            <option value="">All tech stacks</option>
            {techStackOptions.map((stack) => (
              <option key={stack} value={stack}>
                {stack}
              </option>
            ))}
          </select>
          <select
            className="h-10 min-w-[10rem] rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="BA">BA</option>
            <option value="Employee">Employee</option>
          </select>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setNameFilter("");
              setDesignationFilter("");
              setDeveloperTypeFilter("");
              setTechStackFilter("");
              setRoleFilter("");
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

          <div className="relative w-full max-w-xl">
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
