import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/session";

async function AuthedShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const name = (user.user_metadata?.full_name as string | undefined) || user.email || "Account";
  return <AppShell name={name}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AuthedShell>{children}</AuthedShell>
    </Suspense>
  );
}