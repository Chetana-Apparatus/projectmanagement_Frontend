"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type SelectOption = {
  id: string;
  label: string;
  /** YYYY-MM-DD project deadline */
  deadline?: string;
  /** YYYY-MM-DD project start */
  startDate?: string;
};

export type MilestoneFormValues = {
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  expectedDate: string;
  status: "Not Started" | "In Progress" | "Completed" | "Delayed";
};

type MilestoneFormProps = {
  mode: "create" | "edit";
  projects: SelectOption[];
  initialValues?: MilestoneFormValues;
  onCancel: () => void;
  onSubmit: (values: MilestoneFormValues) => void;
};

type FormErrors = Partial<Record<keyof MilestoneFormValues, string>>;

const emptyForm: MilestoneFormValues = {
  projectId: "",
  name: "",
  description: "",
  startDate: "",
  expectedDate: "",
  status: "Not Started",
};

export default function MilestoneForm({
  mode,
  projects,
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

  const selectedProject = projects.find((p) => p.id === values.projectId);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!values.projectId.trim()) nextErrors.projectId = "Project is required";
    if (!values.name.trim()) nextErrors.name = "Milestone name is required";
    if (!values.startDate) nextErrors.startDate = "Start date is required";
    if (!values.expectedDate)
      nextErrors.expectedDate = "Expected date is required";

    if (
      selectedProject?.startDate &&
      values.startDate &&
      values.startDate < selectedProject.startDate
    ) {
      nextErrors.startDate =
        "Milestone start cannot be before the project start date";
    }
    if (
      values.startDate &&
      values.expectedDate &&
      values.expectedDate < values.startDate
    ) {
      nextErrors.expectedDate = "Expected date cannot be before start date";
    }
    if (
      selectedProject?.deadline &&
      values.expectedDate &&
      values.expectedDate > selectedProject.deadline
    ) {
      nextErrors.expectedDate =
        "Expected date cannot be after the project deadline";
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

  const fieldClass = "flex flex-col gap-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";
  const errorClass = "text-xs text-red-500";

  const selectClass =
    "h-11 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30";

  return (
    <Card
      variant="surface"
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 !bg-white shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-start border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
          <div className="w-9 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1 text-center">
            <h2 className="h2 font-semibold">{title}</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onCancel}
            aria-label="Close milestone form"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6 pr-4">
          {/* PROJECT */}
          <div className={fieldClass}>
            <label htmlFor="milestone-project" className={labelClass}>
              Project
            </label>
            <select
              id="milestone-project"
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
            {errors.projectId && (
              <p className={errorClass}>{errors.projectId}</p>
            )}
          </div>

          <div className={fieldClass}>
            <label htmlFor="milestone-status" className={labelClass}>
              Status
            </label>
            <select
              id="milestone-status"
              value={values.status}
              onChange={(e) =>
                setField(
                  "status",
                  e.target.value as MilestoneFormValues["status"],
                )
              }
              className={selectClass}
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* NAME */}
          <div className={fieldClass}>
            <label htmlFor="milestone-name" className={labelClass}>
              Milestone Name
            </label>
            <Input
              id="milestone-name"
              className="h-11 w-full rounded-lg border px-3 text-sm"
              maxLength={30}
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter milestone name"
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div className={fieldClass}>
            <label htmlFor="milestone-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="milestone-description"
              className="min-h-[90px] w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-cs-primary-100/30"
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Enter milestone description"
            />
          </div>

          {/* DATES */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={fieldClass}>
              <label htmlFor="milestone-start-date" className={labelClass}>
                Start Date
              </label>
              <Input
                id="milestone-start-date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                type="date"
                value={values.startDate}
                min={selectedProject?.startDate ?? undefined}
                onChange={(e) => setField("startDate", e.target.value)}
              />
              {errors.startDate && (
                <p className={errorClass}>{errors.startDate}</p>
              )}
            </div>

            <div className={fieldClass}>
              <label htmlFor="milestone-end-date" className={labelClass}>
                Expected Date
              </label>
              <Input
                id="milestone-end-date"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                type="date"
                value={values.expectedDate}
                min={values.startDate || undefined}
                onChange={(e) => setField("expectedDate", e.target.value)}
                max={selectedProject?.deadline ?? undefined}
              />
              {errors.expectedDate && (
                <p className={errorClass}>{errors.expectedDate}</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
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
