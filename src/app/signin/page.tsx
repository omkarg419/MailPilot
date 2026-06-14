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
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
      <SignInForm redirectTo={params.callbackUrl} error={params.error} />
    </main>
  );
}
