"use client";

import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import type { Task } from "@/components/common/tasks/TaskTable";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const statuses = ["Not Started", "Pending", "In Progress", "Completed"];

type TaskFormValues = Omit<Task, "id">;

type TaskFormProps = {
  initial?: Task | null;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
};

const emptyForm: TaskFormValues = {
  name: "",
  project: "",
  milestone: "",
  employee: "",
  assignedBy: "",
  startDate: "",
  endDate: "",
  status: "Not Started",
};

export default function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          project: initial.project,
          milestone: initial.milestone,
          employee: initial.employee,
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
        employee: initial.employee,
        assignedBy: initial.assignedBy,
        startDate: initial.startDate,
        endDate: initial.endDate,
        status: initial.status,
      });
      return;
    }
    setForm(emptyForm);
  }, [initial]);

  return (
    <Card className="w-full !flex-col !items-start !justify-start p-6">
      <form
        className="w-full space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="w-full">
          <h2 className="ui-section-title">
            {initial ? "Edit Task" : "Add Task"}
          </h2>
          <p className="ui-caption mt-1">
            Manage task details, assignment, and schedule.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="taskName" className="ui-caption">
              Task Name
            </label>
            <Input
              id="taskName"
              placeholder="Enter task name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="project" className="ui-caption">
              Project
            </label>
            <Input
              id="project"
              placeholder="Enter project"
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="milestone" className="ui-caption">
              Milestone
            </label>
            <Input
              id="milestone"
              placeholder="Enter milestone"
              value={form.milestone}
              onChange={(e) => setForm({ ...form, milestone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="assignedEmployee" className="ui-caption">
              Assigned Employee
            </label>
            <Input
              id="assignedEmployee"
              placeholder="Enter employee name"
              value={form.employee}
              onChange={(e) => setForm({ ...form, employee: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="assignedBy" className="ui-caption">
              Assigned By
            </label>
            <Input
              id="assignedBy"
              placeholder="Enter assigned by"
              value={form.assignedBy}
              onChange={(e) => setForm({ ...form, assignedBy: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="startDate" className="ui-caption">
              Start Date
            </label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="endDate" className="ui-caption">
              End Date
            </label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="status" className="ui-caption">
              Status
            </label>
            <select
              id="status"
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-cs-primary-100/30 focus-visible:outline-none"
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

        <div className="flex w-full justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );
}
