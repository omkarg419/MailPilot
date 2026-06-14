import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { auth } from "@/server/auth";

export const metadata: Metadata = {
  title: "Sign in — MailPilot",
};

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_100%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]"
      />

      <div className="relative z-10 w-full max-w-md">
        <SignInForm redirectTo={params.callbackUrl} error={params.error} />
      </div>
    </main>
  );
}
