"use client";

import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type SelectOption = {
  id: string;
  label: string;
};

export type MilestoneFormValues = {
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  deadline: string;
  assignedEmployeeIds: string[];
  watcherIds: string[];
};

type MilestoneFormProps = {
  mode: "create" | "edit";
  projects: SelectOption[];
  employees: SelectOption[];
  watchers: SelectOption[];
  initialValues?: MilestoneFormValues;
  onCancel: () => void;
  onSubmit: (values: MilestoneFormValues) => void;
};

type FormErrors = Partial<Record<keyof MilestoneFormValues, string>>;

const emptyForm: MilestoneFormValues = {
  projectId: "",
  name: "",
  startDate: "",
  endDate: "",
  deadline: "",
  assignedEmployeeIds: [],
  watcherIds: [],
};

function getSelectedValues(event: React.ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions, (option) => option.value);
}

export default function MilestoneForm({
  mode,
  projects,
  employees,
  watchers,
  initialValues,
  onCancel,
  onSubmit,
}: MilestoneFormProps) {
  const [values, setValues] = useState<MilestoneFormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!initialValues) {
      setValues(emptyForm);
      return;
    }
    setValues(initialValues);
  }, [initialValues]);

  const title = mode === "create" ? "Create Milestone" : "Edit Milestone";

  const setField = <K extends keyof MilestoneFormValues>(
    field: K,
    value: MilestoneFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!values.projectId.trim()) nextErrors.projectId = "Project is required";
    if (!values.name.trim()) nextErrors.name = "Milestone name is required";
    if (!values.startDate) nextErrors.startDate = "Start date is required";
    if (!values.endDate) nextErrors.endDate = "End date is required";
    if (!values.deadline) nextErrors.deadline = "Deadline is required";

    if (values.assignedEmployeeIds.length === 0) {
      nextErrors.assignedEmployeeIds = "Select at least one assigned employee";
    }

    if (values.watcherIds.length === 0) {
      nextErrors.watcherIds = "Select at least one watcher";
    }

    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      nextErrors.endDate = "End date cannot be before start date";
    }

    if (values.endDate && values.deadline && values.deadline < values.endDate) {
      nextErrors.deadline = "Deadline cannot be before end date";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...values,
      name: values.name.trim(),
    });
  };

  const fieldClass = "space-y-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";
  const errorClass = "text-xs text-red-500";

  const selectClass =
    "h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30";

  const multiSelectClass =
    "min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30";

  return (
    <Card
      variant="surface"
      padding="lg"
      className="w-full h-[calc(100vh-7rem)] items-stretch justify-start overflow-hidden rounded-2xl border border-border/80 bg-white/95 px-6 shadow-2xl sm:px-8 lg:px-10"
    >
      <form
        onSubmit={handleSubmit}
        className="h-full w-full max-w-3xl space-y-5 overflow-y-auto pr-1"
      >
        {/* HEADER */}
        <div className="space-y-1 text-center">
          <h2 className="h3">{title}</h2>
          <p className="ui-body-muted">
            Manage milestone timeline, assignment, and project ownership.
          </p>
        </div>

        {/* PROJECT */}
        <div className={fieldClass}>
          <label htmlFor="projectId" className={labelClass}>
            Project
          </label>
          <select
            id="projectId"
            value={values.projectId}
            onChange={(e) => setField("projectId", e.target.value)}
            className={selectClass}
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.projectId && <p className={errorClass}>{errors.projectId}</p>}
        </div>

        {/* NAME */}
        <div className={fieldClass}>
          <label htmlFor="name" className={labelClass}>
            Milestone Name
          </label>
          <Input
            id="name"
            maxLength={30}
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Enter milestone name"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        {/* DATES */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={fieldClass}>
            <label htmlFor="startDate" className={labelClass}>
              Start Date
            </label>
            <Input
              id="startDate"
              type="date"
              value={values.startDate}
              onChange={(e) => setField("startDate", e.target.value)}
            />
            {errors.startDate && (
              <p className={errorClass}>{errors.startDate}</p>
            )}
          </div>

          <div className={fieldClass}>
            <label htmlFor="endDate" className={labelClass}>
              End Date
            </label>
            <Input
              id="endDate"
              type="date"
              value={values.endDate}
              onChange={(e) => setField("endDate", e.target.value)}
            />
            {errors.endDate && <p className={errorClass}>{errors.endDate}</p>}
          </div>

          <div className={fieldClass}>
            <label htmlFor="deadline" className={labelClass}>
              Deadline
            </label>
            <Input
              id="deadline"
              type="date"
              value={values.deadline}
              onChange={(e) => setField("deadline", e.target.value)}
            />
            {errors.deadline && <p className={errorClass}>{errors.deadline}</p>}
          </div>
        </div>

        {/* MULTI SELECT */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={fieldClass}>
            <label htmlFor="assignedEmployeeIds" className={labelClass}>
              Assigned Employees
            </label>
            <select
              id="assignedEmployeeIds"
              multiple
              value={values.assignedEmployeeIds}
              onChange={(e) =>
                setField("assignedEmployeeIds", getSelectedValues(e))
              }
              className={multiSelectClass}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
            {errors.assignedEmployeeIds && (
              <p className={errorClass}>{errors.assignedEmployeeIds}</p>
            )}
          </div>

          <div className={fieldClass}>
            <label htmlFor="watcherIds" className={labelClass}>
              Watchers (BA)
            </label>
            <select
              id="watcherIds"
              multiple
              value={values.watcherIds}
              onChange={(e) => setField("watcherIds", getSelectedValues(e))}
              className={multiSelectClass}
            >
              {watchers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
            {errors.watcherIds && (
              <p className={errorClass}>{errors.watcherIds}</p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Create Milestone" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
