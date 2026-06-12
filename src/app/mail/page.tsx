import { redirect } from "next/navigation";

import { auth } from "@/server/auth";

export default async function MailPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
      <h1 className="text-2xl font-semibold tracking-tight">
        Inbox coming soon
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Your accounts are connected. The MailPilot inbox lands here in Phase 2.
      </p>
    </main>
  );
}
