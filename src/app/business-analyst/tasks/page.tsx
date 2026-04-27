"use client";

import { Progress, Table, type TableColumnsType } from "antd";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import TaskForm, {
  type TaskFormValues,
} from "@/components/common/tasks/TaskForm";
import type { Task } from "@/components/common/tasks/TaskTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";
import { calculateProgress, getProgressColor } from "@/utils/progress";

export default function BATasksPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const employees = [
    { id: "emp-1", name: "Anita Sharma" },
    { id: "emp-2", name: "Ravi Verma" },
    { id: "emp-3", name: "Nisha Gupta" },
    { id: "emp-4", name: "Karan Singh" },
  ];
  const employeeNameById = Object.fromEntries(
    employees.map((employee) => [employee.id, employee.name]),
  );

  const columns: TableColumnsType<Task> = [
    { title: "TASK NAME", dataIndex: "name", key: "name" },
    {
      title: "ASSIGNED BY",
      dataIndex: "assignedBy",
      key: "assignedBy",
      render: (assignedBy: string) =>
        employeeNameById[assignedBy] ?? assignedBy,
    },
    { title: "STATUS", dataIndex: "status", key: "status" },
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
  ];

  const handleSubmit = (data: TaskFormValues) => {
    // Backend should derive watcher from logged-in BA session.
    // Frontend sends assignedBy only; watcher is intentionally omitted.
    if (editing) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...t, ...data, employee: t.employee } : t,
        ),
      );
      showToast("Task updated successfully", "success");
    } else {
      setTasks((prev) => [
        {
          ...data,
          id: Date.now().toString(),
          employee: "",
        },
        ...prev,
      ]);
      showToast("Task created successfully", "success");
    }

    closeModal();
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between">
        <h1 className="ui-page-title">Tasks</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add Task
        </Button>
      </div>

      <Table<Task>
        rowKey="id"
        columns={columns}
        dataSource={tasks}
        bordered
        locale={{ emptyText: "No tasks found" }}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 760 }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="pointer-events-none relative z-50 my-6 w-full max-w-xl space-y-2">
            <div className="pointer-events-auto flex justify-end">
              <Button variant="secondary" size="icon" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <TaskForm
                initial={editing}
                employees={employees}
                showAssignedBy
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
