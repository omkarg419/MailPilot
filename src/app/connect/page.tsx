import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

type ConnectCardProps = {
  title: string;
  description: string;
  href: string;
  connected: boolean;
};

function ConnectCard({ title, description, href, connected }: ConnectCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
        {connected && (
          <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            ✓ Connected
          </span>
        )}
      </div>

      {connected ? (
        <span className="inline-flex w-fit cursor-default items-center rounded-full border border-zinc-800 px-6 py-2.5 text-sm font-semibold text-zinc-500">
          Done
        </span>
      ) : (
        <a
          href={href}
          className="inline-flex w-fit items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          Connect
        </a>
      )}
    </div>
  );
}

export default async function ConnectPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  const { gmail, calendar } = await getConnectionFlags(session.user.id);
  if (gmail && calendar) {
    redirect("/mail");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-100">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight">
          Connect your accounts
        </h1>
        <p className="mt-2 text-zinc-400">
          MailPilot needs access to your Gmail and Google Calendar to get
          started. Connect both to continue.
        </p>

        <div className="mt-10 flex flex-col gap-4">
          <ConnectCard
            title="Connect Gmail"
            description="Let MailPilot read, triage, and draft replies in your inbox."
            href="/api/corsair/connect?plugin=gmail"
            connected={gmail}
          />
          <ConnectCard
            title="Connect Calendar"
            description="Let MailPilot view and schedule events on your Google Calendar."
            href="/api/corsair/connect?plugin=googlecalendar"
            connected={calendar}
          />
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Signed in as {session.user.email ?? session.user.name}
        </p>
      </div>
    </main>
  );
}
