
"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSignup = mode === "signup";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    startTransition(async () => {
      const result = isSignup
        ? await signup({ fullName, email, password })
        : await login({
            email,
            password,
            next: searchParams.get("next") ?? undefined,
          });

      if (result?.error) {
        setError(result.error);
      }

      if (result?.message) {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {isSignup
            ? "Create an account to get started with Resume AI."
            : "Sign in to continue to your dashboard."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              className="w-full rounded-lg border bg-background px-3 py-2"
              placeholder="Your full name"
            />
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border bg-background px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={72}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="w-full rounded-lg border bg-background px-3 py-2"
            placeholder="At least 8 characters"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="text-sm text-green-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending
            ? "Please wait..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
        <a
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-primary underline"
        >
          {isSignup ? "Sign in" : "Sign up"}
        </a>
      </p>
    </div>
  );
}
