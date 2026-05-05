"use client";

import { Loader2, X } from "lucide-react";
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
  "Delayed",
] as const;

type EmployeeOption = {
  id: string;
  name: string;
};

export type ProjectOption = {
  id: string;
  name: string;
  /** YYYY-MM-DD from API */
  deadline?: string;
};

export type MilestoneOption = {
  id: string;
  name: string;
  projectId: string;
  /** YYYY-MM-DD from API */
  expectedDate?: string;
};

export type TaskFormValues = {
  name: string;
  description: string;
  project: string;
  milestone: string;
  assignedBy: string;
  startDate: string;
  expectedDate: string;
  status: Task["status"];
};

type TaskFormProps = {
  initial?: Task | null;
  employees?: EmployeeOption[];
  projects?: ProjectOption[];
  milestones?: MilestoneOption[];
  showAssignedBy?: boolean;
  submitting?: boolean;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
};

const emptyForm: TaskFormValues = {
  name: "",
  description: "",
  project: "",
  milestone: "",
  assignedBy: "",
  startDate: "",
  expectedDate: "",
  status: "Not Started",
};

function ymdKey(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  return t.split("T")[0];
}

export default function TaskForm({
  initial,
  employees = [],
  projects = [],
  milestones = [],
  showAssignedBy = false,
  submitting = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormValues>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          project: initial.project,
          milestone: initial.milestone,
          assignedBy: initial.assignedBy,
          startDate: initial.startDate,
          expectedDate: initial.expectedDate
            ? initial.expectedDate.split("T")[0]
            : "",
          status: initial.status,
        }
      : emptyForm,
  );
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        description: initial.description ?? "",
        project: initial.project,
        milestone: initial.milestone,
        assignedBy: initial.assignedBy,
        startDate: initial.startDate,
        expectedDate: initial.expectedDate
          ? initial.expectedDate.split("T")[0]
          : "",
        status: initial.status,
      });
      return;
    }
    setForm(emptyForm);
    setDateError(null);
  }, [initial]);

  const availableMilestones = form.project
    ? milestones.filter((milestone) => milestone.projectId === form.project)
    : milestones;

  const selectedProject = projects.find((p) => p.id === form.project);
  const selectedMilestone = milestones.find((m) => m.id === form.milestone);

  const validateExpectedDate = (
    expectedDate: string,
    projectId: string,
    milestoneId: string,
  ): string | null => {
    const exp = ymdKey(expectedDate);
    if (!exp) return null;
    const proj = projects.find((p) => p.id === projectId);
    const projCap = proj?.deadline ? ymdKey(proj.deadline) : null;
    const ms = milestones.find((m) => m.id === milestoneId);
    const msCap = ms?.expectedDate ? ymdKey(ms.expectedDate) : null;
    if (projCap && exp > projCap) {
      return `Expected date cannot be after the project deadline (${projCap}).`;
    }
    if (msCap && exp > msCap) {
      return `Expected date cannot be after the milestone end date (${msCap}).`;
    }
    return null;
  };

  const fieldClass = "flex flex-col gap-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";
  const errorClass = "text-xs text-red-500";
  const selectClass =
    "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30";

  const title = initial ? "Edit Task" : "Add Task";

  return (
    <Card
      variant="surface"
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 !bg-white shadow-2xl"
    >
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          if (submitting) return;
          const err = validateExpectedDate(
            form.expectedDate,
            form.project,
            form.milestone,
          );
          if (err) {
            setDateError(err);
            return;
          }
          setDateError(null);
          onSubmit(form);
        }}
      >
        <div className="flex shrink-0 items-start border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="w-9 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-center">
            <h2 className="h2">{title}</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close task form"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 pr-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <div className={`${fieldClass} md:col-span-2`}>
              <label htmlFor="task-name" className={labelClass}>
                Task Name
              </label>
              <Input
                id="task-name"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                placeholder="Enter task name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={`${fieldClass} md:col-span-2`}>
              <label htmlFor="task-description" className={labelClass}>
                Description
              </label>
              <textarea
                id="task-description"
                className="min-h-[90px] w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30"
                placeholder="Describe the task…"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="task-project" className={labelClass}>
                Project
              </label>
              <select
                id="task-project"
                className={selectClass}
                value={form.project}
                onChange={(e) => {
                  setForm({
                    ...form,
                    project: e.target.value,
                    milestone: "",
                  });
                  setDateError(null);
                }}
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

            <div className={fieldClass}>
              <label htmlFor="task-milestone" className={labelClass}>
                Milestone
              </label>
              <select
                id="task-milestone"
                className={selectClass}
                value={form.milestone}
                onChange={(e) => {
                  setForm({ ...form, milestone: e.target.value });
                  setDateError(null);
                }}
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

            {showAssignedBy ? (
              <div className={`${fieldClass} md:col-span-2`}>
                <label htmlFor="task-assigned-by" className={labelClass}>
                  Assigned By
                </label>
                <select
                  id="task-assigned-by"
                  className={selectClass}
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
            ) : null}

            <div className={fieldClass}>
              <label htmlFor="task-start-date" className={labelClass}>
                Start Date
              </label>
              <Input
                id="task-start-date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>

            <div className={fieldClass}>
              <label htmlFor="task-expected-date" className={labelClass}>
                Expected Date
              </label>
              <Input
                id="task-expected-date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                type="date"
                max={
                  [selectedMilestone?.expectedDate, selectedProject?.deadline]
                    .filter(Boolean)
                    .sort()
                    .at(0) ?? undefined
                }
                value={form.expectedDate}
                onChange={(e) => {
                  setForm({ ...form, expectedDate: e.target.value });
                  setDateError(null);
                }}
              />
              {selectedProject?.deadline ? (
                <p className="ui-caption text-muted-foreground">
                  Project deadline: {ymdKey(selectedProject.deadline)}
                  {selectedMilestone?.expectedDate
                    ? ` · Milestone end: ${ymdKey(selectedMilestone.expectedDate)}`
                    : null}
                </p>
              ) : null}
              {dateError ? <p className={errorClass}>{dateError}</p> : null}
            </div>

            <div className={`${fieldClass} md:col-span-2`}>
              <label htmlFor="task-status" className={labelClass}>
                Status
              </label>
              <select
                id="task-status"
                className={selectClass}
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as TaskFormValues["status"],
                  })
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Saving…
              </>
            ) : initial ? (
              "Save Changes"
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
