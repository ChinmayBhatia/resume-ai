"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ErrorView({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Error</p>
      <h1 className="font-serif text-4xl">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We could not load this page. Your data is safe. Try again, or go back to your dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild><Link href="/dashboard">Dashboard</Link></Button>
      </div>
    </div>
  );
}