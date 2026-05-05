"use client";

import { Loader2 } from "lucide-react";
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
  /** YYYY-MM-DD */
  deadline?: string;
  /** YYYY-MM-DD */
  startDate?: string;
};

export type MilestoneOption = {
  id: string;
  name: string;
  projectId: string;
  /** YYYY-MM-DD milestone end */
  expectedDate?: string;
  /** YYYY-MM-DD milestone start */
  startDate?: string;
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

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function latestYmd(...vals: (string | undefined | null)[]): string | undefined {
  const keys = vals
    .map((v) => (v ? ymdKey(v) : null))
    .filter(Boolean) as string[];
  if (!keys.length) return undefined;
  return keys.reduce((a, b) => (a > b ? a : b));
}

function earliestYmd(
  ...vals: (string | undefined | null)[]
): string | undefined {
  const keys = vals
    .map((v) => (v ? ymdKey(v) : null))
    .filter(Boolean) as string[];
  if (!keys.length) return undefined;
  return keys.reduce((a, b) => (a < b ? a : b));
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
  const [form, setForm] = useState<TaskFormValues>(() =>
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
      : { ...emptyForm, startDate: todayYmd() },
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
    setForm({ ...emptyForm, startDate: todayYmd() });
    setDateError(null);
  }, [initial]);

  const availableMilestones = form.project
    ? milestones.filter((milestone) => milestone.projectId === form.project)
    : milestones;

  const selectedProject = projects.find((p) => p.id === form.project);
  const selectedMilestone = milestones.find((m) => m.id === form.milestone);

  const validateExpectedDate = (
    expectedDate: string,
    taskStartDate: string,
    projectId: string,
    milestoneId: string,
  ): string | null => {
    const exp = ymdKey(expectedDate);
    if (!exp) return null;
    const taskSt = taskStartDate ? ymdKey(taskStartDate) : null;
    if (taskSt && exp < taskSt) {
      return "Expected date cannot be before the task start date.";
    }
    const proj = projects.find((p) => p.id === projectId);
    const projCap = proj?.deadline ? ymdKey(proj.deadline) : null;
    const projStart = proj?.startDate ? ymdKey(proj.startDate) : null;
    if (projStart && exp < projStart) {
      return `Expected date cannot be before the project start date (${projStart}).`;
    }
    const ms = milestones.find((m) => m.id === milestoneId);
    const msCap = ms?.expectedDate ? ymdKey(ms.expectedDate) : null;
    const msStart = ms?.startDate ? ymdKey(ms.startDate) : null;
    if (msStart && exp < msStart) {
      return `Expected date cannot be before the milestone start date (${msStart}).`;
    }
    if (projCap && exp > projCap) {
      return `Expected date cannot be after the project deadline (${projCap}).`;
    }
    if (msCap && exp > msCap) {
      return `Expected date cannot be after the milestone end date (${msCap}).`;
    }
    return null;
  };

  return (
    <Card className="w-full !flex-col !items-start !justify-start p-6 font-sans">
      <form
        className="w-full space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (submitting) return;
          const err = validateExpectedDate(
            form.expectedDate,
            form.startDate,
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
        <div className="w-full text-center">
          <p className="font-sans text-lg font-semibold text-gray-900">
            {initial ? "Edit Task" : "Add Task"}
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="task-name"
              className="text-sm font-medium text-gray-700"
            >
              Task Name
            </label>
            <Input
              id="task-name"
              placeholder="Enter task name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="task-description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="task-description"
              className="ui-textarea"
              placeholder="Describe the task…"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-project"
              className="text-sm font-medium text-gray-700"
            >
              Project
            </label>
            <select
              id="task-project"
              className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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

          <div className="space-y-1.5">
            <label
              htmlFor="task-milestone"
              className="text-sm font-medium text-gray-700"
            >
              Milestone
            </label>
            <select
              id="task-milestone"
              className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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

          {showAssignedBy && (
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="task-assigned-by"
                className="text-sm font-medium text-gray-700"
              >
                Assigned By
              </label>
              <select
                id="task-assigned-by"
                className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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

          <div className="space-y-1.5">
            <label
              htmlFor="task-start-date"
              className="text-sm font-medium text-gray-700"
            >
              Start Date
            </label>
            <Input
              id="task-start-date"
              type="date"
              min={latestYmd(
                selectedProject?.startDate,
                selectedMilestone?.startDate,
              )}
              value={form.startDate}
              onChange={(e) => {
                setForm({ ...form, startDate: e.target.value });
                setDateError(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="task-expected-date"
              className="text-sm font-medium text-gray-700"
            >
              Expected Date
            </label>
            <Input
              id="task-expected-date"
              type="date"
              min={latestYmd(
                form.startDate,
                selectedProject?.startDate,
                selectedMilestone?.startDate,
              )}
              max={earliestYmd(
                selectedProject?.deadline,
                selectedMilestone?.expectedDate,
              )}
              value={form.expectedDate}
              onChange={(e) => {
                setForm({ ...form, expectedDate: e.target.value });
                setDateError(null);
              }}
            />
            {selectedProject ? (
              <p className="ui-caption text-muted-foreground">
                Project: start {ymdKey(selectedProject.startDate ?? "") ?? "—"}
                {selectedProject.deadline
                  ? `, deadline ${ymdKey(selectedProject.deadline)}`
                  : ""}
                {selectedMilestone?.id
                  ? ` · Milestone: start ${ymdKey(selectedMilestone.startDate ?? "") ?? "—"}`
                  : null}
                {selectedMilestone?.expectedDate
                  ? `, end ${ymdKey(selectedMilestone.expectedDate)}`
                  : null}
              </p>
            ) : null}
            {dateError ? (
              <p className="ui-caption text-red-600">{dateError}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="task-status"
              className="text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="task-status"
              className="h-10 w-full rounded-md border border-cs-border bg-white px-3 text-sm text-cs-text"
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

        <div className="flex justify-end gap-2 border-t border-cs-border pt-4">
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
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
