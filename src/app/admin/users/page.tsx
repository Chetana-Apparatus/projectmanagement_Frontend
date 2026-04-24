"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/common/toast/ToastProvider";
import UserForm, {
  type UserFormValues,
} from "@/components/common/users/UserForm";
import UserTable, {
  type UserRecord,
} from "@/components/common/users/UserTable";
import Button from "@/components/ui/Button";

const seededUsers: UserRecord[] = [
  {
    id: "u-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@apparatus.com",
    role: "Admin",
    status: "Active",
  },
  {
    id: "u-2",
    firstName: "Aisha",
    lastName: "Miller",
    email: "aisha.miller@apparatus.com",
    role: "BA",
    status: "Active",
  },
];

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>(seededUsers);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  const editingUser = useMemo(
    () => users.find((user) => user.id === editingUserId) ?? null,
    [editingUserId, users],
  );

  const closeForm = () => {
    setFormMode(null);
    setEditingUserId(null);
  };

  const handleCreate = (values: UserFormValues) => {
    const newUser: UserRecord = {
      id: `u-${Date.now()}`,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
      status: values.status,
    };

    setUsers((prev) => [newUser, ...prev]);
    showToast("User created successfully", "success");
    closeForm();
  };

  const handleUpdate = (values: UserFormValues) => {
    if (!editingUserId) return;

    setUsers((prev) =>
      prev.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              role: values.role,
              status: values.status,
            }
          : user,
      ),
    );

    showToast("User updated successfully", "success");
    closeForm();
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setUsers((prev) => prev.filter((user) => user.id !== deleteTarget.id));
    showToast("User deleted successfully", "success");
    setDeleteTarget(null);
  };

  useEffect(() => {
    const isModalOpen = Boolean(formMode || deleteTarget);
    const { overflow } = document.body.style;
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [formMode, deleteTarget]);

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="h3 font-bold">User Management</h3>
          <p className="p1  text-gray-500">
            Manage users, roles, and account status.
          </p>
        </div>

        <Button onClick={() => setFormMode("create")}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* TABLE */}
      <UserTable
        users={users}
        onEdit={(user) => {
          setEditingUserId(user.id);
          setFormMode("edit");
        }}
        onDelete={(user) => setDeleteTarget(user)}
      />

      {/* ✅ FORM MODAL */}
      {formMode && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeForm}
            aria-label="Close modal"
          />
          <div className="relative z-50 w-full max-w-2xl space-y-3 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={closeForm}
                aria-label="Close user form"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <UserForm
                mode={formMode}
                initialValues={
                  formMode === "edit" ? (editingUser ?? undefined) : undefined
                }
                onCancel={closeForm}
                onSubmit={formMode === "create" ? handleCreate : handleUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-5 rounded-xl shadow-lg max-w-md w-full">
            <h3 className="h3 font-semibold">Delete User</h3>
            <p className="p1 text-gray-500 mt-2">
              Are you sure you want to delete this user?
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 text-white"
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
