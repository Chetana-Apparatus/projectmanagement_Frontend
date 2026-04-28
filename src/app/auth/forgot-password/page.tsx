"use client";

import Link from "next/link";
import { useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import PasswordInput from "@/components/ui/passwordInput";
import { apiUrl } from "@/lib/api-base";
import { messageFromUnknownBody } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!normalizedEmail.endsWith("@apparatus.solutions")) {
      showToast("Only @apparatus.solutions emails are allowed", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl("/api/v1/auth/admin/forgot-password/request-otp"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
          cache: "no-store",
        },
      );
      const body = await res.json().catch(() => ({}));

      if (res.ok && body?.success) {
        showToast(body.message || "Check your inbox for an OTP.", "success");
        setStep("reset");
        return;
      }
      showToast(messageFromUnknownBody(body), "error");
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp.trim())) {
      showToast("Enter the 6-digit OTP from your email.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl("/api/v1/auth/admin/forgot-password/verify-otp"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            otp: otp.trim(),
            new_password: newPassword,
          }),
          cache: "no-store",
        },
      );
      const body = await res.json().catch(() => ({}));

      if (res.ok && body?.success) {
        showToast(
          "Password updated. Sign in with your new password.",
          "success",
        );
        setStep("email");
        setOtp("");
        setNewPassword("");
      } else {
        showToast(messageFromUnknownBody(body), "error");
      }
    } catch {
      showToast("Could not reach the server.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden">
      <div className="body-bg" />
      <div className="pattern-bg" />

      <div className="app-glass flex w-full flex-1 items-center justify-center p-4">
        <Card variant="auth" className="card-width flex flex-col gap-6">
          <header className="space-y-1">
            <h1 className="h1">Forgot password (Admin)</h1>
            <p className="ui-body-muted">
              We&apos;ll send a one-time code to your work email so you can set
              a new password. Only Admin accounts may use this flow.
            </p>
          </header>

          {step === "email" ? (
            <form className="space-y-4" onSubmit={handleRequestOtp}>
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleReset}>
              <p className="text-sm text-gray-600">
                OTP sent to <strong>{normalizedEmail}</strong>
              </p>
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium">
                  OTP (6 digits)
                </label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New password
                </label>
                <PasswordInput
                  id="newPassword"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setStep("email")}
                  disabled={loading}
                >
                  ← Change email
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Saving…" : "Reset password"}
                </Button>
              </div>
            </form>
          )}

          <Link href="/auth/login" className="link text-center">
            Back to sign in
          </Link>
        </Card>
      </div>
    </div>
  );
}
