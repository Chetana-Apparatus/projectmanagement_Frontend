"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import { parseTechFromApi } from "@/lib/admin-mappers";
import type { UserRecord } from "./UserTable";

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  resetPassword: boolean;

  role: UserRecord["role"];
  designation: string;
  developerType: string;
  techStack: string[];
  techOther: string;
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
  role: "Employee",
  designation: "",
  developerType: "",
  techStack: [],
  techOther: "",
};

export default function UserForm({
  mode,
  initialValues,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState(initialState);
  const [techError, setTechError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setValues({ ...initialState });
      setTechError("");
      return;
    }

    const parsed = parseTechFromApi(
      initialValues.apiTechStack,
      initialValues.techNotes,
    );

    setValues((prev) => ({
      ...prev,
      firstName: initialValues.firstName || "",
      lastName: initialValues.lastName || "",
      email: initialValues.email || "",
      password: "",
      role: initialValues.role ?? prev.role ?? "Employee",
      designation: initialValues.designation || "",
      developerType: initialValues.developerType || "",
      techStack: parsed.techStack.length
        ? parsed.techStack
        : initialValues.techStack || [],
      techOther: parsed.techOther,
    }));
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (values.role === "Employee") {
      const hasTech =
        values.techStack.length > 0 || values.techOther.trim().length > 0;
      if (!hasTech) {
        setTechError("Select at least one tech or add details under Other.");
        return;
      }
    }
    setTechError("");
    onSubmit(values);
  };

  const showEmployeeFields = values.role === "Employee";

  const toggleTech = (label: string) => {
    setTechError("");
    setValues((prev) => {
      const has = prev.techStack.includes(label);
      const techStack = has
        ? prev.techStack.filter((t) => t !== label)
        : [...prev.techStack, label];
      return { ...prev, techStack };
    });
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

          {/* ROLE */}
          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="user-role"
              className="text-sm font-medium text-cs-heading"
            >
              Role
            </label>
            <select
              id="user-role"
              value={values.role}
              onChange={(e) => {
                const role = e.target.value as UserRecord["role"];
                setTechError("");
                setValues((prev) => ({
                  ...prev,
                  role,
                  ...(role === "Employee"
                    ? {}
                    : {
                        designation: "",
                        developerType: "",
                        techStack: [],
                        techOther: "",
                      }),
                }));
              }}
              className="h-11 w-full rounded-lg border px-3 text-sm"
            >
              <option value="Admin">Admin</option>
              <option value="BA">BA</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {showEmployeeFields ? (
            <>
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

              {/* TECH STACK — checkboxes + Other */}
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-cs-heading">
                  Tech Stack
                </span>
                <p className="text-xs text-gray-500">
                  Select one or more. Use Other for anything not listed.
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {TECH_STACK.map((tech) => (
                    <label
                      key={tech}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={values.techStack.includes(tech)}
                        onChange={() => toggleTech(tech)}
                      />
                      {tech}
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5 pt-1">
                  <label
                    htmlFor="user-tech-other"
                    className="text-sm text-gray-700"
                  >
                    Other (custom)
                  </label>
                  <Input
                    id="user-tech-other"
                    className="h-10 w-full rounded-lg border px-3 text-sm"
                    placeholder="e.g. Kubernetes, Rust…"
                    value={values.techOther}
                    onChange={(e) => {
                      setTechError("");
                      setValues({ ...values, techOther: e.target.value });
                    }}
                  />
                  {techError ? (
                    <p className="text-xs text-red-600">{techError}</p>
                  ) : null}
                </div>
                {(values.techStack.length > 0 ||
                  values.techOther.trim().length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {values.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600"
                      >
                        {tech}
                      </span>
                    ))}
                    {values.techOther.trim() ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        Other: {values.techOther.trim()}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* PASSWORD */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-password"
              className="text-sm font-medium text-cs-heading"
            >
              {mode === "create" ? "Password" : "New Password (optional)"}
            </label>
            <PasswordInput
              id="user-password"
              className="h-11 w-full rounded-lg border px-3 text-sm"
              placeholder={
                mode === "create"
                  ? "Enter password (min. 6 characters)"
                  : "Enter new password to reset and email user"
              }
              value={values.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValues({ ...values, password: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              {mode === "create"
                ? "Password must be at least 6 characters."
                : "Leave empty if you do not want to change the password."}
            </p>
          </div>
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
