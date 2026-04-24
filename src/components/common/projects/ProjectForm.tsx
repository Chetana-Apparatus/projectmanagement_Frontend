"use client";

import { useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export type ProjectFormValues = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
};

type Props = {
  initialValues?: ProjectFormValues;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
};

type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;
const MAX_TEXT_LENGTH = 15;

export default function ProjectForm({
  initialValues,
  onSubmit,
  onCancel,
}: Props) {
  const emptyForm: ProjectFormValues = {
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  };

  const [form, setForm] = useState<ProjectFormValues>(
    initialValues || emptyForm,
  );
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setForm(initialValues || emptyForm);
    setErrors({});
  }, [initialValues]);

  const validate = () => {
    const nextErrors: FormErrors = {};
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) nextErrors.name = "Project name is required";
    else if (name.length > MAX_TEXT_LENGTH) {
      nextErrors.name = `Project name must be ${MAX_TEXT_LENGTH} characters or fewer`;
    }

    if (!description) nextErrors.description = "Description is required";
    else if (description.length > MAX_TEXT_LENGTH) {
      nextErrors.description = `Description must be ${MAX_TEXT_LENGTH} characters or fewer`;
    }

    if (!form.startDate) nextErrors.startDate = "Start date is required";
    if (!form.endDate) nextErrors.endDate = "End date is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    });
  };

  return (
    <Card className="w-full !flex-col !items-start !justify-start p-6 space-y-5">
      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div className="w-full">
          <h2 className="ui-section-title">
            {initialValues ? "Edit Project" : "Add Project"}
          </h2>
          <p className="ui-caption mt-1">
            Provide project details and timeline.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="projectName" className="ui-caption">
              Project Name
            </label>
            <Input
              id="projectName"
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name ? (
              <p className="text-xs text-red-500">{errors.name}</p>
            ) : null}
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="description" className="ui-caption">
              Description
            </label>
            <Input
              id="description"
              maxLength={MAX_TEXT_LENGTH}
              placeholder="Enter short description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : null}
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
            {errors.startDate ? (
              <p className="text-xs text-red-500">{errors.startDate}</p>
            ) : null}
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
            {errors.endDate ? (
              <p className="text-xs text-red-500">{errors.endDate}</p>
            ) : null}
          </div>
        </div>

        <div className="flex w-full justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Card>
  );
}
