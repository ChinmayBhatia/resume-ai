
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Suspense fallback={<div>Loading...</div>}>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
