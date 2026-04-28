"use client";

import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import type { Task } from "@/components/common/tasks/TaskTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const statuses = [
  "Not Started",
  "In Progress",
  "Paused",
  "Stopped",
  "Completed",
] as const;

type EmployeeOption = {
  id: string;
  name: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

type MilestoneOption = {
  id: string;
  name: string;
  projectId: string;
};

export type TaskFormValues = {
  name: string;
  project: string;
  milestone: string;
  assignedBy: string;
  startDate: string;
  endDate: string;
  status: Task["status"];
};

type TaskFormProps = {
  initial?: Task | null;
  employees?: EmployeeOption[];
  projects?: ProjectOption[];
  milestones?: MilestoneOption[];
  showAssignedBy?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
};

const emptyForm: TaskFormValues = {
  name: "",
  project: "",
  milestone: "",
  assignedBy: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
};

export default function TaskForm({
  initial,
  employees = [],
  projects = [],
  milestones = [],
  showAssignedBy = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormValues>(
    initial
      ? {
          name: initial.name,
          project: initial.project,
          milestone: initial.milestone,
          assignedBy: initial.assignedBy,
          startDate: initial.startDate,
          endDate: initial.endDate,
          status: initial.status,
        }
      : emptyForm,
  );

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        project: initial.project,
        milestone: initial.milestone,
        assignedBy: initial.assignedBy,
        startDate: initial.startDate,
        endDate: initial.endDate,
        status: initial.status,
      });
      return;
    }
    setForm(emptyForm);
  }, [initial]);

  const availableMilestones = form.project
    ? milestones.filter((milestone) => milestone.projectId === form.project)
    : milestones;

  return (
    <Card className="w-full !flex-col !items-start !justify-start p-6">
      <form
        className="w-full space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        {/* HEADER */}
        <div className="w-full text-center">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit Task" : "Add Task"}
          </h2>
        </div>

        {/* FORM */}
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {/* TASK NAME */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="task-name" className="text-sm font-medium">
              Task Name
            </label>
            <Input
              id="task-name"
              placeholder="Enter task name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* PROJECT */}
          <div className="space-y-1.5">
            <label htmlFor="task-project" className="text-sm font-medium">
              Project
            </label>
            <select
              id="task-project"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={form.project}
              onChange={(e) =>
                setForm({
                  ...form,
                  project: e.target.value,
                  milestone: "",
                })
              }
              required
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* MILESTONE */}
          <div className="space-y-1.5">
            <label htmlFor="task-milestone" className="text-sm font-medium">
              Milestone
            </label>
            <select
              id="task-milestone"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={form.milestone}
              onChange={(e) => setForm({ ...form, milestone: e.target.value })}
              required
              disabled={!form.project}
            >
              <option value="">
                {form.project ? "Select milestone" : "Select project first"}
              </option>
              {availableMilestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.name}
                </option>
              ))}
            </select>
          </div>

          {showAssignedBy && (
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="task-assigned-by" className="text-sm font-medium">
                Assigned By
              </label>
              <select
                id="task-assigned-by"
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={form.assignedBy}
                onChange={(e) =>
                  setForm({
                    ...form,
                    assignedBy: e.target.value,
                  })
                }
                required
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* START DATE */}
          <div className="space-y-1.5">
            <label htmlFor="task-start-date" className="text-sm font-medium">
              Start Date
            </label>
            <Input
              id="task-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>

          {/* END DATE */}
          <div className="space-y-1.5">
            <label htmlFor="task-end-date" className="text-sm font-medium">
              End Date
            </label>
            <Input
              id="task-end-date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          {/* STATUS */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="task-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="task-status"
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as TaskFormValues["status"],
                })
              }
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );
}
