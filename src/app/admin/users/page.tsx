"use client";

import { Plus, X } from "lucide-react";
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

      <UserTable
        users={users}
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
            <div className="mb-2 flex justify-end">
              <Button variant="secondary" size="icon" onClick={closeForm}>
                <X size={16} />
              </Button>
            </div>

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
