"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MilestoneForm, {
  type MilestoneFormValues,
  type SelectOption,
} from "@/components/common/milestones/MilestoneForm";
import MilestoneTable, {
  type MilestoneRecord,
} from "@/components/common/milestones/MilestoneTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";

const projects: SelectOption[] = [
  { id: "prj-101", label: "Project Atlas" },
  { id: "prj-102", label: "Project Beacon" },
  { id: "prj-103", label: "Project Horizon" },
];

const employees: SelectOption[] = [
  { id: "emp-1", label: "Ava Patel" },
  { id: "emp-2", label: "Ethan Wilson" },
  { id: "emp-3", label: "Noah Sharma" },
  { id: "emp-4", label: "Mia Santos" },
  { id: "emp-5", label: "Liam Johnson" },
];

const watchers: SelectOption[] = [
  { id: "ba-1", label: "Sophia Turner" },
  { id: "ba-2", label: "Oliver Khan" },
  { id: "ba-3", label: "Aria Singh" },
];

const seededMilestones: MilestoneRecord[] = [
  {
    id: "ms-1",
    projectId: "prj-101",
    name: "Requirements Sign-off",
    startDate: "2026-04-05",
    endDate: "2026-04-12",
    deadline: "2026-04-14",
    assignedEmployees: ["Ava Patel", "Ethan Wilson"],
    watchers: ["Sophia Turner"],
  },
  {
    id: "ms-2",
    projectId: "prj-102",
    name: "UI Prototype Completion",
    startDate: "2026-04-08",
    endDate: "2026-04-18",
    deadline: "2026-04-20",
    assignedEmployees: ["Noah Sharma", "Mia Santos", "Liam Johnson"],
    watchers: ["Oliver Khan", "Aria Singh"],
  },
];

const optionLabelById = (options: SelectOption[]) =>
  options.reduce<Record<string, string>>((acc, option) => {
    acc[option.id] = option.label;
    return acc;
  }, {});

export default function AdminMilestonesPage() {
  const { showToast } = useToast();
  const [milestones, setMilestones] =
    useState<MilestoneRecord[]>(seededMilestones);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<MilestoneRecord | null>(
    null,
  );

  const employeeNameMap = useMemo(() => optionLabelById(employees), []);
  const watcherNameMap = useMemo(() => optionLabelById(watchers), []);

  const editingMilestone = useMemo(
    () =>
      milestones.find((milestone) => milestone.id === editingMilestoneId) ??
      null,
    [editingMilestoneId, milestones],
  );

  const initialValues = useMemo<MilestoneFormValues | undefined>(() => {
    if (!editingMilestone) return undefined;
    return {
      projectId: editingMilestone.projectId,
      name: editingMilestone.name,
      startDate: editingMilestone.startDate,
      endDate: editingMilestone.endDate,
      deadline: editingMilestone.deadline,
      assignedEmployeeIds: editingMilestone.assignedEmployees
        .map(
          (employeeName) =>
            employees.find((employee) => employee.label === employeeName)?.id,
        )
        .filter((value): value is string => Boolean(value)),
      watcherIds: editingMilestone.watchers
        .map(
          (watcherName) =>
            watchers.find((watcher) => watcher.label === watcherName)?.id,
        )
        .filter((value): value is string => Boolean(value)),
    };
  }, [editingMilestone]);

  const closeForm = () => {
    setFormMode(null);
    setEditingMilestoneId(null);
  };

  const createRecordFromValues = (
    id: string,
    values: MilestoneFormValues,
  ): MilestoneRecord => ({
    id,
    projectId: values.projectId,
    name: values.name.trim(),
    startDate: values.startDate,
    endDate: values.endDate,
    deadline: values.deadline,
    assignedEmployees: values.assignedEmployeeIds.map(
      (employeeId) => employeeNameMap[employeeId] ?? employeeId,
    ),
    watchers: values.watcherIds.map(
      (watcherId) => watcherNameMap[watcherId] ?? watcherId,
    ),
  });

  const handleCreate = (values: MilestoneFormValues) => {
    const nextMilestone = createRecordFromValues(`ms-${Date.now()}`, values);
    setMilestones((prev) => [nextMilestone, ...prev]);
    showToast("Milestone created successfully", "success");
    closeForm();
  };

  const handleUpdate = (values: MilestoneFormValues) => {
    if (!editingMilestoneId) return;

    const updatedMilestone = createRecordFromValues(editingMilestoneId, values);
    setMilestones((prev) =>
      prev.map((item) =>
        item.id === editingMilestoneId ? updatedMilestone : item,
      ),
    );
    showToast("Milestone updated successfully", "success");
    closeForm();
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMilestones((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    showToast("Milestone deleted successfully", "success");
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="h3">Milestone Management</h3>
          <p className="ui-body-muted">
            Plan project milestones, assign employees, and track stakeholder
            watchers.
          </p>
        </div>
        <Button type="button" onClick={() => setFormMode("create")}>
          <Plus size={16} />
          Add Milestone
        </Button>
      </div>

      <MilestoneTable
        milestones={milestones}
        onEdit={(milestone) => {
          setEditingMilestoneId(milestone.id);
          setFormMode("edit");
        }}
        onDelete={(milestone) => setDeleteTarget(milestone)}
      />

      {formMode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeForm}
            aria-label="Close modal"
          />
          <div className="relative z-50 w-full max-w-4xl space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9"
                onClick={closeForm}
                aria-label="Close milestone form"
              >
                <X size={16} />
              </Button>
            </div>

            <MilestoneForm
              mode={formMode}
              projects={projects}
              employees={employees}
              watchers={watchers}
              initialValues={formMode === "edit" ? initialValues : undefined}
              onCancel={closeForm}
              onSubmit={formMode === "create" ? handleCreate : handleUpdate}
            />
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-lg">
            <h2 className="h3">Delete Milestone</h2>
            <p className="ui-body mt-2">
              Are you sure you want to delete this milestone?
            </p>
            <p className="ui-caption mt-1 text-gray-600">{deleteTarget.name}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:ring-red-200"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
