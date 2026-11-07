
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";

type ActionResult = {
  error?: string;
  message?: string;
};

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const signupSchema = credentials.extend({
  fullName: z.string().trim().min(2).max(100),
});

function safeNext(next?: string) {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\")
    ? next
    : "/dashboard";
}

export async function login(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<ActionResult> {
  const parsed = credentials.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Enter a valid email and a password of at least 8 characters.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Incorrect email or password." };
  }

  redirect(safeNext(input.next));
}

export async function signup(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Check your name, email and password (8+ characters).",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: `${siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then log in.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const parsed = z.object({ email: z.email() }).safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  // The same answer whether or not the account exists, so this can't be used to find registered emails.
  return { message: "If an account exists for that email, a reset link is on its way." };
}

export async function updatePassword(input: { password: string }): Promise<ActionResult> {
  const parsed = z.object({ password: z.string().min(8).max(72) }).safeParse(input);
  if (!parsed.success) return { error: "Password must be 8 to 72 characters." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "This reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not update your password. Request a new reset link and try again." };
  redirect("/dashboard");
}

export async function deleteAccount(input: { confirm: string }): Promise<ActionResult> {
  if (input.confirm !== "DELETE") return { error: "Type DELETE to confirm." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // Storage files are not removed by database cascades, so delete them first.
  const { data: files, error: listError } = await supabase.storage.from("resumes").list(user.id, { limit: 1000 });
  if (listError) return { error: "Could not delete your files. Nothing was deleted. Please try again." };
  if (files && files.length > 0) {
    const { error: removeError } = await supabase.storage
      .from("resumes")
      .remove(files.map((f) => `${user.id}/${f.name}`));
    if (removeError) return { error: "Some files could not be removed. Please try again." };
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Your files were removed, but the account could not be deleted. Please try again." };

  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
