"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";

type UserRole = "admin" | "BA" | "Employee";

const roleRedirectMap: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  BA: "/business-analyst",
  Employee: "/employee",
};

const LoginPage = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const getRoleFromEmail = (value: string): UserRole => {
    const normalized = value.trim().toLowerCase();

    if (normalized.includes("admin")) return "admin";
    if (normalized.includes("ba")) return "BA";

    return "Employee";
  };

  const isAdmin = getRoleFromEmail(email) === "admin";

  const validateForm = () => {
    const normalizedEmail = email.trim().toLowerCase();

    // ✅ Email domain validation
    if (!normalizedEmail.endsWith("@apparatus.solutions")) {
      return "Only @apparatus.solutions emails are allowed";
    }

    // ✅ Password validation
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }

    return "";
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      const userRole = getRoleFromEmail(email);
      const targetRoute = roleRedirectMap[userRole] ?? "/";
      window.localStorage.setItem("user_role", userRole);
      showToast("Signed in successfully", "success");

      router.push(targetRoute);
    }, 1000);
  };

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden">
      <div className="body-bg" />
      <div className="pattern-bg" />

      <div className="app-glass flex w-full flex-1 flex-col items-center justify-center p-4">
        <Card variant="auth" className="card-width flex flex-col gap-8">
          <header className="flex w-full flex-col items-start gap-1">
            <h1 className="h1">Sign in</h1>
            <p className="ui-body-muted">
              Enter your credentials to access your account
            </p>
          </header>

          <form
            className="flex w-full flex-col gap-5"
            noValidate
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@apparatus.solutions"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>

        {/* Show forgot-password for admin login */}
        {isAdmin && (
          <Link href="/auth/forgot-password" className="link mt-4">
            Forgot password?
          </Link>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
