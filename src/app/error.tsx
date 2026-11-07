"use client";
import { ErrorView } from "@/components/shared/error-view";

// The error text is deliberately not shown: it could contain internal details.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} />;
}