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

const DESIGNATIONS = ["Intern", "Junior Developer", "Senior Developer"];

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

const OFFICE_EMAIL_DOMAIN = "@apparatus.solutions";

export default function UserForm({
  mode,
  initialValues,
  onCancel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState(initialState);
  const [techError, setTechError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!initialValues) {
      setValues({ ...initialState });
      setTechError("");
      setEmailError("");
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
      email: (initialValues.email || "")
        .replace(new RegExp(`${OFFICE_EMAIL_DOMAIN}$`, "i"), "")
        .trim(),
      password: "",
      role: initialValues.role ?? prev.role ?? "Employee",
      designation: initialValues.designation || "",
      developerType: initialValues.developerType || "",
      techStack: parsed.techStack.length
        ? parsed.techStack
        : initialValues.techStack || [],
      techOther: [...parsed.techStack, parsed.techOther]
        .filter((x) => x && x.trim().length > 0)
        .join("\n"),
    }));
  }, [initialValues]);

  const parseTechLines = (raw: string): string[] =>
    raw
      .split(/\r?\n|,/g)
      .map((s) => s.replace(/^\d+[).\-\s]+/, "").trim())
      .filter(Boolean);

  const validateOfficeEmailUser = (emailUser: string): string => {
    const e = emailUser.trim().toLowerCase();
    if (!e) return "Email username is required.";
    if (e.includes("@")) {
      return "Enter only the name part. Domain is fixed.";
    }
    if (!/^[a-z0-9._-]+$/.test(e)) {
      return "Use only letters, numbers, dot, underscore or hyphen.";
    }
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateOfficeEmailUser(values.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    const email = `${values.email.trim().toLowerCase()}${OFFICE_EMAIL_DOMAIN}`;
    if (values.role === "Employee") {
      const manualTech = parseTechLines(values.techOther);
      const hasTech = manualTech.length > 0;
      if (!hasTech) {
        setTechError(
          "Add at least one tech stack item (for example: NestJS, React).",
        );
        return;
      }
      setTechError("");
      onSubmit({
        ...values,
        email,
        techStack: manualTech,
        techOther: "",
      });
      return;
    }
    setTechError("");
    setEmailError("");
    onSubmit({ ...values, email });
  };

  const showEmployeeFields = values.role === "Employee";

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
            <div className="flex h-11 items-stretch overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
              <Input
                id="user-email"
                className="h-full w-full border-0 px-3 text-sm focus-visible:ring-0"
                placeholder="name"
                value={values.email}
                onChange={(e) => {
                  setEmailError("");
                  setValues({
                    ...values,
                    email: e.target.value.replace(/\s+/g, ""),
                  });
                }}
              />
              <span className="inline-flex shrink-0 items-center border-l border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-600">
                {OFFICE_EMAIL_DOMAIN}
              </span>
            </div>
            {!emailError ? (
              <p className="text-xs text-gray-500">
                Enter only username. Domain is fixed.
              </p>
            ) : null}
            {emailError ? (
              <p className="text-xs text-red-600">{emailError}</p>
            ) : null}
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
                <Input
                  id="user-developer-type"
                  className="h-11 w-full rounded-lg border px-3 text-sm"
                  placeholder="e.g. Frontend, Backend, DevOps"
                  value={values.developerType}
                  onChange={(e) =>
                    setValues({ ...values, developerType: e.target.value })
                  }
                />
              </div>

              {/* TECH STACK — manual text */}
              <div className="space-y-1.5">
                <label
                  htmlFor="user-tech-stack"
                  className="text-sm font-medium text-cs-heading"
                >
                  Tech Stack
                </label>
                <p className="text-xs text-gray-500">
                  Enter one tech per line, e.g. NestJS, React, DevOps.
                </p>
                <textarea
                  id="user-tech-stack"
                  className="min-h-[110px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={"1. NestJS\n2. React"}
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
