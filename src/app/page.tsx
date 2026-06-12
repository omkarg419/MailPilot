import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { getConnectionFlags } from "@/server/corsair";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const { gmail, calendar } = await getConnectionFlags(session.user.id);
    redirect(gmail && calendar ? "/mail" : "/connect");
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 text-zinc-100">
      {/* background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]"
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-24 text-center">
        <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-400">
          AI-native email, built for speed
        </span>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          Mail<span className="bg-linear-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Pilot</span>
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          The AI-native Gmail and Calendar platform. Triage your inbox, draft
          replies, and manage your schedule — all on autopilot.
        </p>

        <a
          href="/api/auth/signin"
          className="group mt-2 inline-flex items-center gap-3 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-indigo-500/10 transition hover:bg-zinc-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"
            />
          </svg>
          Sign in with Google
        </a>

        <p className="text-xs text-zinc-600">
          Connect your Gmail and Google Calendar in under a minute.
        </p>
      </div>
    </main>
  );
}
