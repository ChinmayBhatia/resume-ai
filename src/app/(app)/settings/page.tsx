import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DeleteAccount } from "@/components/settings/delete-account";
import { requireUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const name = (user.user_metadata?.full_name as string | undefined) ?? "";
  return (
    <>
      <PageHeader title="Settings" description="Your account and your data." />
      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-3 font-serif text-2xl">Account</h2>
          <dl className="space-y-2 text-sm">
            {name && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Name</dt><dd>{name}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt><dd className="truncate">{user.email}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            See how your data is used in the{" "}
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">Privacy Notice</Link>.
          </p>
        </section>
        <DeleteAccount />
      </div>
    </>
  );
}