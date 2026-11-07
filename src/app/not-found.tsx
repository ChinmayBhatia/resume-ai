import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">404</p>
      <h1 className="font-serif text-5xl">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This page does not exist, or it belongs to another account.
      </p>
      <Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>
    </main>
  );
}