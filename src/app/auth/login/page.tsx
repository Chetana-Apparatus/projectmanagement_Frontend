"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import { apiUrl } from "@/lib/api-base";
import { messageFromUnknownBody, routeForRole } from "@/lib/api-client";
import { persistSession } from "@/lib/auth-storage";

type LoginEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    access: string;
    refresh: string;
    user: {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
      role: string | null;
    };
  };
};

function isLoginEnvelopeSuccess(body: unknown): body is LoginEnvelope & {
  success: true;
  data: NonNullable<LoginEnvelope["data"]>;
} {
  if (!body || typeof body !== "object") return false;
  const b = body as LoginEnvelope;
  return Boolean(
    b.success &&
      b.data?.access &&
      b.data.refresh &&
      b.data.user?.id !== undefined &&
      b.data.user.email,
  );
}

/** TEMP integration: manual login against local Django while UI ships — remove comment when done. */
const LoginPage = () => {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
        cache: "no-store",
      });

      const body = (await res.json()) as
        | LoginEnvelope
        | Record<string, unknown>;

      if (res.ok && isLoginEnvelopeSuccess(body)) {
        const { access, refresh, user } = body.data;
        persistSession({
          access,
          refresh,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role ?? null,
          },
        });
        showToast("Signed in successfully", "success");
        router.replace(routeForRole(user.role));
        return;
      }

      showToast(messageFromUnknownBody(body), "error");
    } catch {
      showToast("Could not reach the server. Is the API running?", "error");
    } finally {
      setLoading(false);
    }
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

        <Link href="/auth/forgot-password" className="link mt-4">
          Forgot password? (Admin OTP)
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
