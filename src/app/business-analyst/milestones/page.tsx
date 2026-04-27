"use client";

import { Progress, Table, type TableColumnsType } from "antd";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MilestoneForm, {
  type MilestoneFormValues,
  type SelectOption,
} from "@/components/common/milestones/MilestoneForm";
import type { MilestoneRecord } from "@/components/common/milestones/MilestoneTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

const projects: SelectOption[] = [
  { id: "prj-101", label: "Project Atlas" },
  { id: "prj-102", label: "Project Beacon" },
  { id: "prj-103", label: "Project Horizon" },
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

export default function BAMilestonesPage() {
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

  const projectNameMap = useMemo(
    () =>
      projects.reduce<Record<string, string>>((acc, project) => {
        acc[project.id] = project.label;
        return acc;
      }, {}),
    [],
  );
  const columns: TableColumnsType<MilestoneRecord> = [
    {
      title: "PROJECT NAME",
      dataIndex: "projectId",
      key: "projectId",
      render: (projectId: string) => projectNameMap[projectId] ?? projectId,
    },
    { title: "MILESTONE NAME", dataIndex: "name", key: "name" },
    { title: "START DATE", dataIndex: "startDate", key: "startDate" },
    { title: "END DATE", dataIndex: "endDate", key: "endDate" },
    {
      title: "PROGRESS",
      key: "progress",
      render: (_, row) => {
        const percent = calculateProgress(row.startDate, row.endDate);
        return (
          <div className="min-w-[140px] max-w-[180px]">
            <Progress
              percent={percent}
              strokeColor={getProgressColor(percent)}
              size="small"
              format={(value) => `${value ?? 0}%`}
            />
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center border-sky-200 text-sky-600 hover:border-sky-200 hover:bg-sky-50"
            onClick={() => {
              setEditingMilestoneId(row.id);
              setFormMode("edit");
            }}
            aria-label={`Edit milestone ${row.name}`}
          >
            <Pencil size={16} />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex h-8 w-8 items-center justify-center border-red-200 text-red-600 hover:border-red-200 hover:bg-red-50"
            onClick={() => setDeleteTarget(row)}
            aria-label={`Delete milestone ${row.name}`}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

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
    assignedEmployees: [],
    watchers: [],
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
    if (!isModalOpen) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
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

      <Table<MilestoneRecord>
        rowKey="id"
        columns={columns}
        dataSource={milestones}
        bordered
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 920 }}
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
