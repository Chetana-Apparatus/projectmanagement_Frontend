"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import type { UserRecord } from "./UserTable";

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  resetPassword: boolean;

  designation: string;
  developerType: string;
  techStack: string[];
};

type Props = {
  mode: "create" | "edit";
  initialValues?: Partial<UserRecord>;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => void;
};

const DESIGNATIONS = [
  "Intern",
  "Trainee",
  "Junior Developer",
  "Senior Developer",
];

const DEV_TYPES = ["Frontend", "Backend", "Fullstack"];

const TECH_STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "AI/ML",
  "WordPress",
];

const initialState: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  resetPassword: false,
  designation: "",
  developerType: "",
  techStack: [],
};

export default function UserForm({
  mode,
  initialValues,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState(initialState);

  useEffect(() => {
    if (!initialValues) return;

    setValues((prev) => ({
      ...prev,
      firstName: initialValues.firstName || "",
      lastName: initialValues.lastName || "",
      email: initialValues.email || "",
      designation: initialValues.designation || "",
      developerType: initialValues.developerType || "",
      techStack: initialValues.techStack || [],
    }));
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Card
      padding="none"
      className="flex max-h-[calc(100vh-8rem)] w-full !flex-col !items-stretch !justify-start overflow-hidden rounded-lg border border-border/80 !bg-white shadow-2xl"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        {/* TITLE */}
        <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4 text-center">
          <h2 className="text-lg font-semibold text-cs-heading">
            {mode === "create" ? "Create User" : "Edit User"}
          </h2>
        </div>

        {/* FORM BODY */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-white p-6 pr-4">
          {/* NAME */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="First Name"
              value={values.firstName}
              onChange={(e) =>
                setValues({ ...values, firstName: e.target.value })
              }
            />
            <Input
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="Last Name"
              value={values.lastName}
              onChange={(e) =>
                setValues({ ...values, lastName: e.target.value })
              }
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-email"
              className="text-sm font-medium text-cs-heading"
            >
              Email
            </label>
            <Input
              id="user-email"
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder="Enter email"
              value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
            />
          </div>

          {/* DESIGNATION */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-designation"
              className="text-sm font-medium text-cs-heading"
            >
              Designation
            </label>
            <select
              id="user-designation"
              value={values.designation}
              onChange={(e) =>
                setValues({ ...values, designation: e.target.value })
              }
              className="h-11 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Select Designation</option>
              {DESIGNATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* DEV TYPE */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-developer-type"
              className="text-sm font-medium text-cs-heading"
            >
              Developer Type
            </label>
            <select
              id="user-developer-type"
              value={values.developerType}
              onChange={(e) =>
                setValues({ ...values, developerType: e.target.value })
              }
              className="h-11 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Select Developer Type</option>
              {DEV_TYPES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* TECH STACK MULTI SELECT */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-tech-stack"
              className="text-sm font-medium text-cs-heading"
            >
              Tech Stack
            </label>

            <select
              id="user-tech-stack"
              multiple
              value={values.techStack}
              onChange={(e) => {
                const selectedOptions = Array.from(
                  e.target.selectedOptions,
                ).map((option) => option.value);

                setValues({ ...values, techStack: selectedOptions });
              }}
              className="min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm"
            >
              {TECH_STACK.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            {/* Selected Tags */}
            {values.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {values.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PASSWORD */}
          {mode === "create" && (
            <div className="space-y-1.5">
              <label
                htmlFor="user-password"
                className="text-sm font-medium text-cs-heading"
              >
                Password
              </label>
              <PasswordInput
                id="user-password"
                className="h-11 w-full rounded-lg border px-3 text-sm"
                placeholder="Enter password (min. 6 characters)"
                value={values.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setValues({ ...values, password: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                Password must be at least 6 characters.
              </p>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
