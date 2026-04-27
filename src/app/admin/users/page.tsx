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

export default function AdminUsersPage() {
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

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

  const handleCreate = (values: UserFormValues) => {
    const newUser: UserRecord = {
      id: Date.now().toString(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      designation: values.designation,
      developerType: values.developerType,
      techStack: values.techStack,
      role: "Employee",
      status: "Active", // ✅ AUTO STATUS
    };

    setUsers((prev) => [newUser, ...prev]);
    showToast("User created successfully", "success");
    closeForm();
  };

  const handleUpdate = (values: UserFormValues) => {
    if (!editingUserId) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              designation: values.designation,
              developerType: values.developerType,
              techStack: values.techStack,
              role: u.role,
              status: "Active", // ✅ KEEP ACTIVE
            }
          : u,
      ),
    );

    showToast("User updated successfully", "success");
    closeForm();
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="h3">User Management</h2>
        <Button onClick={() => setFormMode("create")}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      {/* TABLE */}
      <UserTable
        users={users}
        onEdit={(u) => {
          setEditingUserId(u.id);
          setFormMode("edit");
        }}
        onDelete={(u) => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
      />

      {/* MODAL */}
      {formMode && (
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
              mode={formMode}
              initialValues={editingUser || undefined}
              onCancel={closeForm}
              onSubmit={formMode === "create" ? handleCreate : handleUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
