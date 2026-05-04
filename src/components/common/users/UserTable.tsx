"use client";

import { Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/common/status/StatusBadge";
import DataTable, {
  type DataTableColumn,
} from "@/components/common/table/DataTable";
import Button from "@/components/ui/Button";

export type UserRole = "Admin" | "BA" | "Employee";
export type UserStatus = "Active" | "Deactivated";

export type UserRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  developerType: string;
  techStack: string[];
  /** Raw `tech_notes` from API (edit form). */
  techNotes?: string;
  /** Raw `tech_stack` enum from API when `tech_notes` is empty. */
  apiTechStack?: string | null;
  role: UserRole;
  status: UserStatus;
};

type UserTableProps = {
  users: UserRecord[];
  onEdit: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
};

export default function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const columns: DataTableColumn[] = [
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Email", key: "email" },
    { label: "Designation", key: "designation" },
    { label: "Developer Type", key: "developerType" },
    { label: "Tech Stack", key: "techStack" },
    { label: "Role", key: "role" },
    { label: "Status", key: "status" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <DataTable<UserRecord>
      columns={columns}
      data={users}
      emptyMessage="No users found"
      renderers={{
        firstName: (row) => (
          <span className="break-words whitespace-normal">
            {row.firstName || "-"}
          </span>
        ),
        lastName: (row) => (
          <span className="break-words whitespace-normal">
            {row.lastName || "-"}
          </span>
        ),
        email: (row) => (
          <span className="break-all whitespace-normal">
            {row.email || "-"}
          </span>
        ),
        designation: (row) => (
          <span className="break-words whitespace-normal">
            {row.designation || "-"}
          </span>
        ),
        developerType: (row) => (
          <span className="break-words whitespace-normal">
            {row.developerType || "-"}
          </span>
        ),
        techStack: (row) => (
          <span className="break-words whitespace-normal">
            {row.techStack.length > 0 ? row.techStack.join(", ") : "-"}
          </span>
        ),
        status: (row) => (
          <StatusBadge
            variant={row.status === "Active" ? "active" : "deactivated"}
          >
            {row.status}
          </StatusBadge>
        ),
        actions: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-sky-200 !text-sky-600 hover:border-sky-200 hover:bg-sky-50 hover:!text-sky-700"
              onClick={() => onEdit(row)}
            >
              <Pencil size={16} />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex h-8 w-8 items-center justify-center border-red-200 !text-red-600 hover:border-red-200 hover:bg-red-50 hover:!text-red-700"
              onClick={() => onDelete(row)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      }}
    />
  );
}
