"use client";

import Link from "next/link";
import { useState } from "react";
import Card from "@/components/common/card/Card";
import { useToast } from "@/components/common/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast("Please enter your email.", "error");
      return;
    }

    showToast("If the email exists, a reset link has been sent.", "success");
  };

  return (
    <div className="relative flex w-full flex-1 flex-col overflow-hidden">
      <div className="body-bg" />
      <div className="pattern-bg" />

      <div className="app-glass flex w-full flex-1 items-center justify-center p-4">
        <Card variant="auth" className="card-width flex flex-col gap-6">
          <header className="space-y-1">
            <h1 className="h1">Forgot password</h1>
            <p className="ui-body-muted">
              Enter your work email to receive a password reset link.
            </p>
          </header>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              />
            </div>

            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>

          <Link href="/auth/login" className="link text-center">
            Back to sign in
          </Link>
        </Card>
      </div>
    </div>
  );
}
