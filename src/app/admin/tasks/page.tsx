"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import TaskForm from "@/components/common/tasks/TaskForm";
import TaskTable, { type Task } from "@/components/common/tasks/TaskTable";
import { useToast } from "@/components/common/toast/ToastProvider";
import Button from "@/components/ui/Button";

export default function TaskPage() {
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const handleSubmit = (data: Omit<Task, "id">) => {
    if (editing) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editing.id ? { ...t, ...data } : t)),
      );
      showToast("Task updated successfully", "success");
    } else {
      setTasks((prev) => [{ ...data, id: Date.now().toString() }, ...prev]);
      showToast("Task created successfully", "success");
    }

    closeModal();
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <h1 className="ui-page-title">Tasks</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Add Task
        </Button>
      </div>

      <TaskTable
        tasks={tasks}
        onEdit={(t) => {
          setEditing(t);
          setOpen(true);
        }}
        onDelete={(t) => {
          setTasks((prev) => prev.filter((x) => x.id !== t.id));
          showToast("Task deleted successfully", "success");
        }}
      />

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={closeModal}
            aria-label="Close modal"
          />
          <div className="relative z-50 my-6 w-full max-w-3xl space-y-2 pointer-events-none">
            <div className="flex justify-end pointer-events-auto">
              <Button variant="secondary" size="icon" onClick={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <div className="pointer-events-auto">
              <TaskForm
                initial={editing}
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
