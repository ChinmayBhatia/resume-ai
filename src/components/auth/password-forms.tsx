"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, updatePassword } from "@/lib/auth/actions";

const card = "w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setError("");
    startTransition(async () => {
      const res = await requestPasswordReset({ email });
      if (res.error) toast.error(res.error);
      else setSent(true);
    });
  }

  return (
    <div className={card}>
      <h1 className="mb-1 font-serif text-3xl">Reset your password</h1>
      {sent ? (
        <p className="mt-4 text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way. Open it in this same browser.
        </p>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">Enter your email and we will send you a link.</p>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to log in</Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setError("");
    startTransition(async () => {
      const res = await updatePassword({ password }); // redirects to the dashboard on success
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <div className={card}>
      <h1 className="mb-1 font-serif text-3xl">Choose a new password</h1>
      <p className="mb-6 text-sm text-muted-foreground">Use at least 8 characters.</p>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}