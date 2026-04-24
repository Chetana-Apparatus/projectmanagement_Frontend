"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/common/card/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import type { UserRecord, UserRole, UserStatus } from "./UserTable";

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  resetPassword: boolean;
};

type UserFormProps = {
  mode: "create" | "edit";
  initialValues?: Partial<UserRecord>;
  onCancel: () => void;
  onSubmit: (values: UserFormValues) => void;
};

type FormErrors = Partial<Record<keyof UserFormValues, string>>;
const MAX_NAME_LENGTH = 15;

const initialState: UserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "Employee",
  status: "Active",
  password: "",
  resetPassword: false,
};

export default function UserForm({
  mode,
  initialValues,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!initialValues) {
      setValues(initialState);
      return;
    }

    setValues((prev) => ({
      ...prev,
      firstName: initialValues.firstName ?? "",
      lastName: initialValues.lastName ?? "",
      email: initialValues.email ?? "",
      role: (initialValues.role as UserRole | undefined) ?? "Employee",
      status: (initialValues.status as UserStatus | undefined) ?? "Active",
      password: "",
      resetPassword: false,
    }));
  }, [initialValues]);

  const title = useMemo(
    () => (mode === "create" ? "Create User" : "Edit User"),
    [mode],
  );

  const setField = <K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!values.firstName.trim())
      nextErrors.firstName = "First name is required";
    else if (values.firstName.trim().length > MAX_NAME_LENGTH) {
      nextErrors.firstName = `First name must be ${MAX_NAME_LENGTH} characters or fewer`;
    }
    if (!values.lastName.trim()) nextErrors.lastName = "Last name is required";
    else if (values.lastName.trim().length > MAX_NAME_LENGTH) {
      nextErrors.lastName = `Last name must be ${MAX_NAME_LENGTH} characters or fewer`;
    }
    if (!values.email.trim()) nextErrors.email = "Email is required";
    if (!values.role) nextErrors.role = "Role is required";

    if (mode === "create" || values.resetPassword) {
      if (!values.password.trim()) nextErrors.password = "Password is required";
      else if (values.password.trim().length < 6)
        nextErrors.password = "Minimum 6 characters required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    onSubmit(values);
  };

  const fieldClass = "space-y-1.5";
  const labelClass = "text-sm font-medium text-cs-heading";
  const errorClass = "text-xs text-red-500";

  return (
    <Card
      variant="surface"
      padding="lg"
      className="w-full h-[calc(100vh-7rem)] items-stretch justify-start overflow-hidden rounded-2xl border border-border/80 bg-white/95 px-6 shadow-2xl sm:px-8 lg:px-10"
    >
      <form
        onSubmit={handleSubmit}
        className="mx-auto h-full w-full max-w-3xl space-y-5 overflow-y-auto pr-1"
      >
        <div className="space-y-1">
          <h2 className="h3">{title}</h2>
          <p className="ui-body-muted">
            {mode === "create"
              ? "Create a new account and send login credentials via email."
              : "Update user details and optionally set a new password."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldClass}>
            <label className={labelClass} htmlFor="firstName">
              First Name
            </label>
            <Input
              id="firstName"
              maxLength={MAX_NAME_LENGTH}
              value={values.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              placeholder="Enter first name"
            />
            {errors.firstName ? (
              <p className={errorClass}>{errors.firstName}</p>
            ) : null}
          </div>

          <div className={fieldClass}>
            <label className={labelClass} htmlFor="lastName">
              Last Name
            </label>
            <Input
              id="lastName"
              maxLength={MAX_NAME_LENGTH}
              value={values.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Enter last name"
            />
            {errors.lastName ? (
              <p className={errorClass}>{errors.lastName}</p>
            ) : null}
          </div>
        </div>

        <div className={fieldClass}>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="name@company.com"
          />
          {errors.email ? <p className={errorClass}>{errors.email}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldClass}>
            <label className={labelClass} htmlFor="role">
              Role
            </label>
            <select
              id="role"
              value={values.role}
              onChange={(e) => setField("role", e.target.value as UserRole)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-cs-primary-100/30 focus-visible:outline-none"
            >
              <option value="Admin">Admin</option>
              <option value="BA">BA</option>
              <option value="Employee">Employee</option>
            </select>
            {errors.role ? <p className={errorClass}>{errors.role}</p> : null}
          </div>

          <div className={fieldClass}>
            <span className={labelClass}>Status</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={values.status === "Active" ? "default" : "secondary"}
                className="h-10 px-4"
                onClick={() => setField("status", "Active")}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={
                  values.status === "Deactivated" ? "default" : "secondary"
                }
                className="h-10 px-4"
                onClick={() => setField("status", "Deactivated")}
              >
                Deactivated
              </Button>
            </div>
          </div>
        </div>

        {(mode === "create" || values.resetPassword) && (
          <div className={fieldClass}>
            <label className={labelClass} htmlFor="password">
              {mode === "create" ? "Password" : "New Password"}
            </label>
            <PasswordInput
              id="password"
              value={values.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setField("password", e.target.value)
              }
              placeholder="Minimum 6 characters"
            />
            {errors.password ? (
              <p className={errorClass}>{errors.password}</p>
            ) : null}
          </div>
        )}

        {mode === "edit" ? (
          <label className="flex items-center gap-2 text-sm text-cs-text">
            <input
              type="checkbox"
              checked={values.resetPassword}
              onChange={(e) => setField("resetPassword", e.target.checked)}
              className="h-4 w-4 rounded border-input text-cs-primary-100 focus:ring-cs-primary-100/30"
            />
            Reset password
          </label>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Create User" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
